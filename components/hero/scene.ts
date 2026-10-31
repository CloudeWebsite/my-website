import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  FURNITURE,
  INTERIOR_LIGHTS,
  MAIN,
  MAIN_RIDGE,
  PITCH,
  POOL,
  ROOMS,
  WALLS,
  WALL_H,
  WING,
  WING_RIDGE,
  mulberry32,
  treeSpots,
  wallFrame,
  type FloorKind,
  type FurnitureTone,
  type TreeSpot,
} from "./house-data";
import { BLUEPRINT, PLAN_BOUNDS, buildPlan, drawPlan, type PlanLayer } from "./plan";
import * as T from "./textures";

/* ───────────────────────────── options ───────────────────────────── */

export type HouseOptions = {
  roof: "gable" | "flat";
  facade: "stone" | "render" | "brick" | "timber";
  roofTone: string;
  ground: "grass" | "sand" | "snow";
  trees: "pine" | "round" | "mixed" | "none";
  mountains: boolean;
  pool: boolean;
  seed: number;
};

export const DEFAULT_HOUSE: HouseOptions = { roof: "gable", facade: "stone", roofTone: "#2a2b2d", ground: "grass", trees: "pine", mountains: true, pool: false, seed: 7 };

export type SceneOptions = { house?: Partial<HouseOptions>; quality?: "high" | "low"; preserveDrawingBuffer?: boolean };

/** Three independent timelines (0 → 3). In the hero they move together. */
export type StageState = { geo: number; env: number; cam: number };

export type CameraOverride = { position: [number, number, number]; target: [number, number, number]; fov: number };

/* ───────────────────────────── helpers ───────────────────────────── */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function keyNum(keys: readonly number[], s: number): number {
  const c = Math.min(Math.max(s, 0), keys.length - 1 - 1e-6);
  const i = Math.floor(c);
  const f = c - i;
  return lerp(keys[i], keys[i + 1], f * f * (3 - 2 * f));
}
function keyColor(out: THREE.Color, keys: readonly THREE.Color[], s: number): THREE.Color {
  const c = Math.min(Math.max(s, 0), keys.length - 1 - 1e-6);
  const i = Math.floor(c);
  const f = c - i;
  return out.copy(keys[i]).lerp(keys[i + 1], f * f * (3 - 2 * f));
}
const col = (hex: string) => new THREE.Color(hex);

/** Box with UVs measured in metres so tiling textures keep their real scale. */
function worldBox(w: number, h: number, d: number): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  const dims: Array<[number, number]> = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let face = 0; face < 6; face++) {
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v;
      uv.setXY(i, uv.getX(i) * dims[face][0], uv.getY(i) * dims[face][1]);
    }
  }
  uv.needsUpdate = true;
  return g;
}

function worldPlane(w: number, d: number): THREE.PlaneGeometry {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d);
  return g;
}

function triangleGeometry(pts: Array<[number, number]>, depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}

/* ───────────────────────────── keyframes ───────────────────────────── */

const ENV = {
  skyTop: [col("#F2F0EB"), col("#EEEBE4"), col("#AFC6D6"), col("#141c30")],
  horizon: [col("#F2F0EB"), col("#EEEBE4"), col("#E7E2D6"), col("#d9946a")],
  fogColor: [col("#F2F0EB"), col("#EEEBE4"), col("#dfe2df"), col("#3b3f52")],
  ground: [col("#F1EFE9"), col("#EAE6DD"), col("#7E8F58"), col("#3a4530")],
  sun: [col("#ffffff"), col("#fff8ee"), col("#fff1dc"), col("#ff9a5c")],
  hemiSky: [col("#ffffff"), col("#ffffff"), col("#dfe9f3"), col("#5b6488")],
  hemiGround: [col("#f2efe8"), col("#efe9dd"), col("#7d7a5a"), col("#2b2620")],
  sunI: [2.4, 2.6, 3.1, 1.1],
  hemiI: [1.2, 1.15, 0.9, 0.6],
  envI: [0.55, 0.6, 0.45, 0.16],
  fog: [0, 0, 0.0035, 0.0065],
  glow: [0, 0, 0.12, 0.85],
  lamps: [0, 0, 0.2, 1],
  bloom: [0, 0, 0, 0.38],
  exposure: [1.0, 1.0, 1.0, 0.95],
  sunAz: [0.6, 0.7, 0.9, -2.2],
  sunEl: [1.25, 1.15, 0.85, 0.16],
} as const;

const CAM = {
  target: [new THREE.Vector3(0, 0, 3.6), new THREE.Vector3(0, 0, 3.6), new THREE.Vector3(0, 0.6, 3.4), new THREE.Vector3(1.2, 2.45, 5.2)],
  radius: [36, 31, 39, 24.5],
  polar: [0.06, 0.32, 0.86, 1.6],
  azimuth: [-0.32, -0.12, 0.72, -0.55],
  fov: [30, 32, 34, 38],
} as const;

/* ───────────────────────────── scene ───────────────────────────── */

type Grower = { obj: THREE.Object3D; order: number; baseY: number };
type Trees = { foliage: Array<{ mesh: THREE.InstancedMesh; spots: TreeSpot[] }>; trunks: THREE.InstancedMesh; all: TreeSpot[]; grown: number };

export class HouseScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(32, 1, 0.1, 1200);
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private house: HouseOptions;
  private quality: "high" | "low";

  private target: StageState = { geo: 0, env: 0, cam: 0 };
  private current: StageState = { geo: 0, env: 0, cam: 0 };
  private pointer = new THREE.Vector2();
  private pointerTarget = new THREE.Vector2();
  private roofOverride: number | null = null;
  private cameraOverride: CameraOverride | null = null;
  private dirty = true;
  private raf = 0;
  private running = false;
  private disposed = false;

  private sky!: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private ground!: THREE.Mesh<THREE.CircleGeometry, THREE.MeshStandardMaterial>;
  private paper!: THREE.Mesh<THREE.CircleGeometry, THREE.MeshStandardMaterial>;
  private sun!: THREE.DirectionalLight;
  private hemi!: THREE.HemisphereLight;
  private lamps: THREE.PointLight[] = [];
  private walls = new THREE.Group();
  private gables = new THREE.Group();
  private roofParts: Grower[] = [];
  private furniture: Grower[] = [];
  private glassMat!: THREE.MeshStandardMaterial;
  private soffit: THREE.MeshStandardMaterial | null = null;
  private blueprint!: { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>; ctx: CanvasRenderingContext2D; tex: THREE.CanvasTexture; layers: PlanLayer[]; drawn: number };
  private labels!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private trees: Trees | null = null;
  private mountains = new THREE.Group();
  private disposables: Array<{ dispose: () => void }> = [];
  private introStart = -1;
  private introDuration = 2600;
  onIntroDone: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, opts: SceneOptions = {}) {
    this.house = { ...DEFAULT_HOUSE, ...opts.house };
    this.quality = opts.quality ?? "high";
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.quality === "high", alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: opts.preserveDrawingBuffer ?? false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.quality === "high" ? 1.75 : 1.25));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.disposables.push(envTex, pmrem);

    this.buildSky();
    this.buildLights();
    this.buildGround();
    this.buildBlueprint();
    this.buildFloors();
    this.buildWalls();
    this.buildRoof();
    this.buildFurniture();
    this.buildTrees();
    if (this.house.mountains) this.buildMountains();

    if (this.quality === "high") {
      const rt = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
      this.composer = new EffectComposer(this.renderer, rt);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0, 0.5, 0.88);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    }
    this.apply();
  }

  /* ───────── build ───────── */

  private buildSky() {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() } },
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying vec3 vP;
        void main(){ float h = clamp(vP.y, 0.0, 1.0); vec3 c = mix(horizon, top, smoothstep(0.0, 0.42, h)); gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), mat);
    this.scene.add(this.sky);
    this.scene.fog = new THREE.FogExp2(0xffffff, 0);
  }

  private buildLights() {
    this.hemi = new THREE.HemisphereLight(0xffffff, 0xeeeeee, 1);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.5);
    this.sun.castShadow = true;
    const size = this.quality === "high" ? 2048 : 1024;
    this.sun.shadow.mapSize.set(size, size);
    const s = this.sun.shadow.camera;
    s.left = -26;
    s.right = 26;
    s.top = 26;
    s.bottom = -26;
    s.near = 1;
    s.far = 120;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.03;
    this.sun.shadow.radius = 4;
    this.sun.target.position.set(0, 0, 3.5);
    this.scene.add(this.sun, this.sun.target);
    for (const [x, y, z] of INTERIOR_LIGHTS) {
      const p = new THREE.PointLight(0xffb36b, 0, 11, 1.6);
      p.position.set(x, y, z);
      this.lamps.push(p);
      this.scene.add(p);
    }
  }

  private buildGround() {
    const tex = T.groundNoise(this.house.seed);
    tex.repeat.set(1 / 24, 1 / 24);
    const geo = new THREE.CircleGeometry(420, 64);
    geo.rotateX(-Math.PI / 2);
    const uv = geo.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - 0.5) * 840, (uv.getY(i) - 0.5) * 840);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, roughness: 1 });
    this.ground = new THREE.Mesh(geo, mat);
    this.ground.receiveShadow = true;
    this.ground.position.y = -0.02;
    this.scene.add(this.ground);
    this.disposables.push(tex);
    // plain drafting-paper disc that dissolves into the landscape
    const paperGeo = new THREE.CircleGeometry(420, 64);
    paperGeo.rotateX(-Math.PI / 2);
    this.paper = new THREE.Mesh(paperGeo, new THREE.MeshStandardMaterial({ color: "#f2f0ea", roughness: 1, transparent: true }));
    this.paper.position.y = -0.01;
    this.paper.receiveShadow = true;
    this.scene.add(this.paper);
  }

  private buildBlueprint() {
    const { x0, z0, x1, z1 } = PLAN_BOUNDS;
    const px = this.quality === "high" ? 2048 : 1536;
    const { tex, ctx } = T.canvasTexture(px);
    const layers = buildPlan({ pool: this.house.pool });
    const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false, fog: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((x0 + x1) / 2, 0.16, (z0 + z1) / 2);
    mesh.renderOrder = 8;
    this.scene.add(mesh);
    this.blueprint = { mesh, ctx, tex, layers, drawn: -1 };
    this.drawBlueprint(0);

    // plan labels for the coloured layout stage
    const lab = T.canvasTexture(px);
    const labelLayers = buildPlan({ pool: this.house.pool }).filter((l) => l.name === "labels");
    drawPlan(lab.ctx, labelLayers, 1, px, { ...BLUEPRINT, ink: "#1b1a18", soft: "rgba(27,26,24,0.6)" }, true);
    lab.tex.needsUpdate = true;
    const lmat = new THREE.MeshBasicMaterial({ map: lab.tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false, opacity: 0 });
    this.labels = new THREE.Mesh(geo.clone(), lmat);
    this.labels.position.set((x0 + x1) / 2, 0.5, (z0 + z1) / 2);
    this.labels.renderOrder = 10;
    this.scene.add(this.labels);
    this.disposables.push(tex, lab.tex);
  }

  drawBlueprint(t: number) {
    const k = Math.round(t * 400) / 400;
    if (k === this.blueprint.drawn) return;
    this.blueprint.drawn = k;
    drawPlan(this.blueprint.ctx, this.blueprint.layers, k, this.blueprint.ctx.canvas.width);
    this.blueprint.tex.needsUpdate = true;
    this.dirty = true;
  }

  private floorMaterial(kind: FloorKind): THREE.MeshStandardMaterial {
    const s = this.house.seed;
    switch (kind) {
      case "oak":
        return new THREE.MeshStandardMaterial({ map: T.planks({ metres: 4, board: 0.19, hue: 30, sat: 48, light: 52, gap: "rgba(70,40,20,0.45)", seed: s + 1 }), roughness: 0.55 });
      case "deck":
        return new THREE.MeshStandardMaterial({ map: T.planks({ metres: 4, board: 0.14, hue: 28, sat: 26, light: 40, gap: "rgba(20,12,6,0.7)", seed: s + 2 }), roughness: 0.8 });
      case "stone":
        return new THREE.MeshStandardMaterial({ map: T.tiles({ metres: 4, w: 0.8, h: 0.8, base: [38, 12, 80], jitter: 4, grout: "#b8b1a4", seed: s + 3 }), roughness: 0.7 });
      case "tile":
        return new THREE.MeshStandardMaterial({ map: T.tiles({ metres: 3, w: 0.3, h: 0.3, base: [40, 6, 88], jitter: 2, grout: "#c9c4ba", seed: s + 4 }), roughness: 0.35 });
      case "paver":
        return new THREE.MeshStandardMaterial({ map: T.tiles({ metres: 4, w: 1.4, h: 0.8, base: [30, 6, 62], jitter: 6, grout: "#5d5a54", seed: s + 5 }), roughness: 0.9 });
      case "water":
        return new THREE.MeshStandardMaterial({ color: "#3b7d8c", roughness: 0.08, metalness: 0.1, emissive: new THREE.Color("#0d3a46"), emissiveIntensity: 0.4 });
    }
  }

  private buildFloors() {
    const cache = new Map<FloorKind, THREE.MeshStandardMaterial>();
    const rooms = this.house.pool ? [...ROOMS, POOL] : ROOMS;
    for (const r of rooms) {
      let mat = cache.get(r.floor);
      if (!mat) {
        mat = this.floorMaterial(r.floor);
        cache.set(r.floor, mat);
        this.disposables.push(mat);
        if (mat.map) this.disposables.push(mat.map);
      }
      const w = r.x1 - r.x0;
      const d = r.z1 - r.z0;
      const raised = r.floor === "deck" ? 0.12 : r.floor === "water" ? 0 : 0.03;
      const geo = r.floor === "deck" ? worldBox(w, raised, d) : worldPlane(w, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((r.x0 + r.x1) / 2, r.floor === "deck" ? raised / 2 : raised, (r.z0 + r.z1) / 2);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.disposables.push(geo);
      if (r.floor === "water") {
        const coping = new THREE.Mesh(worldBox(w + 0.6, 0.06, d + 0.6), this.floorMaterial("stone"));
        coping.position.set(mesh.position.x, 0.0, mesh.position.z);
        coping.receiveShadow = true;
        mesh.position.y = 0.04;
        this.scene.add(coping);
      }
    }
  }

  private facadeMaterial(): THREE.MeshStandardMaterial {
    const s = this.house.seed;
    switch (this.house.facade) {
      case "stone":
        return new THREE.MeshStandardMaterial({ map: T.stackedStone(s), roughness: 0.95 });
      case "brick":
        return new THREE.MeshStandardMaterial({ map: T.brick(s), roughness: 0.9 });
      case "timber":
        return new THREE.MeshStandardMaterial({ map: T.cladding(s), roughness: 0.8 });
      case "render":
        return new THREE.MeshStandardMaterial({ map: T.plaster("#ece8e0", s), roughness: 0.92 });
    }
  }

  private buildWalls() {
    const outer = this.facadeMaterial();
    const inner = new THREE.MeshStandardMaterial({ map: T.plaster("#f1eee8", this.house.seed + 20), roughness: 0.95 });
    const poche = new THREE.MeshStandardMaterial({ color: "#232220", roughness: 0.9 });
    const oak = new THREE.MeshStandardMaterial({ map: T.planks({ metres: 2, board: 0.1, hue: 30, sat: 40, light: 40, gap: "rgba(40,20,10,0.3)", seed: 31 }), roughness: 0.6 });
    const frame = new THREE.MeshStandardMaterial({ color: "#1e1f20", roughness: 0.5, metalness: 0.4 });
    this.glassMat = new THREE.MeshStandardMaterial({ color: "#1b2226", roughness: 0.04, metalness: 0.3, transparent: true, opacity: 0.3, emissive: new THREE.Color("#ff9f52"), emissiveIntensity: 0 });
    this.disposables.push(outer, inner, poche, oak, frame, this.glassMat);

    const interior = (x: number, z: number) => ROOMS.some((r) => !r.outside && x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);

    for (const w of WALLS) {
      const f = wallFrame(w);
      const angle = Math.atan2(-f.uz, f.ux);
      const nx = -f.uz;
      const nz = f.ux;
      const mid = f.point(f.length / 2);
      const plusIsInside = interior(mid[0] + nx * 0.6, mid[1] + nz * 0.6);
      const sideA = w.exterior ? (plusIsInside ? inner : outer) : inner;
      const sideB = w.exterior ? (plusIsInside ? outer : inner) : inner;
      const mats = [inner, inner, poche, inner, sideA, sideB];
      const ext = w.exterior ? w.t / 2 : 0;

      const piece = (s: number, e: number, y0: number, y1: number) => {
        if (e - s < 0.01 || y1 - y0 < 0.01) return;
        const geo = worldBox(e - s, y1 - y0, w.t);
        const m = new THREE.Mesh(geo, mats);
        const c = f.point((s + e) / 2);
        m.position.set(c[0], (y0 + y1) / 2, c[1]);
        m.rotation.y = angle;
        m.castShadow = true;
        m.receiveShadow = true;
        this.walls.add(m);
        this.disposables.push(geo);
      };

      for (const [s, e] of f.solids) piece(s === 0 ? s - ext : s, e === f.length ? e + ext : e, 0, WALL_H);
      for (const o of f.openings) {
        const s = o.at - o.width / 2;
        const e = o.at + o.width / 2;
        piece(s, e, 0, o.sill);
        piece(s, e, o.head, WALL_H);
        const c = f.point(o.at);
        const h = o.head - o.sill;
        if (o.kind === "window" || o.kind === "glazed") {
          const g = new THREE.Mesh(worldBox(o.width, h, 0.03), this.glassMat);
          g.position.set(c[0], o.sill + h / 2, c[1]);
          g.rotation.y = angle;
          this.walls.add(g);
          const bars = o.kind === "glazed" ? Math.max(1, Math.round(o.width / 1.3)) : o.width > 1.7 ? 1 : 0;
          for (let i = 1; i <= bars; i++) {
            const d = s + (o.width * i) / (bars + 1);
            const pc = f.point(d);
            const bar = new THREE.Mesh(worldBox(0.05, h, 0.08), frame);
            bar.position.set(pc[0], o.sill + h / 2, pc[1]);
            bar.rotation.y = angle;
            bar.castShadow = true;
            this.walls.add(bar);
          }
          for (const y of [o.sill + 0.025, o.head - 0.025]) {
            const rail = new THREE.Mesh(worldBox(o.width, 0.05, 0.1), frame);
            rail.position.set(c[0], y, c[1]);
            rail.rotation.y = angle;
            this.walls.add(rail);
          }
        } else if (o.kind === "door" && w.exterior) {
          const leaf = new THREE.Mesh(worldBox(o.width, h, 0.06), oak);
          leaf.position.set(c[0], h / 2, c[1]);
          leaf.rotation.y = angle;
          leaf.castShadow = true;
          this.walls.add(leaf);
        }
      }
    }
    this.scene.add(this.walls);

    // gable ends rise into place as the roof arrives
    if (this.house.roof === "gable") {
      const rise = MAIN_RIDGE - WALL_H;
      const half = (MAIN.z1 - MAIN.z0) / 2;
      for (const x of [MAIN.x0, MAIN.x1]) {
        const geo = triangleGeometry([[-half - 0.15, 0], [half + 0.15, 0], [0, rise + 0.08]], 0.3);
        const m = new THREE.Mesh(geo, [outer, outer]);
        m.rotation.y = Math.PI / 2;
        m.position.set(x, WALL_H, 0);
        m.castShadow = true;
        m.receiveShadow = true;
        this.gables.add(m);
        this.disposables.push(geo);
      }
      // glazed gable to the wing: the glowing timber-lined lantern
      const wrise = WING_RIDGE - WALL_H;
      const whalf = (WING.x1 - WING.x0) / 2;
      const glassTri = triangleGeometry([[-whalf, 0], [whalf, 0], [0, wrise]], 0.03);
      const gt = new THREE.Mesh(glassTri, this.glassMat);
      gt.position.set((WING.x0 + WING.x1) / 2, WALL_H, WING.z1);
      this.gables.add(gt);
      this.disposables.push(glassTri);
      for (const dx of [-1.5, 0, 1.5]) {
        const hgt = wrise * (1 - Math.abs(dx) / whalf);
        const bar = new THREE.Mesh(worldBox(0.06, hgt, 0.1), frame);
        bar.position.set((WING.x0 + WING.x1) / 2 + dx, WALL_H + hgt / 2, WING.z1);
        this.gables.add(bar);
      }
      const beam = new THREE.Mesh(worldBox(WING.x1 - WING.x0, 0.08, 0.12), frame);
      beam.position.set((WING.x0 + WING.x1) / 2, WALL_H, WING.z1);
      this.gables.add(beam);
    }
    this.scene.add(this.gables);
  }

  private buildRoof() {
    const metal = new THREE.MeshStandardMaterial({ map: T.standingSeam(this.house.roofTone, this.house.seed), roughness: 0.42, metalness: 0.55 });
    const soffit = new THREE.MeshStandardMaterial({ map: T.planks({ metres: 3, board: 0.12, hue: 30, sat: 44, light: 56, gap: "rgba(80,40,10,0.25)", seed: 41 }), roughness: 0.6, emissive: new THREE.Color("#ff9d4a"), emissiveIntensity: 0 });
    const edge = new THREE.MeshStandardMaterial({ color: "#1c1d1f", roughness: 0.5, metalness: 0.4 });
    this.disposables.push(metal, soffit, edge);
    this.soffit = soffit;
    const mats = [edge, edge, metal, soffit, edge, edge];
    const th = 0.22;
    const over = 0.6;
    const add = (geo: THREE.BufferGeometry, pos: THREE.Vector3, rot: THREE.Euler, order: number, m: THREE.Material | THREE.Material[] = mats) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.copy(pos);
      mesh.rotation.copy(rot);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.visible = false;
      this.scene.add(mesh);
      this.roofParts.push({ obj: mesh, order, baseY: pos.y });
      this.disposables.push(geo);
    };
    const tp = Math.tan(PITCH);
    const cp = Math.cos(PITCH);
    const sp = Math.sin(PITCH);

    if (this.house.roof === "gable") {
      const spanZ = (MAIN.z1 - MAIN.z0) / 2 + over;
      const slopeW = spanZ / cp;
      const yAt = (dz: number) => MAIN_RIDGE - dz * tp;
      const lenX = MAIN.x1 - MAIN.x0 + over * 2;
      // north slope
      {
        const pos = new THREE.Vector3(0, yAt(spanZ / 2), -spanZ / 2).add(new THREE.Vector3(0, cp, -sp).multiplyScalar(th / 2));
        add(worldBox(lenX, th, slopeW), pos, new THREE.Euler(-PITCH, 0, 0), 0);
      }
      // south slope: west part to the eave, east part stops where the wing begins
      {
        const xw0 = MAIN.x0 - over;
        const xw1 = WING.x0;
        const pos = new THREE.Vector3((xw0 + xw1) / 2, yAt(spanZ / 2), spanZ / 2).add(new THREE.Vector3(0, cp, sp).multiplyScalar(th / 2));
        add(worldBox(xw1 - xw0, th, slopeW), pos, new THREE.Euler(PITCH, 0, 0), 1);
        const span2 = (MAIN.z1 - MAIN.z0) / 2;
        const xe0 = WING.x0;
        const xe1 = MAIN.x1 + over;
        const pos2 = new THREE.Vector3((xe0 + xe1) / 2, yAt(span2 / 2), span2 / 2).add(new THREE.Vector3(0, cp, sp).multiplyScalar(th / 2));
        add(worldBox(xe1 - xe0, th, span2 / cp), pos2, new THREE.Euler(PITCH, 0, 0), 1);
      }
      // wing
      {
        const spanX = (WING.x1 - WING.x0) / 2 + over;
        const w = spanX / cp;
        const z0 = 1.5;
        const z1 = WING.z1 + over;
        const ridgeX = (WING.x0 + WING.x1) / 2;
        const yW = (dx: number) => WING_RIDGE - dx * tp;
        const posW = new THREE.Vector3(ridgeX - spanX / 2, yW(spanX / 2), (z0 + z1) / 2).add(new THREE.Vector3(-sp, cp, 0).multiplyScalar(th / 2));
        add(worldBox(w, th, z1 - z0), posW, new THREE.Euler(0, 0, PITCH), 2);
        const posE = new THREE.Vector3(ridgeX + spanX / 2, yW(spanX / 2), (z0 + z1) / 2).add(new THREE.Vector3(sp, cp, 0).multiplyScalar(th / 2));
        add(worldBox(w, th, z1 - z0), posE, new THREE.Euler(0, 0, -PITCH), 2);
      }
      // ridge caps
      add(worldBox(lenX, 0.12, 0.28), new THREE.Vector3(0, MAIN_RIDGE + th + 0.02, 0), new THREE.Euler(), 1.5, edge);
      add(worldBox(0.28, 0.12, WING.z1 + over - 1.5), new THREE.Vector3((WING.x0 + WING.x1) / 2, WING_RIDGE + th + 0.02, (1.5 + WING.z1 + over) / 2), new THREE.Euler(), 2.5, edge);
      // chimney
      const stone = this.facadeMaterial();
      this.disposables.push(stone);
      const ch = MAIN_RIDGE + 0.9 - 1.1;
      add(worldBox(0.9, ch, 1.2), new THREE.Vector3(-8.35, 1.1 + ch / 2, -0.4), new THREE.Euler(), 3, stone);
    } else {
      const slab = (x0: number, x1: number, z0: number, z1: number, order: number) => {
        add(worldBox(x1 - x0, 0.32, z1 - z0), new THREE.Vector3((x0 + x1) / 2, WALL_H + 0.16, (z0 + z1) / 2), new THREE.Euler(), order);
      };
      slab(MAIN.x0 - 1.2, MAIN.x1 + 0.4, MAIN.z0 - 0.6, MAIN.z1 + 1.6, 0);
      slab(WING.x0 - 0.4, WING.x1 + 0.4, MAIN.z1 + 1.6, WING.z1 + 1.4, 1);
    }
  }

  private buildFurniture() {
    const tones: Record<FurnitureTone, THREE.MeshStandardMaterial> = {
      linen: new THREE.MeshStandardMaterial({ color: "#d7d0c2", roughness: 0.95 }),
      oak: new THREE.MeshStandardMaterial({ map: T.planks({ metres: 2, board: 0.25, hue: 30, sat: 40, light: 50, gap: "rgba(0,0,0,0)", seed: 51 }), roughness: 0.55 }),
      charcoal: new THREE.MeshStandardMaterial({ color: "#3a3936", roughness: 0.8 }),
      white: new THREE.MeshStandardMaterial({ color: "#f3f1ec", roughness: 0.3 }),
      rug: new THREE.MeshStandardMaterial({ color: "#b9ad98", roughness: 1 }),
      stone: new THREE.MeshStandardMaterial({ color: "#8f8a80", roughness: 0.85 }),
      plant: new THREE.MeshStandardMaterial({ color: "#5d7548", roughness: 0.9, flatShading: true }),
      steel: new THREE.MeshStandardMaterial({ color: "#55575a", roughness: 0.4, metalness: 0.6 }),
    };
    Object.values(tones).forEach((m) => this.disposables.push(m));
    const pot = new THREE.MeshStandardMaterial({ color: "#c9c2b5", roughness: 0.9 });
    this.disposables.push(pot);
    FURNITURE.forEach((f, i) => {
      const group = new THREE.Group();
      if (f.tone === "plant") {
        const potGeo = new THREE.CylinderGeometry(f.w * 0.35, f.w * 0.28, 0.4, 16);
        const p = new THREE.Mesh(potGeo, pot);
        p.position.y = 0.2;
        const leaves = new THREE.IcosahedronGeometry(f.w * 0.7, 1);
        const l = new THREE.Mesh(leaves, tones.plant);
        l.position.y = 0.4 + f.h * 0.4;
        l.scale.y = 1.3;
        p.castShadow = l.castShadow = true;
        group.add(p, l);
        this.disposables.push(potGeo, leaves);
      } else {
        const geo = f.round ? new THREE.CylinderGeometry(f.w / 2, f.w / 2, f.h, 24) : worldBox(f.w, f.h, f.d);
        const m = new THREE.Mesh(geo, tones[f.tone]);
        m.position.y = f.h / 2;
        m.castShadow = f.h > 0.05;
        m.receiveShadow = true;
        group.add(m);
        this.disposables.push(geo);
      }
      const onDeck = f.x < 2.7 && f.z > 4.6 && f.z < 8;
      group.position.set(f.x, f.tone === "rug" ? 0.035 : onDeck ? 0.12 : 0.03, f.z);
      group.scale.setScalar(0.0001);
      group.visible = false;
      this.scene.add(group);
      this.furniture.push({ obj: group, order: i / FURNITURE.length, baseY: group.position.y });
    });
  }

  private buildTrees() {
    if (this.house.trees === "none") return;
    const spots = treeSpots(this.house.seed, 58, this.house.pool);
    const rnd = mulberry32(this.house.seed + 99);
    const pineGeo = mergeGeometries([
      new THREE.ConeGeometry(2.0, 3.6, 7).translate(0, 3.2, 0),
      new THREE.ConeGeometry(1.6, 3.0, 7).translate(0, 5.0, 0),
      new THREE.ConeGeometry(1.1, 2.6, 7).translate(0, 6.6, 0),
    ]);
    const roundGeo = new THREE.IcosahedronGeometry(2.3, 1).scale(1, 1.15, 1).translate(0, 4.4, 0);
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 2.4, 6).translate(0, 1.2, 0);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true });
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#4a3a2c", roughness: 1 });
    this.disposables.push(pineGeo, roundGeo, trunkGeo, foliageMat, trunkMat);

    const pines: TreeSpot[] = [];
    const rounds: TreeSpot[] = [];
    for (const s of spots) {
      const kind = this.house.trees === "mixed" ? (rnd() > 0.45 ? "pine" : "round") : this.house.trees;
      (kind === "pine" ? pines : rounds).push(s);
    }
    const greens = this.house.ground === "snow" ? ["#2f4a3a", "#3b5544", "#2a3f33"] : ["#3f5a35", "#4c6a3c", "#36502f", "#58733f"];
    const foliage: Trees["foliage"] = [];
    for (const [geo, list] of [[pineGeo, pines], [roundGeo, rounds]] as const) {
      if (!list.length) continue;
      const mesh = new THREE.InstancedMesh(geo, foliageMat, list.length);
      list.forEach((_, i) => mesh.setColorAt(i, new THREE.Color(greens[Math.floor(rnd() * greens.length)])));
      foliage.push({ mesh, spots: list });
    }
    const all = foliage.flatMap((f) => f.spots);
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, all.length);
    for (const m of [...foliage.map((f) => f.mesh), trunks]) {
      m.castShadow = true;
      m.receiveShadow = true;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      this.scene.add(m);
    }
    this.trees = { foliage, trunks, all, grown: -1 };
    this.applyTrees(0);
  }

  private applyTrees(g: number) {
    const trees = this.trees;
    if (!trees) return;
    const k = Math.round(g * 200) / 200;
    if (k === trees.grown) return;
    trees.grown = k;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const n = trees.all.length;
    let idx = 0;
    for (const f of trees.foliage) {
      f.spots.forEach((t, i) => {
        const order = (Math.hypot(t.x, t.z - 4) - 13) / 34;
        const local = easeInOut(clamp01(k * 1.8 - order * 0.8));
        const s = Math.max(0.0001, t.s * local);
        q.setFromAxisAngle(up, t.r);
        v.set(t.x, 0, t.z);
        sc.set(s, s, s);
        m.compose(v, q, sc);
        f.mesh.setMatrixAt(i, m);
        trees.trunks.setMatrixAt(idx++, m);
      });
    }
    void n;
    for (const mesh of [...trees.foliage.map((f) => f.mesh), trees.trunks]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = k > 0.001;
      mesh.computeBoundingSphere();
    }
    this.dirty = true;
  }

  private buildMountains() {
    const rnd = mulberry32(this.house.seed + 5);
    const mat = new THREE.MeshStandardMaterial({ color: this.house.ground === "snow" ? "#cfd3d8" : "#5d6872", roughness: 1, flatShading: true });
    this.disposables.push(mat);
    for (let i = 0; i < 18; i++) {
      const a = -Math.PI * 0.95 + (i / 18) * Math.PI * 1.1 + rnd() * 0.08;
      const dist = 190 + rnd() * 90;
      const h = 16 + rnd() * 26;
      const geo = new THREE.ConeGeometry(40 + rnd() * 35, h, 5 + Math.floor(rnd() * 3));
      this.disposables.push(geo);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(Math.sin(a) * dist, h / 2 - 4, 4 - Math.cos(a) * dist);
      m.rotation.y = rnd() * Math.PI;
      this.mountains.add(m);
    }
    this.scene.add(this.mountains);
  }

  /* ───────── state ───────── */

  setStage(s: StageState | number, immediate = false) {
    const st = typeof s === "number" ? { geo: s, env: s, cam: s } : s;
    this.target = { ...st };
    if (immediate) this.current = { ...st };
    this.dirty = true;
  }

  setPointer(x: number, y: number) {
    this.pointerTarget.set(x, y);
  }

  setRoof(k: number | null) {
    this.roofOverride = k;
    this.dirty = true;
  }

  setCamera(c: CameraOverride | null) {
    this.cameraOverride = c;
    this.dirty = true;
  }

  playIntro(duration = 2600) {
    this.introDuration = duration;
    this.introStart = performance.now();
    this.dirty = true;
  }

  skipIntro() {
    this.introStart = -1;
    this.drawBlueprint(1);
  }

  private apply() {
    const { geo, env, cam } = this.current;

    /* geometry */
    const bp = 1 - smooth(0.15, 0.85, geo);
    this.blueprint.mesh.material.opacity = bp;
    this.blueprint.mesh.visible = bp > 0.002;
    const lab = smooth(0.55, 0.95, geo) * (1 - smooth(1.2, 1.55, geo));
    this.labels.material.opacity = lab;
    this.labels.visible = lab > 0.002;

    const wallH = geo < 1 ? lerp(0.002, 0.12, smooth(0.2, 1, geo)) : lerp(0.12, 1, smooth(1.05, 1.9, geo));
    this.walls.scale.y = wallH;
    this.walls.visible = geo > 0.18;

    for (const f of this.furniture) {
      const local = easeInOut(clamp01((geo - 0.35 - f.order * 0.45) / 0.3));
      f.obj.visible = local > 0.001;
      f.obj.scale.set(1, Math.max(0.0001, local), 1);
    }

    const roofK = this.roofOverride ?? smooth(2.15, 2.85, geo);
    const g = smooth(0, 0.45, roofK);
    this.gables.visible = g > 0.001;
    this.gables.scale.y = Math.max(0.0001, g);
    for (const p of this.roofParts) {
      const local = easeInOut(clamp01(roofK * 1.6 - p.order * 0.18));
      p.obj.visible = local > 0.001;
      p.obj.position.y = p.baseY + (1 - local) * 5;
    }

    this.applyTrees(smooth(1.3, 2.05, Math.max(geo, env)));
    this.mountains.visible = env > 1.2;

    /* environment */
    const skyU = this.sky.material.uniforms;
    keyColor(skyU.top.value as THREE.Color, ENV.skyTop, env);
    keyColor(skyU.horizon.value as THREE.Color, ENV.horizon, env);
    const fog = this.scene.fog as THREE.FogExp2;
    keyColor(fog.color, ENV.fogColor, env);
    fog.density = keyNum(ENV.fog, env);
    const groundKeys =
      this.house.ground === "snow"
        ? [ENV.ground[0], ENV.ground[1], col("#e8ebee"), col("#6a7086")]
        : this.house.ground === "sand"
          ? [ENV.ground[0], ENV.ground[1], col("#cdb894"), col("#4a3d32")]
          : ENV.ground;
    keyColor(this.ground.material.color, groundKeys, env);
    const paperK = 1 - smooth(1.15, 1.85, env);
    this.paper.material.opacity = paperK;
    this.paper.visible = paperK > 0.002;
    this.paper.material.depthWrite = paperK > 0.99;
    keyColor(this.sun.color, ENV.sun, env);
    this.sun.intensity = keyNum(ENV.sunI, env);
    const az = keyNum(ENV.sunAz, env);
    const el = keyNum(ENV.sunEl, env);
    this.sun.position.set(Math.sin(az) * Math.cos(el) * 60, Math.sin(el) * 60, 3.5 - Math.cos(az) * Math.cos(el) * 60);
    keyColor(this.hemi.color, ENV.hemiSky, env);
    keyColor(this.hemi.groundColor, ENV.hemiGround, env);
    this.hemi.intensity = keyNum(ENV.hemiI, env);
    this.scene.environmentIntensity = keyNum(ENV.envI, env);
    const glow = keyNum(ENV.glow, env);
    this.glassMat.emissiveIntensity = glow;
    this.glassMat.opacity = lerp(0.28, 0.62, smooth(0.2, 0.85, glow));
    if (this.soffit) this.soffit.emissiveIntensity = glow * 0.12;
    const lamp = keyNum(ENV.lamps, env);
    for (const l of this.lamps) l.intensity = lamp * 16;
    this.renderer.toneMappingExposure = keyNum(ENV.exposure, env);
    if (this.bloom) this.bloom.strength = keyNum(ENV.bloom, env);

    /* camera */
    if (this.cameraOverride) {
      this.camera.position.set(...this.cameraOverride.position);
      this.camera.lookAt(new THREE.Vector3(...this.cameraOverride.target));
      this.camera.fov = this.cameraOverride.fov;
    } else {
      const c = Math.min(Math.max(cam, 0), 3 - 1e-6);
      const i = Math.floor(c);
      const f = easeInOut(c - i);
      const target = new THREE.Vector3().lerpVectors(CAM.target[i], CAM.target[i + 1], f);
      const aspect = this.camera.aspect || 1.6;
      const fit = aspect < 1.2 ? 1 + (1.2 - aspect) * 0.95 : 1;
      const radius = lerp(CAM.radius[i], CAM.radius[i + 1], f) * lerp(fit, 1 + (fit - 1) * 0.6, smooth(2, 3, cam));
      const polar = lerp(CAM.polar[i], CAM.polar[i + 1], f) + this.pointer.y * 0.025;
      const azimuth = lerp(CAM.azimuth[i], CAM.azimuth[i + 1], f) + this.pointer.x * 0.05;
      this.camera.position.set(target.x + radius * Math.sin(polar) * Math.sin(azimuth), target.y + radius * Math.cos(polar), target.z + radius * Math.sin(polar) * Math.cos(azimuth));
      this.camera.fov = lerp(CAM.fov[i], CAM.fov[i + 1], f);
      this.camera.lookAt(target);
    }
    this.camera.updateProjectionMatrix();
  }

  resize(width: number, height: number) {
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.composer) {
      this.composer.setPixelRatio(this.renderer.getPixelRatio());
      this.composer.setSize(width, height);
    }
    this.dirty = true;
    this.renderNow();
  }

  renderNow() {
    this.apply();
    if (this.composer && (this.bloom?.strength ?? 0) > 0.001) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
    this.dirty = false;
  }

  private lastTick = 0;
  private tick = (now: number) => {
    if (!this.running || this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    // frame-rate independent damping (same feel at 30, 60 or 120 fps)
    const dt = Math.min(0.1, this.lastTick ? (now - this.lastTick) / 1000 : 1 / 60);
    this.lastTick = now;
    const k = 1 - Math.exp(-dt * 5.5);
    const kp = 1 - Math.exp(-dt * 3);
    const c = this.current;
    const t = this.target;
    let moving = false;
    for (const key of ["geo", "env", "cam"] as const) {
      const d = t[key] - c[key];
      if (Math.abs(d) > 0.0005) {
        c[key] += d * k;
        moving = true;
      } else c[key] = t[key];
    }
    const dx = this.pointerTarget.x - this.pointer.x;
    const dy = this.pointerTarget.y - this.pointer.y;
    if (dx * dx + dy * dy > 1e-6) {
      this.pointer.x += dx * kp;
      this.pointer.y += dy * kp;
      moving = true;
    }
    if (this.introStart >= 0) {
      const p = clamp01((performance.now() - this.introStart) / this.introDuration);
      this.drawBlueprint(easeInOut(p));
      if (p >= 1) {
        this.introStart = -1;
        this.onIntroDone?.();
      }
    }
    if (moving || this.dirty) this.renderNow();
  };

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    this.lastTick = 0;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    this.disposed = true;
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(m)) m.forEach((x) => x.dispose());
      else m?.dispose();
    });
    for (const d of this.disposables) d.dispose();
    this.composer?.dispose();
    this.renderer.dispose();
  }
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}
