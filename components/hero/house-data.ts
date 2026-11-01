/**
 * Parametric description of the studio's signature house.
 * Units are metres. Plan axes: x → east, z → south (towards the viewer), y → up.
 * The same data drives the 3D hero, the blueprint drawing and the SVG plan viewer.
 */

export type OpeningKind = "window" | "door" | "glazed" | "void";
export type Opening = { at: number; width: number; sill: number; head: number; kind: OpeningKind; swing?: 1 | -1 };
export type Wall = { id: string; a: [number, number]; b: [number, number]; t: number; exterior: boolean; openings: Opening[] };
export type FloorKind = "oak" | "stone" | "tile" | "deck" | "paver" | "water";
export type Room = { name: string; x0: number; z0: number; x1: number; z1: number; floor: FloorKind; label: boolean; outside?: boolean };
export type FurnitureTone = "linen" | "oak" | "charcoal" | "white" | "rug" | "stone" | "plant" | "steel";
export type Furniture = { x: number; z: number; w: number; d: number; h: number; tone: FurnitureTone; y?: number; round?: boolean };

export const WALL_H = 2.8;
export const PITCH = (32 * Math.PI) / 180;
export const MAIN = { x0: -9, x1: 9, z0: -4.5, z1: 4.5 };
export const WING = { x0: 3, x1: 9, z0: 4.5, z1: 12 };
export const MAIN_RIDGE = WALL_H + ((MAIN.z1 - MAIN.z0) / 2) * Math.tan(PITCH);
export const WING_RIDGE = WALL_H + ((WING.x1 - WING.x0) / 2) * Math.tan(PITCH);

const EXT = 0.3;
const INT = 0.12;
const win = (at: number, width: number, sill = 0.9, head = 2.3): Opening => ({ at, width, sill, head, kind: "window" });
const door = (at: number, width = 0.9, swing: 1 | -1 = 1): Opening => ({ at, width, sill: 0, head: 2.2, kind: "door", swing });
const glazed = (at: number, width: number, head = 2.5): Opening => ({ at, width, sill: 0, head, kind: "glazed" });
const gap = (at: number, width: number, head = 2.4): Opening => ({ at, width, sill: 0, head, kind: "void" });

/** Openings are positioned by their centre along the wall measured from `a`. */
export const WALLS: Wall[] = [
  // ── exterior ──
  { id: "north", a: [-9, -4.5], b: [9, -4.5], t: EXT, exterior: true, openings: [win(3, 2.6), win(10.5, 1.8), win(16, 1.6)] },
  { id: "west", a: [-9, -4.5], b: [-9, 4.5], t: EXT, exterior: true, openings: [win(1.6, 0.9, 0.3, 2.4), win(7.4, 0.9, 0.3, 2.4)] },
  { id: "south-main", a: [-9, 4.5], b: [3, 4.5], t: EXT, exterior: true, openings: [glazed(2.6, 3.6), glazed(6.6, 2.0), door(10.8, 1.1, -1)] },
  { id: "east", a: [9, -4.5], b: [9, 12], t: EXT, exterior: true, openings: [win(2.4, 1.6), win(7.2, 0.8, 1.4, 2.2), win(10.8, 1.6), win(14.6, 1.2, 0.6, 2.4)] },
  { id: "wing-west", a: [3, 4.5], b: [3, 12], t: EXT, exterior: true, openings: [win(1.9, 1.6), glazed(6.0, 1.6)] },
  { id: "wing-south", a: [3, 12], b: [9, 12], t: EXT, exterior: true, openings: [glazed(3, 5.2, WALL_H - 0.05)] },
  // ── interior ──
  { id: "living-stub", a: [-1, -4.5], b: [-1, -2.6], t: INT, exterior: false, openings: [] },
  { id: "kitchen-hall", a: [-1, 1], b: [5, 1], t: INT, exterior: false, openings: [gap(2.6, 2.2)] },
  { id: "east-core", a: [5, -4.5], b: [5, 4.5], t: INT, exterior: false, openings: [door(4.2, 0.9, 1), door(7.6, 0.8, -1)] },
  { id: "bath", a: [5, 0.5], b: [9, 0.5], t: INT, exterior: false, openings: [] },
  { id: "wing-link", a: [3, 4.5], b: [9, 4.5], t: INT, exterior: false, openings: [door(0.95, 0.9, 1)] },
  { id: "wing-mid", a: [3, 8.2], b: [9, 8.2], t: INT, exterior: false, openings: [door(1.0, 0.9, -1)] },
];

export const ROOMS: Room[] = [
  { name: "Living", x0: -9, z0: -4.5, x1: -1, z1: 4.5, floor: "oak", label: true },
  { name: "Kitchen + Dining", x0: -1, z0: -4.5, x1: 5, z1: 1, floor: "oak", label: true },
  { name: "Entry", x0: -1, z0: 1, x1: 5, z1: 4.5, floor: "stone", label: true },
  { name: "Main Bedroom", x0: 5, z0: -4.5, x1: 9, z1: 0.5, floor: "oak", label: true },
  { name: "Bath", x0: 5, z0: 0.5, x1: 9, z1: 4.5, floor: "tile", label: true },
  { name: "Guest Suite", x0: 3, z0: 4.5, x1: 9, z1: 8.2, floor: "oak", label: true },
  { name: "Studio", x0: 3, z0: 8.2, x1: 9, z1: 12, floor: "oak", label: true },
  { name: "Terrace", x0: -9, z0: 4.5, x1: 2.6, z1: 8, floor: "deck", label: true, outside: true },
  { name: "", x0: 1.0, z0: 8, x1: 2.4, z1: 16, floor: "paver", label: false, outside: true },
];

export const POOL: Room = { name: "Pool", x0: -8.4, z0: 9.6, x1: -1.6, z1: 12.6, floor: "water", label: true, outside: true };

export const FURNITURE: Furniture[] = [
  // living
  { x: -5.4, z: -0.2, w: 4.6, d: 3.6, h: 0.015, tone: "rug" },
  { x: -5.4, z: 1.55, w: 3.2, d: 0.95, h: 0.78, tone: "linen" },
  { x: -3.2, z: -0.4, w: 0.95, d: 2.4, h: 0.78, tone: "linen" },
  { x: -5.6, z: -0.2, w: 1.4, d: 0.8, h: 0.38, tone: "oak" },
  { x: -7.4, z: -2.5, w: 0.9, d: 0.9, h: 0.75, tone: "charcoal" },
  { x: -4.4, z: -2.6, w: 0.9, d: 0.9, h: 0.75, tone: "charcoal" },
  { x: -8.55, z: -0.4, w: 0.6, d: 2.2, h: 1.1, tone: "stone" },
  { x: -8.3, z: 3.8, w: 0.5, d: 0.5, h: 1.3, tone: "plant", round: true },
  // kitchen + dining
  { x: 4.6, z: -2.3, w: 0.62, d: 4.2, h: 0.92, tone: "white" },
  { x: 2.9, z: -2.1, w: 1.0, d: 2.6, h: 0.92, tone: "oak" },
  { x: 0.6, z: -2.1, w: 1.0, d: 2.3, h: 0.75, tone: "oak" },
  ...[-2.9, -2.1, -1.3].flatMap((z) => [
    { x: -0.05, z, w: 0.45, d: 0.45, h: 0.45, tone: "charcoal" as const },
    { x: 1.25, z, w: 0.45, d: 0.45, h: 0.45, tone: "charcoal" as const },
  ]),
  { x: 0.6, z: -4.1, w: 2.4, d: 0.42, h: 2.1, tone: "oak" },
  // entry
  { x: 0.4, z: 4.1, w: 1.8, d: 0.42, h: 0.46, tone: "oak" },
  { x: 4.4, z: 1.5, w: 0.5, d: 0.5, h: 1.1, tone: "plant", round: true },
  // main bedroom
  { x: 7.85, z: -2.0, w: 2.1, d: 1.8, h: 0.52, tone: "linen" },
  { x: 8.78, z: -2.0, w: 0.12, d: 2.3, h: 1.05, tone: "oak" },
  { x: 8.55, z: -3.45, w: 0.45, d: 0.45, h: 0.5, tone: "oak" },
  { x: 8.55, z: -0.55, w: 0.45, d: 0.45, h: 0.5, tone: "oak" },
  { x: 5.4, z: -3.0, w: 0.6, d: 2.4, h: 2.2, tone: "oak" },
  // bath
  { x: 7.9, z: 3.65, w: 1.75, d: 0.8, h: 0.56, tone: "white" },
  { x: 6.4, z: 0.85, w: 1.4, d: 0.5, h: 0.86, tone: "stone" },
  // guest suite
  { x: 7.85, z: 6.35, w: 2.1, d: 1.6, h: 0.52, tone: "linen" },
  { x: 8.78, z: 6.35, w: 0.12, d: 2.1, h: 1.0, tone: "oak" },
  { x: 3.55, z: 7.2, w: 0.6, d: 1.4, h: 0.75, tone: "oak" },
  // studio
  { x: 6.1, z: 10.0, w: 2.2, d: 1.0, h: 0.9, tone: "oak" },
  { x: 8.65, z: 10.1, w: 0.4, d: 3.2, h: 2.0, tone: "oak" },
  { x: 4.1, z: 11.0, w: 0.9, d: 0.9, h: 0.75, tone: "charcoal" },
  { x: 6.1, z: 10.9, w: 0.5, d: 0.5, h: 0.6, tone: "charcoal", round: true },
  // terrace
  { x: -3.6, z: 6.4, w: 1.9, d: 0.95, h: 0.72, tone: "charcoal" },
  ...[-4.3, -2.9].flatMap((x) => [
    { x, z: 5.6, w: 0.5, d: 0.5, h: 0.45, tone: "steel" as const },
    { x, z: 7.2, w: 0.5, d: 0.5, h: 0.45, tone: "steel" as const },
  ]),
  { x: -7.6, z: 6.4, w: 0.72, d: 1.9, h: 0.34, tone: "linen" },
  { x: -6.5, z: 6.4, w: 0.72, d: 1.9, h: 0.34, tone: "linen" },
  { x: 2.0, z: 7.4, w: 0.6, d: 0.6, h: 1.4, tone: "plant", round: true },
];

/** Warm light sources for dusk (inside rooms). */
export const INTERIOR_LIGHTS: Array<[number, number, number]> = [
  [-5, 2.2, 0],
  [2, 2.2, -1.5],
  [6, 2.4, 10],
  [7, 2.2, -2],
  [1.5, 2.2, 3],
];

export function roomArea(r: Room): number {
  return Math.abs((r.x1 - r.x0) * (r.z1 - r.z0));
}

/** Split a wall into solid runs and openings along its length. */
export function wallFrame(w: Wall) {
  const dx = w.b[0] - w.a[0];
  const dz = w.b[1] - w.a[1];
  const length = Math.hypot(dx, dz);
  const ux = dx / length;
  const uz = dz / length;
  const openings = [...w.openings].sort((p, q) => p.at - q.at);
  const solids: Array<[number, number]> = [];
  let cursor = 0;
  for (const o of openings) {
    const s = o.at - o.width / 2;
    if (s > cursor + 0.001) solids.push([cursor, s]);
    cursor = o.at + o.width / 2;
  }
  if (cursor < length - 0.001) solids.push([cursor, length]);
  const point = (d: number, offset = 0): [number, number] => [w.a[0] + ux * d - uz * offset, w.a[1] + uz * d + ux * offset];
  return { length, ux, uz, solids, openings, point };
}

/** Deterministic PRNG so trees land in the same place every render. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type TreeSpot = { x: number; z: number; s: number; r: number };
export function treeSpots(seed = 7, count = 54, pool = false): TreeSpot[] {
  const rnd = mulberry32(seed);
  const out: TreeSpot[] = [];
  let guard = 0;
  while (out.length < count && guard++ < 4000) {
    const ang = rnd() * Math.PI * 2;
    const dist = 13 + Math.pow(rnd(), 0.8) * 34;
    const x = Math.cos(ang) * dist;
    const z = 4 + Math.sin(ang) * dist;
    // keep the front lawn & view corridor open
    if (z > 9 && z < 34 && x > -18 && x < 14) continue;
    if (pool && x > -10 && x < 0 && z > 8 && z < 15) continue;
    if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 2.6)) continue;
    out.push({ x, z, s: 0.75 + rnd() * 0.65, r: rnd() * Math.PI * 2 });
  }
  return out;
}
