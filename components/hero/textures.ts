import * as THREE from "three";
import { mulberry32 } from "./house-data";

/**
 * Procedural canvas textures. Each texture tiles over `metres` of world space;
 * meshes use world-scaled UVs (1 UV unit = 1 m) so `repeat = 1 / metres`.
 */
type Painter = (ctx: CanvasRenderingContext2D, px: number, rnd: () => number) => void;

function make(px: number, metres: number, paint: Painter, seed: number, srgb = true): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = px;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  paint(ctx, px, mulberry32(seed));
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / metres, 1 / metres);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

const hsl = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`;

function speckle(ctx: CanvasRenderingContext2D, px: number, rnd: () => number, count: number, alpha: number, light = false) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = light ? `rgba(255,255,255,${rnd() * alpha})` : `rgba(0,0,0,${rnd() * alpha})`;
    const s = 1 + rnd() * 2;
    ctx.fillRect(rnd() * px, rnd() * px, s, s);
  }
}

export function planks(opts: { metres: number; board: number; hue: number; sat: number; light: number; gap: string; seed: number }): THREE.CanvasTexture {
  return make(1024, opts.metres, (ctx, px, rnd) => {
    const k = px / opts.metres;
    const bw = opts.board * k;
    for (let x = 0; x < px; x += bw) {
      let y = -rnd() * 300;
      while (y < px) {
        const len = (1.2 + rnd() * 1.6) * k;
        const l = opts.light + (rnd() - 0.5) * 9;
        ctx.fillStyle = hsl(opts.hue + (rnd() - 0.5) * 4, opts.sat + (rnd() - 0.5) * 8, l);
        ctx.fillRect(x, y, bw, len);
        // grain
        ctx.strokeStyle = `rgba(60,30,10,${0.05 + rnd() * 0.08})`;
        ctx.lineWidth = 1;
        for (let g = 0; g < 7; g++) {
          const gx = x + rnd() * bw;
          ctx.beginPath();
          ctx.moveTo(gx, y);
          ctx.bezierCurveTo(gx + (rnd() - 0.5) * 6, y + len * 0.3, gx + (rnd() - 0.5) * 6, y + len * 0.7, gx + (rnd() - 0.5) * 4, y + len);
          ctx.stroke();
        }
        ctx.fillStyle = opts.gap;
        ctx.fillRect(x, y + len - 1.5, bw, 1.5);
        y += len;
      }
      ctx.fillStyle = opts.gap;
      ctx.fillRect(x + bw - 1.5, 0, 1.5, px);
    }
    speckle(ctx, px, rnd, 2500, 0.05);
  }, opts.seed);
}

export function tiles(opts: { metres: number; w: number; h: number; base: [number, number, number]; jitter: number; grout: string; seed: number; stagger?: boolean }): THREE.CanvasTexture {
  return make(1024, opts.metres, (ctx, px, rnd) => {
    const k = px / opts.metres;
    ctx.fillStyle = opts.grout;
    ctx.fillRect(0, 0, px, px);
    const tw = opts.w * k;
    const th = opts.h * k;
    let row = 0;
    for (let y = 0; y < px; y += th, row++) {
      const off = opts.stagger && row % 2 ? tw / 2 : 0;
      for (let x = -off; x < px; x += tw) {
        const [h, s, l] = opts.base;
        ctx.fillStyle = hsl(h + (rnd() - 0.5) * 4, s, l + (rnd() - 0.5) * opts.jitter);
        ctx.fillRect(x + 1.5, y + 1.5, tw - 3, th - 3);
      }
    }
    speckle(ctx, px, rnd, 4000, 0.06);
  }, opts.seed);
}

export function stackedStone(seed = 3): THREE.CanvasTexture {
  return make(1024, 2.4, (ctx, px, rnd) => {
    ctx.fillStyle = "#3d3a36";
    ctx.fillRect(0, 0, px, px);
    const k = px / 2.4;
    let y = 0;
    while (y < px) {
      const h = (0.07 + rnd() * 0.12) * k;
      let x = -rnd() * 80;
      while (x < px) {
        const w = (0.18 + rnd() * 0.5) * k;
        const l = 38 + rnd() * 22;
        ctx.fillStyle = hsl(30 + rnd() * 14, 6 + rnd() * 8, l);
        ctx.fillRect(x + 2, y + 2, w - 4, h - 3);
        ctx.fillStyle = `rgba(255,255,255,${0.04 + rnd() * 0.06})`;
        ctx.fillRect(x + 2, y + 2, w - 4, 3);
        ctx.fillStyle = `rgba(0,0,0,${0.08 + rnd() * 0.08})`;
        ctx.fillRect(x + 2, y + h - 5, w - 4, 2);
        x += w;
      }
      y += h;
    }
    speckle(ctx, px, rnd, 9000, 0.12);
    speckle(ctx, px, rnd, 4000, 0.08, true);
  }, seed);
}

export function plaster(base: string, seed = 5): THREE.CanvasTexture {
  return make(512, 3, (ctx, px, rnd) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, px, px);
    speckle(ctx, px, rnd, 6000, 0.035);
    speckle(ctx, px, rnd, 3000, 0.04, true);
  }, seed);
}

export function brick(seed = 9): THREE.CanvasTexture {
  return tiles({ metres: 2.4, w: 0.225, h: 0.075, base: [16, 38, 40], jitter: 10, grout: "#b9b2a6", seed, stagger: true });
}

export function cladding(seed = 11): THREE.CanvasTexture {
  return make(1024, 2.4, (ctx, px, rnd) => {
    const k = px / 2.4;
    const bw = 0.14 * k;
    for (let x = 0; x < px; x += bw) {
      ctx.fillStyle = hsl(26 + rnd() * 6, 28 + rnd() * 10, 26 + rnd() * 9);
      ctx.fillRect(x, 0, bw, px);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(x + bw - 2, 0, 2, px);
    }
    speckle(ctx, px, rnd, 5000, 0.08);
  }, seed);
}

export function standingSeam(tone: string, seed = 13): THREE.CanvasTexture {
  return make(512, 2.7, (ctx, px, rnd) => {
    ctx.fillStyle = tone;
    ctx.fillRect(0, 0, px, px);
    const k = px / 2.7;
    for (let x = 0; x < px; x += 0.45 * k) {
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(x, 0, 3, px);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(x + 3, 0, 2, px);
    }
    speckle(ctx, px, rnd, 2000, 0.05, true);
  }, seed);
}

export function groundNoise(seed = 17): THREE.CanvasTexture {
  return make(1024, 24, (ctx, px, rnd) => {
    ctx.fillStyle = "#f4f4f4";
    ctx.fillRect(0, 0, px, px);
    for (let i = 0; i < 900; i++) {
      const r = 10 + rnd() * 60;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      const a = 0.05 + rnd() * 0.07;
      g.addColorStop(0, `rgba(${rnd() > 0.5 ? "60,70,30" : "255,255,240"},${a})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.translate(rnd() * px, rnd() * px);
      ctx.fillStyle = g;
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.restore();
    }
    speckle(ctx, px, rnd, 30000, 0.09);
  }, seed);
}

/** Make a canvas texture from a draw callback (blueprint + plan labels). */
export function canvasTexture(px: number): { tex: THREE.CanvasTexture; ctx: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = c.height = px;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex, ctx };
}
