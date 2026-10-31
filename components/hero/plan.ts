import { FURNITURE, POOL, ROOMS, WALLS, roomArea, wallFrame, type Wall } from "./house-data";

/**
 * Converts the house data into 2D drafting primitives. Consumed by the canvas
 * blueprint (animated line drawing in the hero) and the SVG plan viewer.
 */
export type Pt = [number, number];
export type Tone = "ink" | "soft" | "faint" | "accent";
export type PlanLine = { k: "line"; pts: Pt[]; w: number; tone: Tone; closed?: boolean; dash?: number[] };
export type PlanFill = { k: "fill"; pts: Pt[]; tone: Tone };
export type PlanText = { k: "text"; x: number; z: number; text: string; size: number; tone: Tone; anchor: "start" | "middle" | "end"; rotate?: number; weight?: 400 | 600; mono?: boolean };
export type PlanPrim = PlanLine | PlanFill | PlanText;
export type PlanLayer = { name: string; prims: PlanPrim[] };

export const PLAN_BOUNDS = { x0: -14, z0: -10, x1: 14, z1: 18 };

function rect(x0: number, z0: number, x1: number, z1: number): Pt[] {
  return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
}

function wallRects(w: Wall): Pt[][] {
  const f = wallFrame(w);
  const ext = w.exterior ? w.t / 2 : 0;
  return f.solids.map(([s, e]) => {
    const s2 = s === 0 ? s - ext : s;
    const e2 = e === f.length ? e + ext : e;
    return [f.point(s2, -w.t / 2), f.point(e2, -w.t / 2), f.point(e2, w.t / 2), f.point(s2, w.t / 2)];
  });
}

function arc(cx: number, cz: number, r: number, a0: number, a1: number, steps = 18): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
  return out;
}

function openingPrims(w: Wall): PlanPrim[] {
  const f = wallFrame(w);
  const out: PlanPrim[] = [];
  const half = w.t / 2;
  for (const o of f.openings) {
    const s = o.at - o.width / 2;
    const e = o.at + o.width / 2;
    // jamb lines
    out.push({ k: "line", pts: [f.point(s, -half), f.point(s, half)], w: 1.4, tone: "ink" });
    out.push({ k: "line", pts: [f.point(e, -half), f.point(e, half)], w: 1.4, tone: "ink" });
    if (o.kind === "window") {
      for (const off of [-half * 0.9, 0, half * 0.9]) out.push({ k: "line", pts: [f.point(s, off), f.point(e, off)], w: off === 0 ? 1.1 : 0.8, tone: "ink" });
    } else if (o.kind === "glazed") {
      out.push({ k: "line", pts: [f.point(s, -half * 0.35), f.point(o.at + 0.05, -half * 0.35)], w: 1.2, tone: "ink" });
      out.push({ k: "line", pts: [f.point(o.at - 0.05, half * 0.35), f.point(e, half * 0.35)], w: 1.2, tone: "ink" });
      out.push({ k: "line", pts: [f.point(s, -half), f.point(e, -half)], w: 0.5, tone: "soft" });
      out.push({ k: "line", pts: [f.point(s, half), f.point(e, half)], w: 0.5, tone: "soft" });
    } else if (o.kind === "door") {
      const dir = o.swing ?? 1;
      const hinge = f.point(s, dir * half);
      const leafEnd = f.point(s, dir * (half + o.width));
      out.push({ k: "line", pts: [hinge, leafEnd], w: 1.2, tone: "ink" });
      const a0 = Math.atan2(leafEnd[1] - hinge[1], leafEnd[0] - hinge[0]);
      const closed = f.point(e, dir * half);
      let a1 = Math.atan2(closed[1] - hinge[1], closed[0] - hinge[0]);
      if (a1 - a0 > Math.PI) a1 -= Math.PI * 2;
      if (a0 - a1 > Math.PI) a1 += Math.PI * 2;
      out.push({ k: "line", pts: arc(hinge[0], hinge[1], o.width, a0, a1), w: 0.6, tone: "soft", dash: [0.12, 0.08] });
    }
  }
  return out;
}

function dimension(a: Pt, b: Pt, offset: Pt, label: string): PlanPrim[] {
  const A: Pt = [a[0] + offset[0], a[1] + offset[1]];
  const B: Pt = [b[0] + offset[0], b[1] + offset[1]];
  const dx = B[0] - A[0];
  const dz = B[1] - A[1];
  const len = Math.hypot(dx, dz);
  const ux = dx / len;
  const uz = dz / len;
  const tick = (p: Pt): PlanLine => ({ k: "line", pts: [[p[0] - (ux + -uz) * 0.18, p[1] - (uz + ux) * 0.18], [p[0] + (ux + -uz) * 0.18, p[1] + (uz + ux) * 0.18]], w: 1.1, tone: "ink" });
  const nx = Math.sign(offset[0]) * 0.15;
  const nz = Math.sign(offset[1]) * 0.15;
  const vertical = Math.abs(uz) > Math.abs(ux);
  return [
    { k: "line", pts: [A, B], w: 0.7, tone: "ink" },
    { k: "line", pts: [[a[0] + nx * 2, a[1] + nz * 2], [A[0] + nx, A[1] + nz]], w: 0.5, tone: "soft" },
    { k: "line", pts: [[b[0] + nx * 2, b[1] + nz * 2], [B[0] + nx, B[1] + nz]], w: 0.5, tone: "soft" },
    tick(A),
    tick(B),
    { k: "text", x: (A[0] + B[0]) / 2 + (vertical ? -0.22 : 0), z: (A[1] + B[1]) / 2 - (vertical ? 0 : 0.22), text: label, size: 0.3, tone: "ink", anchor: "middle", rotate: vertical ? -90 : 0, mono: true },
  ];
}

const mm = (m: number) => String(Math.round(m * 1000));

export function buildPlan(opts: { pool?: boolean; furniture?: boolean; title?: string; sheet?: string } = {}): PlanLayer[] {
  const { x0, z0, x1, z1 } = PLAN_BOUNDS;
  const grid: PlanPrim[] = [];
  for (let x = Math.ceil(x0); x <= x1; x++) grid.push({ k: "line", pts: [[x, z0], [x, z1]], w: x % 5 === 0 ? 0.5 : 0.25, tone: "faint" });
  for (let z = Math.ceil(z0); z <= z1; z++) grid.push({ k: "line", pts: [[x0, z], [x1, z]], w: z % 5 === 0 ? 0.5 : 0.25, tone: "faint" });

  const outsideRooms = ROOMS.filter((r) => r.outside);
  const site: PlanPrim[] = [];
  for (const r of opts.pool ? [...outsideRooms, POOL] : outsideRooms) {
    site.push({ k: "line", pts: rect(r.x0, r.z0, r.x1, r.z1), w: 0.8, tone: "soft", closed: true });
    if (r.floor === "deck") for (let z = r.z0 + 0.3; z < r.z1; z += 0.3) site.push({ k: "line", pts: [[r.x0, z], [r.x1, z]], w: 0.25, tone: "faint" });
    if (r.floor === "paver") for (let z = r.z0 + 0.8; z < r.z1; z += 0.8) site.push({ k: "line", pts: [[r.x0, z], [r.x1, z]], w: 0.4, tone: "soft" });
    if (r.floor === "water") site.push({ k: "line", pts: rect(r.x0 + 0.3, r.z0 + 0.3, r.x1 - 0.3, r.z1 - 0.3), w: 0.4, tone: "soft", closed: true });
  }

  const walls: PlanPrim[] = [];
  const wallFills: PlanPrim[] = [];
  const ordered = [...WALLS.filter((w) => w.exterior), ...WALLS.filter((w) => !w.exterior)];
  for (const w of ordered) for (const r of wallRects(w)) {
    walls.push({ k: "line", pts: r, w: w.exterior ? 2.2 : 1.4, tone: "ink", closed: true });
    wallFills.push({ k: "fill", pts: r, tone: "ink" });
  }

  const openings = WALLS.flatMap(openingPrims);

  const furniture: PlanPrim[] = opts.furniture === false ? [] : FURNITURE.filter((f) => f.tone !== "rug").map((f) =>
    f.round
      ? { k: "line" as const, pts: arc(f.x, f.z, f.w / 2, 0, Math.PI * 2, 20), w: 0.6, tone: "soft" as const, closed: true }
      : { k: "line" as const, pts: rect(f.x - f.w / 2, f.z - f.d / 2, f.x + f.w / 2, f.z + f.d / 2), w: 0.6, tone: "soft" as const, closed: true },
  );

  const dims: PlanPrim[] = [
    ...dimension([-9, -4.5], [9, -4.5], [0, -2.0], mm(18)),
    ...dimension([-9, -4.5], [-1, -4.5], [0, -1.2], mm(8)),
    ...dimension([-1, -4.5], [5, -4.5], [0, -1.2], mm(6)),
    ...dimension([5, -4.5], [9, -4.5], [0, -1.2], mm(4)),
    ...dimension([9, -4.5], [9, 12], [2.0, 0], mm(16.5)),
    ...dimension([9, -4.5], [9, 4.5], [1.2, 0], mm(9)),
    ...dimension([9, 4.5], [9, 12], [1.2, 0], mm(7.5)),
    ...dimension([-9, -4.5], [-9, 4.5], [-1.4, 0], mm(9)),
  ];

  const labels: PlanPrim[] = [];
  for (const r of opts.pool ? [...ROOMS, POOL] : ROOMS) {
    if (!r.label) continue;
    const cx = (r.x0 + r.x1) / 2;
    let cz = (r.z0 + r.z1) / 2;
    if (r.name === "Living") cz = -3.3;
    if (r.name === "Kitchen + Dining") cz = 0.2;
    if (r.name === "Main Bedroom") cz = -0.2;
    if (r.name === "Guest Suite" || r.name === "Studio") cz -= 0.4;
    labels.push({ k: "text", x: cx, z: cz, text: r.name.toUpperCase(), size: 0.3, tone: "ink", anchor: "middle", weight: 600, mono: true });
    labels.push({ k: "text", x: cx, z: cz + 0.42, text: `${roomArea(r).toFixed(1)} M²`, size: 0.24, tone: "soft", anchor: "middle", mono: true });
  }

  // north arrow, section marks, title block
  const notes: PlanPrim[] = [
    { k: "line", pts: arc(-11.5, -7.5, 0.7, 0, Math.PI * 2, 32), w: 0.8, tone: "ink", closed: true },
    { k: "line", pts: [[-11.5, -8.6], [-11.1, -7.1], [-11.5, -7.4], [-11.9, -7.1], [-11.5, -8.6]], w: 0.9, tone: "ink", closed: true },
    { k: "text", x: -11.5, z: -8.85, text: "N", size: 0.34, tone: "ink", anchor: "middle", weight: 600, mono: true },
    { k: "line", pts: [[-12.5, 0], [-10.6, 0]], w: 0.8, tone: "accent", dash: [0.4, 0.15] },
    { k: "line", pts: arc(-12.9, 0, 0.42, 0, Math.PI * 2, 24), w: 0.8, tone: "accent", closed: true },
    { k: "text", x: -12.9, z: 0.1, text: "A", size: 0.32, tone: "accent", anchor: "middle", weight: 600, mono: true },
    { k: "line", pts: rect(5.5, 14.2, 13.2, 17.2), w: 1, tone: "ink", closed: true },
    { k: "line", pts: [[5.5, 15.3], [13.2, 15.3]], w: 0.6, tone: "ink" },
    { k: "line", pts: [[10.6, 15.3], [10.6, 17.2]], w: 0.6, tone: "ink" },
    { k: "text", x: 5.8, z: 14.95, text: opts.title ?? "GROUND FLOOR PLAN — RESIDENCE", size: 0.3, tone: "ink", anchor: "start", weight: 600, mono: true },
    { k: "text", x: 5.8, z: 15.95, text: "SCALE 1:100 @ A1", size: 0.24, tone: "soft", anchor: "start", mono: true },
    { k: "text", x: 5.8, z: 16.5, text: "DRAWN — STUDIO · REV C", size: 0.24, tone: "soft", anchor: "start", mono: true },
    { k: "text", x: 11.9, z: 16.55, text: opts.sheet ?? "A-101", size: 0.55, tone: "ink", anchor: "middle", weight: 600, mono: true },
  ];

  return [
    { name: "grid", prims: grid },
    { name: "site", prims: site },
    { name: "walls", prims: walls },
    { name: "openings", prims: openings },
    { name: "wallFills", prims: wallFills },
    { name: "furniture", prims: furniture },
    { name: "dims", prims: dims },
    { name: "labels", prims: labels },
    { name: "notes", prims: notes },
  ];
}

export function polylineLength(pts: Pt[], closed?: boolean): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  if (closed && pts.length > 2) l += Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]);
  return l;
}

export type BlueprintPalette = { paper: string; ink: string; soft: string; faint: string; accent: string; fill: string };
export const BLUEPRINT: BlueprintPalette = {
  paper: "#F4F3EE",
  ink: "#2F5BEA",
  soft: "rgba(47,91,234,0.55)",
  faint: "rgba(47,91,234,0.10)",
  accent: "#C98A4B",
  fill: "rgba(47,91,234,0.16)",
};

/**
 * Draw the plan onto a 2D canvas. `t` (0→1) controls the progressive
 * pen-drawing animation; layers are drawn in order with dash-offset reveal.
 */
export function drawPlan(ctx: CanvasRenderingContext2D, layers: PlanLayer[], t: number, size: number, palette: BlueprintPalette = BLUEPRINT, transparent = false): void {
  const { x0, z0, x1 } = PLAN_BOUNDS;
  const k = size / (x1 - x0);
  const X = (x: number) => (x - x0) * k;
  const Z = (z: number) => (z - z0) * k;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (transparent) ctx.clearRect(0, 0, size, size);
  else {
    ctx.fillStyle = palette.paper;
    ctx.fillRect(0, 0, size, size);
  }
  const color = (tone: Tone) => (tone === "ink" ? palette.ink : tone === "soft" ? palette.soft : tone === "accent" ? palette.accent : palette.faint);
  const weights: Record<string, number> = { grid: 0.08, site: 0.12, walls: 0.24, openings: 0.12, wallFills: 0.06, furniture: 0.1, dims: 0.12, labels: 0.08, notes: 0.08 };
  let start = 0;
  const lineScale = size / 2048;
  for (const layer of layers) {
    const span = weights[layer.name] ?? 0.1;
    const local = Math.min(1, Math.max(0, (t - start) / span));
    start += span * 0.82;
    if (local <= 0) continue;
    const n = layer.prims.length;
    layer.prims.forEach((p, i) => {
      const pt = Math.min(1, Math.max(0, local * 1.6 - (i / Math.max(1, n)) * 0.6));
      if (pt <= 0) return;
      if (p.k === "fill") {
        ctx.globalAlpha = pt;
        ctx.fillStyle = palette.paper;
        ctx.beginPath();
        p.pts.forEach(([x, z], j) => (j ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z))));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = palette.fill;
        ctx.fill();
        ctx.globalAlpha = 1;
        return;
      }
      if (p.k === "text") {
        ctx.globalAlpha = pt;
        ctx.save();
        ctx.translate(X(p.x), Z(p.z));
        if (p.rotate) ctx.rotate((p.rotate * Math.PI) / 180);
        ctx.fillStyle = color(p.tone);
        ctx.font = `${p.weight ?? 400} ${p.size * k}px ${p.mono ? "'JetBrains Mono', ui-monospace, monospace" : "sans-serif"}`;
        ctx.textAlign = p.anchor === "middle" ? "center" : p.anchor === "end" ? "right" : "left";
        ctx.textBaseline = "middle";
        ctx.fillText(p.text, 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
        return;
      }
      const len = polylineLength(p.pts, p.closed) * k;
      ctx.strokeStyle = color(p.tone);
      ctx.lineWidth = p.w * lineScale * 1.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      p.pts.forEach(([x, z], j) => (j ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z))));
      if (p.closed) ctx.closePath();
      if (pt < 1) {
        ctx.setLineDash([len * pt, len]);
      } else if (p.dash) {
        ctx.setLineDash(p.dash.map((d) => d * k));
      } else ctx.setLineDash([]);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }
}
