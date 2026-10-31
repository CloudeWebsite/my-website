#!/usr/bin/env node
/**
 * Renders project imagery from the procedural house model.
 *
 *   npm run dev                 # in one terminal
 *   npm run render:stills       # in another (needs Playwright + Chromium)
 *
 * Optional: RENDER_ONLY=lake-house-dusk,studio-model  RENDER_BASE=http://localhost:3000
 * Output: public/renders/<name>.jpg
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, "public", "renders");
const base = process.env.RENDER_BASE ?? "http://localhost:3000";

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("Playwright is required: npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}
const sharp = require("sharp");

const V = {
  dusk: { geo: 3, env: 3, cam: 3 },
  day: { geo: 3, env: 2, cam: 3 },
  aerial: { geo: 2, env: 2, cam: 2 },
  aerialRoof: { geo: 3, env: 2, cam: 2, roof: 1 },
  aerialDusk: { geo: 3, env: 3, cam: 2, roof: 1 },
  blueprint: { geo: 0, env: 0, cam: 1 },
  layout: { geo: 1, env: 1, cam: 1 },
  rear: { geo: 3, env: 2, cam: 3, camera: { position: [24, 5.5, -16], target: [0, 2, 1], fov: 34 } },
  rearDusk: { geo: 3, env: 3, cam: 3, camera: { position: [24, 4, -16], target: [0, 2.2, 1], fov: 34 } },
  side: { geo: 3, env: 2, cam: 3, camera: { position: [-26, 3.2, 6], target: [0, 2.4, 3], fov: 34 } },
  wing: { geo: 3, env: 3, cam: 3, camera: { position: [10.5, 1.6, 26], target: [6, 2.8, 10], fov: 36 } },
  interior: { geo: 3, env: 2, cam: 3, roof: 1, camera: { position: [-8.2, 1.5, -3.9], target: [-4.6, 1.1, 4.4], fov: 58 } },
  interiorDusk: { geo: 3, env: 3, cam: 3, roof: 1, camera: { position: [-8.2, 1.5, -3.9], target: [-4.6, 1.1, 4.4], fov: 58 } },
  kitchen: { geo: 3, env: 2, cam: 3, roof: 1, camera: { position: [-0.4, 1.55, 0.6], target: [4.4, 1.0, -3.4], fov: 56 } },
  studio: { geo: 3, env: 3, cam: 3, roof: 1, camera: { position: [4.0, 1.5, 8.7], target: [6.4, 2.2, 12.5], fov: 60 } },
  model: { geo: 1.62, env: 1, cam: 1, camera: { position: [-11, 6.5, 19], target: [0.5, 0.3, 3.5], fov: 34 } },
};

const H = {
  lake: { roof: "gable", facade: "stone", roofTone: "#2a2b2d", ground: "grass", trees: "pine", mountains: true, pool: false, seed: 7 },
  margalla: { roof: "gable", facade: "render", roofTone: "#3a3631", ground: "grass", trees: "mixed", mountains: true, pool: false, seed: 21 },
  courtyard: { roof: "flat", facade: "render", roofTone: "#d9d4ca", ground: "sand", trees: "round", mountains: false, pool: true, seed: 33 },
  haveli: { roof: "flat", facade: "brick", roofTone: "#5a3a2a", ground: "grass", trees: "round", mountains: false, pool: false, seed: 44 },
  timber: { roof: "gable", facade: "timber", roofTone: "#1f2022", ground: "snow", trees: "pine", mountains: true, pool: false, seed: 55 },
  orchard: { roof: "gable", facade: "brick", roofTone: "#2f3a33", ground: "grass", trees: "mixed", mountains: false, pool: true, seed: 66 },
  interiors: { roof: "gable", facade: "render", roofTone: "#2a2b2d", ground: "grass", trees: "round", mountains: false, pool: false, seed: 77 },
};

const SHOTS = [
  ["lake-house-aerial", H.lake, V.aerial],
  ["lake-house-dusk", H.lake, V.dusk],
  ["lake-house-wing", H.lake, V.wing],
  ["lake-house-rear", H.lake, V.rear],
  ["lake-house-interior", H.lake, V.interiorDusk],
  ["lake-house-blueprint", H.lake, V.blueprint],
  ["lake-house-layout", H.lake, V.layout],
  ["margalla-day", H.margalla, V.day],
  ["margalla-aerial", H.margalla, V.aerialRoof],
  ["margalla-dusk", H.margalla, V.rearDusk],
  ["margalla-kitchen", H.margalla, V.kitchen],
  ["courtyard-aerial", H.courtyard, V.aerialRoof],
  ["courtyard-day", H.courtyard, V.day],
  ["courtyard-dusk", H.courtyard, V.dusk],
  ["courtyard-side", H.courtyard, V.side],
  ["haveli-day", H.haveli, V.day],
  ["haveli-aerial", H.haveli, V.aerial],
  ["haveli-dusk", H.haveli, V.rearDusk],
  ["haveli-blueprint", H.haveli, V.blueprint],
  ["haveli-layout", H.haveli, V.layout],
  ["timber-dusk", H.timber, V.dusk],
  ["timber-aerial", H.timber, V.aerialDusk],
  ["timber-side", H.timber, V.side],
  ["timber-studio", H.timber, V.studio],
  ["orchard-aerial", H.orchard, V.aerialRoof],
  ["orchard-day", H.orchard, V.day],
  ["orchard-rear", H.orchard, V.rear],
  ["interiors-living", H.interiors, V.interior],
  ["interiors-dusk", H.interiors, V.interiorDusk],
  ["interiors-kitchen", H.interiors, V.kitchen],
  ["interiors-layout", H.interiors, V.layout],
  ["studio-model", H.lake, V.model, 1200, 1500],
];

const only = process.env.RENDER_ONLY?.split(",").map((s) => s.trim()).filter(Boolean);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("page error:", e.message));

for (const [name, house, view, w = 1600, h = 1000] of SHOTS) {
  if (only && !only.includes(name)) continue;
  const t = Date.now();
  const preset = { house, ...view };
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`${base}/render?w=${w}&h=${h}&p=${encodeURIComponent(JSON.stringify(preset))}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__renderReady === true, null, { timeout: 180_000 });
  const png = await page.locator("canvas").screenshot({ type: "png" });
  await sharp(png).jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: "4:4:4" }).toFile(path.join(out, `${name}.jpg`));
  console.log(`✓ ${name} (${((Date.now() - t) / 1000).toFixed(1)}s)`);
}
await browser.close();
