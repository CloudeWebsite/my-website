/**
 * Optional image-sequence hero (Apple-style). Enabled when
 * NEXT_PUBLIC_HERO_FRAMES is set to the number of frames in /public/frames
 * (0001.webp … NNNN.webp, produced by scripts/extract-frames.sh).
 */
export class FrameSequence {
  private ctx: CanvasRenderingContext2D;
  private images: Array<HTMLImageElement | null>;
  private target = 0;
  private current = 0;
  private drawn = -1;
  private raf = 0;
  private running = false;

  constructor(private canvas: HTMLCanvasElement, private count: number, private base = "/frames") {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
    this.images = new Array<HTMLImageElement | null>(count).fill(null);
    // first 10 eagerly, the rest progressively in strides so any scroll position has a near frame
    for (let i = 0; i < Math.min(10, count); i++) this.load(i);
    const strides = [16, 8, 4, 2, 1];
    let delay = 0;
    for (const s of strides) {
      for (let i = 0; i < count; i += s) {
        const idx = i;
        window.setTimeout(() => this.load(idx), (delay += 4));
      }
    }
  }

  private load(i: number) {
    if (this.images[i]) return;
    const img = new Image();
    img.decoding = "async";
    img.src = `${this.base}/${String(i + 1).padStart(4, "0")}.webp`;
    img.onload = () => {
      if (Math.round(this.current) === i) this.drawn = -1;
    };
    this.images[i] = img;
  }

  /** s: 0 → 3 like the 3D scene. */
  setStage(s: number) {
    this.target = (Math.min(3, Math.max(0, s)) / 3) * (this.count - 1);
  }

  private nearest(i: number): HTMLImageElement | null {
    for (let d = 0; d < this.count; d++) {
      for (const j of [i - d, i + d]) {
        const img = this.images[j];
        if (img && img.complete && img.naturalWidth) return img;
      }
    }
    return null;
  }

  private draw() {
    const i = Math.round(this.current);
    if (i === this.drawn) return;
    const img = this.nearest(i);
    if (!img) return;
    const { width: w, height: h } = this.canvas;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    this.ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    this.drawn = i;
  }

  private tick = () => {
    if (!this.running) return;
    this.current += (this.target - this.current) * 0.2;
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  };

  resize(w: number, h: number) {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.drawn = -1;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    this.images = [];
  }
}
