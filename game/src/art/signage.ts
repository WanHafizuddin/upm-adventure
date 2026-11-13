import type * as Phaser from 'phaser';
import { C } from './palette';
import { PixelCanvas, mix } from './pixelCanvas';
import { drawText, textWidth } from './pixelFont';

// UPM signage, drawn as pixel art: the campus monument sign, banners, signposts and wall plaques.

export const UPM_RED = 0xb5121b;
const UPM_WHITE = 0xeeeeef;
const UPM_GREY = 0x4e4f57; // dark enough to read on the white panel under lamp light
const PLAQUE = 0x2a2140;
const PLAQUE_TEXT = 0xf4ead2;

export function createSignage(scene: Phaser.Scene): void {
  upmMonument().toTexture(scene, 'upm_monument');
}

/** Texture key for a sign; draws it the first time it's needed. */
export function signTexture(scene: Phaser.Scene, text: string, post: boolean): string {
  const key = `sign_${post ? 'post' : 'plaque'}_${text}`;
  if (!scene.textures.exists(key)) (post ? signpost(text) : plaque(text)).toTexture(scene, key);
  return key;
}

/** A dark wall plaque with cream lettering. */
function plaque(text: string): PixelCanvas {
  const w = textWidth(text) + 10;
  const p = new PixelCanvas(w + 2, 15);
  p.rect(1, 1, w, 13, PLAQUE);
  p.rect(1, 1, w, 1, mix(PLAQUE, 0xffffff, 0.25));
  p.rect(1, 13, w, 1, UPM_RED);
  drawText(p, text, 6, 4, PLAQUE_TEXT);
  p.outline(C.outline);
  return p;
}

/** A plaque on a wooden post, for paths. */
function signpost(text: string): PixelCanvas {
  const w = textWidth(text) + 10;
  const s = new PixelCanvas(w + 2, 34);
  s.rect(Math.floor(w / 2) - 1, 13, 3, 21, C.wood1);
  s.rect(Math.floor(w / 2) - 1, 13, 1, 21, C.wood2);
  s.rect(1, 1, w, 13, PLAQUE);
  s.rect(1, 1, w, 1, mix(PLAQUE, 0xffffff, 0.25));
  s.rect(1, 13, w, 1, UPM_RED);
  drawText(s, text, 6, 4, PLAQUE_TEXT);
  s.outline(C.outline);
  return s;
}

/** The big UPM sign: red letters on a white panel, with the university's name and motto. */
function upmMonument(): PixelCanvas {
  const w = 112;
  const m = new PixelCanvas(w, 70);
  // Panel.
  m.rect(4, 0, w - 8, 52, UPM_WHITE);
  m.rect(4, 0, w - 8, 4, UPM_RED);
  m.rect(4, 49, w - 8, 3, UPM_RED);
  m.rect(4, 4, 2, 45, mix(UPM_WHITE, C.outline, 0.15)); // edge shading
  m.rect(w - 6, 4, 2, 45, mix(UPM_WHITE, C.outline, 0.3));
  const big = 'UPM';
  drawText(m, big, Math.round((w - textWidth(big, 3)) / 2), 8, UPM_RED, 3);
  for (const [line, y] of [
    ['UNIVERSITI PUTRA', 33],
    ['MALAYSIA', 41],
  ] as const) {
    drawText(m, line, Math.round((w - textWidth(line)) / 2), y, UPM_GREY);
  }
  // Stone plinth with the motto.
  m.rect(0, 52, w, 18, C.stone0);
  m.rect(0, 52, w, 2, C.stone1);
  m.rect(0, 66, w, 4, C.stone2);
  for (let x = 14; x < w; x += 28) m.rect(x, 54, 1, 12, C.stone2);
  const motto = 'BERILMU BERBAKTI';
  drawText(m, motto, Math.round((w - textWidth(motto)) / 2), 57, mix(C.lampGlass, 0xffffff, 0.3));
  m.outline(C.outline);
  return m;
}
