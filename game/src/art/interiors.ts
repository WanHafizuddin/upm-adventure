import type * as Phaser from 'phaser';
import type { RoomSpec } from '../data/locations';
import { C } from './palette';
import { PixelCanvas, mix, rng, type Rgb } from './pixelCanvas';

// Indoor art: room floors and walls, and furniture. Everything is drawn in code, like the courtyard.

export type FurnitureKind =
  | 'shelf'
  | 'table'
  | 'desk'
  | 'monitors'
  | 'cabinet'
  | 'dispenser'
  | 'sofa'
  | 'plant'
  | 'board'
  | 'window'
  | 'counter'
  | 'fridge'
  | 'cart'
  | 'labdoor'
  | 'motorcycle'
  | 'busstop'
  | 'labbench'
  | 'fumehood'
  | 'chemcabinet'
  | 'officedesk'
  | 'officedoor'
  | 'stairs';

/** Height of the back wall in every room. */
export const WALL_H = 48;
/** Width of the doorway gap in a room's bottom wall. */
export const DOOR_W = 36;

/** How each piece blocks walking (footprint at its base), and whether it hangs on the wall. */
export const FURNITURE: Readonly<Record<FurnitureKind, { block?: [number, number]; wall?: boolean }>> = {
  shelf: { block: [40, 10] },
  table: { block: [44, 10] },
  desk: { block: [58, 10] },
  monitors: { block: [64, 10] },
  cabinet: { block: [18, 8] },
  dispenser: { block: [10, 6] },
  sofa: { block: [44, 8] },
  plant: { block: [10, 6] },
  board: { wall: true },
  window: { wall: true },
  counter: { block: [76, 10] },
  fridge: { block: [20, 8] },
  cart: { block: [18, 6] },
  labdoor: { wall: true },
  motorcycle: { block: [26, 6] },
  busstop: { block: [6, 4] },
  labbench: { block: [64, 10] },
  fumehood: { block: [52, 10] },
  chemcabinet: { block: [36, 8] },
  officedesk: { block: [64, 10] },
  officedoor: { wall: true },
  stairs: { wall: true },
};

export function createInteriorSprites(scene: Phaser.Scene): void {
  const make: Record<FurnitureKind, () => PixelCanvas> = {
    shelf,
    table,
    desk,
    monitors,
    cabinet,
    dispenser,
    sofa,
    plant,
    board,
    window: tallWindow,
    counter,
    fridge,
    cart,
    labdoor,
    motorcycle,
    busstop,
    labbench,
    fumehood,
    chemcabinet,
    officedesk,
    officedoor,
    stairs,
  };
  for (const [kind, draw] of Object.entries(make)) draw().toTexture(scene, `f_${kind}`);
}

// --- Rooms -------------------------------------------------------------------------

export function roomTexture(spec: RoomSpec): PixelCanvas {
  const c = new PixelCanvas(spec.w, spec.h);
  const r = rng(spec.w * 31 + spec.h);

  for (let y = WALL_H; y < spec.h; y++) {
    for (let x = 0; x < spec.w; x++) c.px(x, y, floorColor(spec.floor, x, y, r));
  }

  // Back wall: trim, plaster, dado rail, darker wainscot, skirting.
  for (let y = 0; y < WALL_H; y++) {
    for (let x = 0; x < spec.w; x++) {
      let col: Rgb = spec.wall;
      if (y < 3) col = mix(spec.wall, C.outline, 0.5);
      else if (y >= WALL_H - 16) col = mix(spec.wall, C.outline, 0.3);
      if (y === WALL_H - 16) col = mix(spec.wall, 0xffffff, 0.2);
      if (y >= WALL_H - 3) col = mix(spec.wall, C.outline, 0.6);
      if (y >= WALL_H - 16 && y < WALL_H - 3 && x % 24 === 0) col = mix(spec.wall, C.outline, 0.45);
      c.px(x, y, col);
    }
  }
  // Soft shadow the wall casts onto the floor.
  for (let y = WALL_H; y < WALL_H + 6; y++) {
    const t = 0.45 * (1 - (y - WALL_H) / 6);
    for (let x = 0; x < spec.w; x++) c.px(x, y, mix(c.get(x, y), C.outline, t));
  }

  // Side and bottom walls, with the doorway left open.
  const edge = mix(spec.wall, C.outline, 0.65);
  c.rect(0, 0, 6, spec.h, edge);
  c.rect(spec.w - 6, 0, 6, spec.h, edge);
  const doorX = spec.doorX;
  for (let x = 0; x < spec.w; x++) {
    if (doorX !== undefined && Math.abs(x + 0.5 - doorX) < DOOR_W / 2) continue;
    c.rect(x, spec.h - 8, 1, 8, edge);
  }
  if (doorX !== undefined) {
    c.rect(doorX - 16, spec.h - 14, 32, 6, 0x5a3a2a); // door mat
    c.rect(doorX - 16, spec.h - 14, 32, 1, 0x7a5236);
  }
  return c;
}

function floorColor(kind: RoomSpec['floor'], x: number, y: number, r: () => number): Rgb {
  if (kind === 'wood') {
    const row = Math.floor(y / 8);
    const offset = (row * 23) % 48;
    if (y % 8 === 7 || (x + offset) % 48 === 0) return C.wood0;
    return r() < 0.06 ? C.wood0 : row % 3 === 0 ? C.wood2 : C.wood1;
  }
  if (kind === 'carpet') {
    // Deep plum carpet with a faint diamond pattern.
    const d = (Math.abs((x % 24) - 12) + Math.abs((y % 24) - 12)) % 12;
    if (d === 0) return 0x5e4268;
    return r() < 0.08 ? 0x3f2846 : 0x4b3254;
  }
  const grout = x % 16 === 0 || y % 16 === 0;
  if (grout) return 0x575b6e;
  const checker = (Math.floor(x / 16) + Math.floor(y / 16)) % 2 === 0;
  if (x % 16 === 2 && y % 16 === 2) return 0xa3a8ba; // sheen
  return checker ? 0x7c8195 : 0x737889;
}

// --- Furniture ---------------------------------------------------------------------

const BOOK_COLORS = [0x8e3b46, 0x2f5d7c, 0x4f7a4a, 0xb08a3e, 0x6a4a7a, 0x9a6a4a, 0x3a3f6a, 0xc0b49a];

function shelf(): PixelCanvas {
  const s = new PixelCanvas(40, 50);
  const r = rng(77);
  s.rect(0, 2, 40, 48, C.wood0);
  s.rect(0, 2, 40, 3, C.wood2);
  for (let row = 0; row < 4; row++) {
    const top = 6 + row * 11;
    s.rect(2, top, 36, 9, mix(C.wood0, C.outline, 0.5));
    let x = 3;
    while (x < 37) {
      const w = 2 + Math.floor(r() * 2);
      const h = 6 + Math.floor(r() * 3);
      const col = BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)];
      s.rect(x, top + 9 - h, w, h, col);
      s.rect(x, top + 9 - h, 1, h, mix(col, 0xffffff, 0.2));
      x += w + (r() < 0.15 ? 2 : 0);
    }
    s.rect(1, top + 9, 38, 2, C.wood1);
  }
  s.outline(C.outline);
  return s;
}

function table(): PixelCanvas {
  const t = new PixelCanvas(46, 28);
  t.rect(3, 19, 3, 8, C.wood0);
  t.rect(40, 19, 3, 8, C.wood0);
  t.rect(1, 3, 44, 14, C.wood2);
  t.rect(1, 3, 44, 1, mix(C.wood2, 0xffffff, 0.2));
  t.rect(1, 17, 44, 3, C.wood0);
  t.rect(8, 7, 12, 8, C.paper); // open book
  t.rect(14, 7, 1, 8, C.paperShade);
  t.rect(34, 4, 6, 3, 0x2f6a4a); // banker's lamp
  t.rect(36, 7, 2, 4, C.metal1);
  t.px(37, 6, C.lampCore);
  t.outline(C.outline);
  return t;
}

function desk(): PixelCanvas {
  const d = new PixelCanvas(60, 34);
  d.rect(40, 0, 14, 10, C.metal0);
  d.rect(41, 1, 12, 7, 0x6fd6e8);
  d.rect(41, 1, 12, 1, 0xb8f2ff);
  d.rect(46, 10, 2, 2, C.metal1);
  d.rect(1, 11, 58, 7, C.wood2);
  d.rect(1, 11, 58, 1, mix(C.wood2, 0xffffff, 0.2));
  d.rect(1, 18, 58, 15, C.wood1);
  for (let x = 12; x < 58; x += 12) d.rect(x, 19, 1, 13, C.wood0);
  d.rect(8, 13, 10, 3, C.paper); // stack of forms
  d.outline(C.outline);
  return d;
}

function monitors(): PixelCanvas {
  const m = new PixelCanvas(66, 38);
  for (let i = 0; i < 3; i++) {
    const x = 3 + i * 20;
    m.rect(x, 0, 19, 14, C.metal0);
    m.rect(x + 1, 1, 17, 11, 0x4fb8c8);
    for (let y = 2; y < 12; y += 2) m.rect(x + 1, 1 + y, 17, 1, 0x3a8fa0);
    m.rect(x + 4 + i * 3, 6, 2, 4, 0x1d3a44); // a figure on camera
  }
  m.rect(1, 16, 64, 8, C.metal1);
  m.rect(1, 16, 64, 1, C.metal2);
  m.rect(20, 18, 22, 3, C.metal0); // keyboard
  m.rect(1, 24, 64, 13, C.metal0);
  m.outline(C.outline);
  return m;
}

function cabinet(): PixelCanvas {
  const c = new PixelCanvas(20, 34);
  c.rect(1, 1, 18, 32, 0x8a8fa0);
  c.rect(1, 1, 18, 2, 0xa8adbd);
  for (let i = 0; i < 3; i++) {
    c.rect(2, 4 + i * 10, 16, 9, 0x7a7f90);
    c.rect(7, 7 + i * 10, 6, 2, C.metal0);
  }
  c.outline(C.outline);
  return c;
}

function dispenser(): PixelCanvas {
  const d = new PixelCanvas(14, 30);
  d.rect(3, 0, 8, 9, 0x7fb4e8);
  d.rect(4, 1, 2, 7, 0xb8dcff);
  d.rect(2, 9, 10, 20, 0xd8dde6);
  d.rect(4, 13, 2, 2, 0x4a7fd0);
  d.rect(8, 13, 2, 2, 0xd04a4a);
  d.outline(C.outline);
  return d;
}

function sofa(): PixelCanvas {
  const s = new PixelCanvas(48, 26);
  const red = 0x8a2f35; // close to UPM red, slightly dimmed for night
  s.rect(2, 2, 44, 10, mix(red, C.outline, 0.25));
  s.rect(0, 8, 6, 16, red);
  s.rect(42, 8, 6, 16, red);
  s.rect(6, 12, 36, 10, red);
  s.rect(6, 12, 36, 2, mix(red, 0xffffff, 0.2));
  s.rect(24, 12, 1, 10, mix(red, C.outline, 0.4));
  s.outline(C.outline);
  return s;
}

function plant(): PixelCanvas {
  const p = new PixelCanvas(18, 28);
  const r = rng(12);
  p.rect(5, 18, 8, 9, 0x9a5a3a);
  p.rect(5, 18, 8, 2, 0xb8714a);
  for (const [cx, cy, rx, ry] of [
    [9, 11, 7, 7],
    [5, 8, 4, 4],
    [13, 8, 4, 4],
  ] as const) {
    p.eachInEllipse(cx, cy, rx, ry, (x, y, nx, ny) => {
      const s = -nx * 0.4 - ny * 0.8 + (r() - 0.5) * 0.5;
      p.px(x, y, s > 0.4 ? 0x5aa86a : s > -0.2 ? 0x3d8a52 : 0x2a643c);
    });
  }
  p.outline(C.outline);
  return p;
}

function board(): PixelCanvas {
  const b = new PixelCanvas(42, 28);
  const r = rng(5);
  b.rect(0, 0, 42, 28, C.wood0);
  b.rect(2, 2, 38, 24, 0xb08a5a);
  const papers = [0xefe7cf, 0xf2d26b, 0xe8a0b8, 0xa8d0f0, 0xefe7cf];
  for (let i = 0; i < 6; i++) {
    const x = 3 + Math.floor(r() * 30);
    const y = 3 + Math.floor(r() * 16);
    const col = papers[i % papers.length];
    b.rect(x, y, 8, 7, col);
    b.rect(x + 1, y + 2, 5, 1, C.ink);
    b.rect(x + 1, y + 4, 4, 1, C.ink);
    b.px(x + 4, y, 0xc0392b); // pin
  }
  b.outline(C.outline);
  return b;
}

function tallWindow(): PixelCanvas {
  const w = new PixelCanvas(64, 34);
  w.rect(0, 0, 64, 34, C.windowFrame);
  for (let i = 0; i < 4; i++) {
    const x = 2 + i * 15;
    for (let y = 2; y < 32; y++) {
      for (let dx = 0; dx < 14; dx++) w.px(x + dx, y, (dx + y) % 19 < 2 ? C.windowSheen : C.windowDark);
    }
  }
  w.outline(C.outline);
  return w;
}

function counter(): PixelCanvas {
  const c = new PixelCanvas(78, 34);
  c.rect(1, 10, 76, 6, 0xc8ccd6);
  c.rect(1, 10, 76, 1, 0xe2e6ee);
  c.rect(1, 16, 76, 17, C.wood1);
  for (let x = 1; x < 76; x += 19) {
    c.rect(x, 17, 18, 15, C.wood2);
    c.rect(x + 8, 23, 3, 1, C.metal0);
  }
  c.rect(10, 11, 18, 4, C.metal1); // sink
  c.rect(12, 12, 14, 2, C.metal0);
  c.rect(18, 6, 2, 5, C.metal2); // tap
  c.rect(46, 4, 8, 7, C.metal2); // kettle
  c.rect(54, 6, 2, 3, C.metal0);
  c.rect(62, 7, 4, 4, 0xefe7cf); // mugs
  c.rect(68, 7, 4, 4, 0x8e3b46);
  c.outline(C.outline);
  return c;
}

function fridge(): PixelCanvas {
  const f = new PixelCanvas(22, 40);
  f.rect(1, 1, 20, 38, 0xdfe3ea);
  f.rect(1, 1, 20, 2, 0xf2f4f8);
  f.rect(1, 14, 20, 1, 0xa8adbd);
  f.rect(17, 5, 2, 6, C.metal1);
  f.rect(17, 18, 2, 10, C.metal1);
  f.rect(5, 20, 3, 3, 0xe86a9a); // magnets
  f.rect(9, 24, 3, 3, 0xf2cf6b);
  f.outline(C.outline);
  return f;
}

function cart(): PixelCanvas {
  const c = new PixelCanvas(24, 26);
  c.line(18, 0, 14, 16, C.wood2); // mop handle
  c.rect(2, 10, 20, 12, 0x5a6378);
  c.rect(4, 12, 9, 8, 0xe0c040); // bucket
  c.rect(4, 12, 9, 2, 0xf0d870);
  c.rect(15, 12, 5, 8, 0x4a7fd0); // spray bottles
  c.rect(3, 22, 3, 3, C.metal0);
  c.rect(18, 22, 3, 3, C.metal0);
  c.outline(C.outline);
  return c;
}

function labdoor(): PixelCanvas {
  const d = new PixelCanvas(34, 46);
  d.rect(0, 0, 34, 46, C.stone1);
  d.rect(3, 4, 28, 42, 0x5f7088);
  d.rect(10, 9, 14, 10, C.windowDark);
  d.rect(25, 26, 3, 3, C.metal2);
  d.rect(6, 22, 22, 6, 0xefe7cf); // sign
  d.rect(8, 24, 18, 1, 0xc0392b);
  d.line(3, 30, 31, 40, C.tapeYellow); // police tape across
  d.line(3, 31, 31, 41, C.tapeYellow);
  d.line(3, 40, 31, 30, C.tapeYellow);
  d.outline(C.outline);
  return d;
}

function motorcycle(): PixelCanvas {
  const m = new PixelCanvas(34, 24);
  m.ellipse(6, 18, 5, 5, C.metal0);
  m.ellipse(27, 18, 5, 5, C.metal0);
  m.ellipse(6, 18, 2, 2, C.metal2);
  m.ellipse(27, 18, 2, 2, C.metal2);
  m.rect(7, 10, 20, 7, 0xb5222b); // body
  m.rect(7, 10, 20, 2, 0xd84a4f);
  m.rect(9, 7, 10, 3, 0x1d1a22); // seat
  m.rect(24, 4, 2, 7, C.metal1); // fork
  m.rect(21, 3, 8, 2, C.metal0); // handlebar
  m.rect(28, 9, 3, 3, 0xffe9a0); // headlamp
  m.outline(C.outline);
  return m;
}

function labbench(): PixelCanvas {
  const b = new PixelCanvas(66, 36);
  b.rect(1, 12, 64, 6, 0x2a2d36); // black epoxy top
  b.rect(1, 12, 64, 1, 0x4a4e5c);
  b.rect(1, 18, 64, 17, 0xc8ccd6); // cupboards
  for (let x = 1; x < 64; x += 16) {
    b.rect(x, 19, 15, 15, 0xb4b9c6);
    b.rect(x + 7, 25, 2, 1, C.metal0);
  }
  // Glassware: flasks, a beaker, a rack of test tubes.
  b.rect(6, 4, 4, 2, 0x8fd8e8);
  b.ellipse(8, 9, 4, 3, 0x8fd8e8, 190);
  b.rect(6, 9, 5, 2, 0x5fbf8a);
  b.rect(18, 5, 6, 7, 0xb8e8f0);
  b.rect(18, 8, 6, 4, 0xe8a0b8);
  b.rect(30, 6, 14, 2, C.wood1);
  for (let i = 0; i < 4; i++) b.rect(31 + i * 3, 2, 2, 8, [0xf2cf6b, 0x8cc8ff, 0xe86a9a, 0x9fe0a0][i]);
  b.rect(50, 7, 10, 4, C.paper); // the logbook, open
  b.rect(55, 7, 1, 4, C.paperShade);
  b.rect(51, 8, 3, 1, C.ink);
  b.rect(57, 8, 2, 1, C.ink);
  b.outline(C.outline);
  return b;
}

function fumehood(): PixelCanvas {
  const f = new PixelCanvas(54, 60);
  f.rect(1, 1, 52, 58, 0xb8bcc8);
  f.rect(1, 1, 52, 4, 0x8a8fa0);
  f.rect(5, 9, 44, 28, 0x2c3a48); // inside, behind the glass sash
  f.rect(5, 9, 44, 1, 0x7fa8c0);
  f.rect(10, 26, 6, 10, 0x8fd8e8);
  f.rect(30, 22, 8, 14, 0xd8dde6);
  f.rect(5, 37, 44, 3, C.metal1); // sash handle
  f.rect(3, 42, 48, 16, 0x9aa0b0);
  f.rect(24, 46, 6, 4, 0xd04a4a); // emergency stop
  f.outline(C.outline);
  return f;
}

function chemcabinet(): PixelCanvas {
  const c = new PixelCanvas(38, 52);
  c.rect(1, 1, 36, 50, 0x8a8fa0);
  c.rect(1, 1, 36, 2, 0xa8adbd);
  c.rect(4, 5, 30, 30, 0x2c3440); // glass doors
  const bottles = [0x6a3a1a, 0xe8e8ee, 0x4a7fd0, 0x6a3a1a, 0x9fe0a0, 0xe8e8ee];
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 6; i++) c.rect(6 + i * 5, 8 + row * 14, 3, 9, bottles[(i + row * 2) % bottles.length]);
    c.rect(4, 18 + row * 14, 30, 1, 0x6a7080);
  }
  c.rect(18, 5, 1, 30, 0x6a7080);
  c.rect(4, 38, 30, 11, 0x7a7f90);
  c.rect(13, 39, 12, 9, 0xeeeeef); // hazard sign
  c.rect(17, 40, 4, 7, 0xd04a4a);
  c.outline(C.outline);
  return c;
}

function officedesk(): PixelCanvas {
  const d = new PixelCanvas(66, 36);
  d.rect(40, 0, 18, 12, C.metal0); // monitor
  d.rect(41, 1, 16, 9, 0x6fd6e8);
  d.rect(41, 1, 16, 1, 0xb8f2ff);
  d.rect(48, 12, 2, 2, C.metal1);
  d.rect(1, 13, 64, 8, C.wood2);
  d.rect(1, 13, 64, 1, mix(C.wood2, 0xffffff, 0.2));
  d.rect(6, 15, 14, 4, C.paper); // papers and a folder
  d.rect(9, 14, 10, 3, 0xc0392b);
  d.ellipse(28, 17, 3, 2, 0x5a3a28); // coffee ring
  d.ellipse(28, 17, 2, 1, C.wood2);
  d.rect(42, 15, 14, 3, C.metal1); // keyboard
  d.rect(1, 21, 64, 14, C.wood1);
  d.rect(4, 23, 18, 11, C.wood0); // drawers
  d.rect(12, 28, 3, 1, C.metal2);
  d.outline(C.outline);
  return d;
}

function officedoor(): PixelCanvas {
  const d = new PixelCanvas(30, 36);
  d.rect(0, 0, 30, 36, C.stone1);
  d.rect(3, 3, 24, 33, C.door1);
  d.rect(6, 6, 18, 12, C.door2);
  d.rect(6, 21, 18, 12, C.door2);
  d.rect(7, 7, 16, 10, C.door1);
  d.rect(7, 22, 16, 10, C.door1);
  d.rect(22, 19, 2, 2, C.lampGlass);
  d.outline(C.outline);
  return d;
}

function stairs(): PixelCanvas {
  const s = new PixelCanvas(46, 48);
  for (let i = 0; i < 8; i++) {
    const y = 44 - i * 5;
    s.rect(4 + i, y, 38 - i * 2, 5, i % 2 === 0 ? C.stone1 : C.stone0);
    s.rect(4 + i, y, 38 - i * 2, 1, mix(C.stone1, 0xffffff, 0.25));
  }
  s.rect(1, 6, 2, 42, C.metal1); // handrails
  s.rect(43, 6, 2, 42, C.metal1);
  s.rect(1, 6, 44, 2, C.metal2);
  s.outline(C.outline);
  return s;
}

function busstop(): PixelCanvas {
  const b = new PixelCanvas(18, 44);
  b.rect(8, 14, 2, 30, C.metal1);
  b.rect(1, 0, 16, 14, 0xefefef);
  b.rect(1, 0, 16, 4, 0xb5121b); // red band
  b.rect(4, 6, 10, 5, 0x2f5d7c); // little bus
  b.rect(5, 7, 3, 2, 0xb8dcff);
  b.rect(9, 7, 3, 2, 0xb8dcff);
  b.outline(C.outline);
  return b;
}
