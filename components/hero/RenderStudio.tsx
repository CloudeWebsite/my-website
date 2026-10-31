"use client";

import { useEffect, useRef } from "react";
import { HouseScene, type CameraOverride, type HouseOptions } from "./scene";

declare global {
  interface Window {
    __renderReady?: boolean;
  }
}

export type RenderPreset = {
  house: Partial<HouseOptions>;
  geo: number;
  env: number;
  cam: number;
  roof?: number;
  camera?: CameraOverride;
};

export function RenderStudio() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const params = new URLSearchParams(window.location.search);
    const preset = JSON.parse(params.get("p") ?? "{}") as Partial<RenderPreset>;
    const w = Number(params.get("w") ?? 1600);
    const h = Number(params.get("h") ?? 1000);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const scene = new HouseScene(canvas, { house: preset.house, quality: "high", preserveDrawingBuffer: true });
    scene.skipIntro();
    scene.setStage({ geo: preset.geo ?? 3, env: preset.env ?? 3, cam: preset.cam ?? 3 }, true);
    if (preset.roof !== undefined) scene.setRoof(preset.roof);
    if (preset.camera) scene.setCamera(preset.camera);
    scene.resize(w, h);
    requestAnimationFrame(() => {
      scene.renderNow();
      requestAnimationFrame(() => {
        scene.renderNow();
        window.__renderReady = true;
      });
    });
    return () => scene.dispose();
  }, []);
  return <canvas ref={ref} style={{ display: "block" }} />;
}
