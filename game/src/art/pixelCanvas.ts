import type * as Phaser from 'phaser';

/** A colour as 0xRRGGBB. */
export type Rgb = number;

/**
 * A tiny pixel-art drawing surface. Draw with rectangles, ellipses and single pixels,
 * add a 1 px outline, then turn it into a Phaser texture.
 */
export class PixelCanvas {
  /** 0 = transparent, otherwise 0xAARRGGBB. */
  private readonly data: Uint32Array;

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.data = new Uint32Array(w * h);
  }

  px(x: number, y: number, color: Rgb, alpha = 255): void {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = ((alpha << 24) | color) >>> 0;
  }

  /** The colour at a pixel (0xRRGGBB), or -1 if it is transparent or off-canvas. */
  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1;
    const v = this.data[y * this.w + x];
    return v === 0 ? -1 : v & 0xffffff;
  }

  filled(x: number, y: number): boolean {
    return this.get(x, y) !== -1;
  }

  rect(x: number, y: number, w: number, h: number, color: Rgb, alpha = 255): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, color, alpha);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: Rgb, alpha = 255): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(x, y, color, alpha);
      }
    }
  }

  /** Calls `fn` for every pixel inside the ellipse, with its normalised offset from the centre. */
  eachInEllipse(cx: number, cy: number, rx: number, ry: number, fn: (x: number, y: number, nx: number, ny: number) => void): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) fn(x, y, nx, ny);
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, color: Rgb): void {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      this.px(Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps), color);
    }
  }

  /** Adds a 1 px border (4-neighbour) around everything drawn so far. */
  outline(color: Rgb): void {
    const add: number[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.filled(x, y)) continue;
        if (this.filled(x - 1, y) || this.filled(x + 1, y) || this.filled(x, y - 1) || this.filled(x, y + 1)) {
          add.push(x, y);
        }
      }
    }
    for (let i = 0; i < add.length; i += 2) this.px(add[i], add[i + 1], color);
  }

  /** Mirror left-right, for making a left-facing sprite from a right-facing one. */
  flipped(): PixelCanvas {
    const out = new PixelCanvas(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) out.data[y * this.w + (this.w - 1 - x)] = this.data[y * this.w + x];
    }
    return out;
  }

  toTexture(scene: Phaser.Scene, key: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = this.w;
    canvas.height = this.h;
    const ctx = canvas.getContext('2d')!;
    const image = ctx.createImageData(this.w, this.h);
    for (let i = 0; i < this.data.length; i++) {
      const v = this.data[i];
      image.data[i * 4] = (v >> 16) & 0xff;
      image.data[i * 4 + 1] = (v >> 8) & 0xff;
      image.data[i * 4 + 2] = v & 0xff;
      image.data[i * 4 + 3] = v >>> 24;
    }
    ctx.putImageData(image, 0, 0);
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas);
  }
}

/** Small, fast, repeatable random numbers, so generated art looks the same every run. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Blend two colours. t = 0 gives a, t = 1 gives b. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const ch = (shift: number) => Math.round(((a >> shift) & 0xff) * (1 - t) + ((b >> shift) & 0xff) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}
