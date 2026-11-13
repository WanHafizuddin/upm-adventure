import type * as Phaser from 'phaser';
import { BUILDING_H, DOOR_X, MAP_H, MAP_W, PLAZA, isPath, plazaDistance } from '../scenes/courtyardLayout';
import type { Look } from './look';
import { C } from './palette';
import { PixelCanvas, mix, rng, type Rgb } from './pixelCanvas';

// Every texture the courtyard uses is drawn here, in code, so the game needs no image files.

export const LIT_WINDOWS = [1, 5, 6]; // which window bays (0–7) have their lights on
export const WINDOW_BAY_X = (bay: number) => 48 + bay * 96;

/**
 * Registers every texture. Characters come out as `<id>_<facing>_<pose>`:
 * the player gets poses 0–2 (standing and two walking steps), everyone else pose 0.
 */
export function createSprites(scene: Phaser.Scene, player: Look, npcs: Readonly<Record<string, Look>>): void {
  ground().toTexture(scene, 'ground');
  building().toTexture(scene, 'building');
  [11, 23, 37].forEach((seed, i) => tree(seed).toTexture(scene, `tree_${i}`));
  bush(5, false).toTexture(scene, 'bush_0');
  bush(9, true).toTexture(scene, 'bush_1');
  lamp().toTexture(scene, 'lamp');
  bench().toTexture(scene, 'bench');
  fountain().toTexture(scene, 'fountain');
  tape().toTexture(scene, 'tape');
  briefcase().toTexture(scene, 'briefcase');
  paper().toTexture(scene, 'paper');
  marker(1).toTexture(scene, 'marker_1');
  marker(2).toTexture(scene, 'marker_2');
  shadow(40, 12).toTexture(scene, 'shadow_big');
  shadow(16, 6).toTexture(scene, 'shadow_small');
  firefly().toTexture(scene, 'firefly');
  accessCard().toTexture(scene, 'card');
  tumbler().toTexture(scene, 'tumbler');

  const drawCharacter = (id: string, look: Look, poses: ReadonlyArray<0 | 1 | 2>) => {
    for (const facing of ['down', 'up', 'right'] as const) {
      for (const pose of poses) {
        const c = character(look, facing, pose);
        c.toTexture(scene, `${id}_${facing}_${pose}`);
        if (facing === 'right') c.flipped().toTexture(scene, `${id}_left_${pose}`);
      }
    }
  };
  drawCharacter('player', player, [0, 1, 2]);
  for (const [id, look] of Object.entries(npcs)) drawCharacter(id, look, [0]);
}

// --- Ground ---------------------------------------------------------------

function ground(): PixelCanvas {
  const g = new PixelCanvas(MAP_W, MAP_H);
  const r = rng(7);
  const coarse = valueNoise(rng(99), 40);
  const grassShades = [C.grassDark, C.grass0, C.grass1, C.grass2, C.grass3];

  // Grass with soft patches of lighter and darker turf.
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      let shade = coarse(x, y) < 0.33 ? 1 : coarse(x, y) < 0.7 ? 2 : 3;
      const f = r();
      if (f < 0.1) shade--;
      else if (f > 0.94) shade++;
      g.px(x, y, grassShades[shade]);
    }
  }

  // Grass tufts.
  for (let i = 0; i < 1800; i++) {
    const x = Math.floor(r() * MAP_W);
    const y = BUILDING_H + 4 + Math.floor(r() * (MAP_H - BUILDING_H - 4));
    if (isPath(x, y) || isPath(x, y + 2)) continue;
    g.px(x, y, C.grass3);
    g.px(x - 1, y + 1, C.grass3);
    g.px(x + 1, y + 1, C.grass3);
    g.px(x, y - 1, C.tuft);
    g.px(x, y + 1, C.grass0);
  }

  // Cobbled paths and the stone ring around the plaza.
  for (let y = BUILDING_H; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (!isPath(x, y)) continue;
      const d = plazaDistance(x, y);
      if (d < PLAZA.outer && d >= PLAZA.inner) {
        g.px(x, y, ringStone(x, y, d));
      } else {
        g.px(x, y, cobble(x, y));
      }
    }
  }

  // Dark edge where grass meets path, so paths read crisply.
  for (let y = BUILDING_H; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (isPath(x, y)) continue;
      if (isPath(x + 1, y) || isPath(x - 1, y) || isPath(x, y + 1) || isPath(x, y - 1)) g.px(x, y, C.grassDark);
    }
  }

  // Flower beds along the front of the building, either side of the door path.
  for (const [x0, x1] of [
    [20, 340],
    [428, 748],
  ]) {
    g.rect(x0, BUILDING_H + 8, x1 - x0, 14, C.soil);
    g.rect(x0, BUILDING_H + 21, x1 - x0, 1, C.outline);
    for (let i = 0; i < (x1 - x0) / 3; i++) {
      const fx = x0 + 2 + Math.floor(r() * (x1 - x0 - 4));
      const fy = BUILDING_H + 10 + Math.floor(r() * 10);
      g.px(fx, fy, [C.flowerPink, C.flowerGold, C.flowerBlue][Math.floor(r() * 3)]);
    }
  }

  // Scattered details so open grass doesn't read as empty: rocks, flower clumps, tall grass.
  const onGrass = (x: number, y: number, w: number, h: number) =>
    y > BUILDING_H + 28 && x > 4 && x + w < MAP_W - 4 && y + h < MAP_H - 2 &&
    !isPath(x - 2, y - 2) && !isPath(x + w + 2, y - 2) && !isPath(x - 2, y + h + 2) && !isPath(x + w + 2, y + h + 2);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(r() * MAP_W);
    const y = Math.floor(r() * MAP_H);
    if (!onGrass(x, y, 5, 4)) continue;
    g.rect(x, y + 1, 5, 3, C.stone2);
    g.rect(x + 1, y, 3, 1, C.stone0);
    g.px(x + 1, y + 1, C.stone1);
    g.rect(x, y + 4, 5, 1, C.outline);
  }
  for (let i = 0; i < 110; i++) {
    const x = Math.floor(r() * MAP_W);
    const y = Math.floor(r() * MAP_H);
    if (!onGrass(x, y, 7, 6)) continue;
    const petal = [C.flowerPink, C.flowerGold, C.flowerBlue][Math.floor(r() * 3)];
    for (let k = 0; k < 4; k++) {
      const fx = x + Math.floor(r() * 7);
      const fy = y + Math.floor(r() * 4);
      g.px(fx, fy + 1, C.leaf2);
      g.px(fx, fy + 2, C.leaf1);
      g.px(fx, fy, petal);
    }
  }
  for (let i = 0; i < 160; i++) {
    const x = Math.floor(r() * MAP_W);
    const y = Math.floor(r() * MAP_H);
    if (!onGrass(x, y, 6, 6)) continue;
    for (let k = 0; k < 5; k++) {
      const bx = x + k + (k % 2);
      const tall = 3 + Math.floor(r() * 3);
      for (let j = 0; j < tall; j++) g.px(bx, y + 6 - j, j === tall - 1 ? C.tuft : C.grass3);
    }
    g.rect(x, y + 6, 6, 1, C.grassDark);
  }

  // Shade cast by the building onto the ground just below it.
  for (let y = BUILDING_H; y < BUILDING_H + 10; y++) {
    const t = 0.55 * (1 - (y - BUILDING_H) / 10);
    for (let x = 0; x < MAP_W; x++) {
      const c = g.get(x, y);
      if (c !== -1) g.px(x, y, mix(c, C.outline, t));
    }
  }
  return g;
}

function cobble(x: number, y: number): Rgb {
  const row = Math.floor(y / 6);
  const ox = (x + (row % 2) * 5) % 10;
  if (y % 6 === 0 || ox === 0) return C.mortar;
  const brick = hash(Math.floor((x + (row % 2) * 5) / 10), row);
  const base = [C.cobble0, C.cobble1, C.cobble2][brick % 3];
  if (y % 6 === 1 && ox === 1 && brick % 5 === 0) return C.pebble;
  return base;
}

function ringStone(x: number, y: number, d: number): Rgb {
  if (d < PLAZA.inner + 1 || d >= PLAZA.outer - 1) return C.ringSeam;
  const angle = (Math.atan2((y - PLAZA.y) / PLAZA.squash, x - PLAZA.x) + Math.PI) / (Math.PI * 2);
  const slab = Math.floor(angle * 32);
  if (angle * 32 - slab < 0.06) return C.ringSeam;
  const base = [C.ring0, C.ring1, C.ring2][hash(slab, 3) % 3];
  // Inner edge of each slab catches a little more light.
  return d < PLAZA.inner + 4 ? mix(base, 0xffffff, 0.12) : base;
}

// --- Faculty building ------------------------------------------------------

function building(): PixelCanvas {
  const b = new PixelCanvas(MAP_W, BUILDING_H);
  const r = rng(3);

  // Roof tiles.
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const row = Math.floor(y / 5);
      const seam = y % 5 === 4 || (x + (row % 2) * 6) % 12 === 0;
      b.px(x, y, seam ? C.roof0 : y % 5 === 0 ? C.roof2 : C.roof1);
    }
  }
  b.rect(0, 20, MAP_W, 2, C.roof0); // eave

  // Brick facade, darker just under the eave.
  for (let y = 22; y < 104; y++) {
    const row = Math.floor((y - 22) / 5);
    for (let x = 0; x < MAP_W; x++) {
      const ox = (x + (row % 2) * 6) % 12;
      let c: Rgb = (y - 22) % 5 === 4 || ox === 0 ? C.brickMortar : [C.brick0, C.brick1, C.brick2][hash(Math.floor((x + (row % 2) * 6) / 12), row) % 3];
      if (y < 30) c = mix(c, C.outline, 0.5 * (1 - (y - 22) / 8));
      b.px(x, y, c);
    }
  }

  // Pillars between window bays (none at the door).
  for (let px = 0; px <= MAP_W; px += 96) {
    if (px === DOOR_X) continue;
    b.rect(px - 4, 22, 8, 82, C.pillar0);
    b.rect(px - 4, 22, 2, 82, C.pillar1);
    b.rect(px + 3, 22, 1, 82, C.brick2);
    b.rect(px - 5, 22, 10, 3, C.pillar1);
  }

  // Windows: some lit (someone's still inside), most dark.
  for (let bay = 0; bay < 8; bay++) {
    const cx = WINDOW_BAY_X(bay);
    if (Math.abs(cx - DOOR_X) < 40) continue;
    const x0 = cx - 15;
    const y0 = 38;
    b.rect(x0 - 2, y0 - 2, 34, 38, C.windowFrame);
    const lit = LIT_WINDOWS.includes(bay);
    for (let y = 0; y < 34; y++) {
      for (let x = 0; x < 30; x++) {
        let c: Rgb;
        if (lit) c = mix(C.windowLit0, C.windowLit1, y / 34);
        else c = (x + y) % 23 < 2 ? C.windowSheen : C.windowDark;
        b.px(x0 + x, y0 + y, c);
      }
    }
    if (lit) b.rect(x0 + 22, y0, 8, 34, mix(C.windowLit1, C.door0, 0.55)); // half-drawn curtain
    b.rect(x0 + 14, y0, 2, 34, C.windowFrame); // mullion
    b.rect(x0, y0 + 15, 30, 2, C.windowFrame); // transom
    b.rect(x0 - 3, y0 + 35, 36, 3, C.stone1); // sill
    b.rect(x0 - 3, y0 + 37, 36, 1, C.stone2);
  }

  // Double door with a lit transom and a nameplate.
  const dx = DOOR_X - 18;
  b.rect(dx - 3, 44, 42, 60, C.stone1);
  b.rect(dx, 47, 36, 6, C.windowLit0);
  b.rect(dx, 53, 36, 1, C.windowFrame);
  b.rect(dx, 54, 36, 50, C.door1);
  b.rect(dx + 17, 54, 2, 50, C.door0);
  for (const px of [dx + 3, dx + 21]) {
    b.rect(px, 58, 12, 16, C.door2);
    b.rect(px, 78, 12, 20, C.door2);
    b.rect(px + 1, 59, 10, 14, C.door1);
    b.rect(px + 1, 79, 10, 18, C.door1);
  }
  b.px(dx + 15, 78, C.lampGlass);
  b.px(dx + 20, 78, C.lampGlass);
  b.rect(dx - 6, 30, 48, 10, C.wood1); // nameplate
  b.rect(dx - 6, 30, 48, 1, C.wood2);
  for (let i = 0; i < 18; i++) if (r() > 0.25) b.rect(dx - 2 + i * 2.2, 34, 1, 3, C.paper); // lettering, too small to read

  // Plinth and door step.
  b.rect(0, 104, MAP_W, 8, C.plinth);
  b.rect(0, 104, MAP_W, 1, C.stone0);
  b.rect(dx - 8, 104, 52, 8, C.stone1);
  b.rect(dx - 8, 104, 52, 1, mix(C.stone1, 0xffffff, 0.25));
  b.rect(0, 111, MAP_W, 1, C.outline);
  return b;
}

// --- Plants ----------------------------------------------------------------

function canopyShade(nx: number, ny: number, noise: number): Rgb {
  const s = -nx * 0.45 - ny * 0.8 + (noise - 0.5) * 0.55;
  if (s > 0.75) return C.leaf4;
  if (s > 0.3) return C.leaf3;
  if (s > -0.15) return C.leaf2;
  if (s > -0.65) return C.leaf1;
  return C.leaf0;
}

function tree(seed: number): PixelCanvas {
  const t = new PixelCanvas(72, 88);
  const r = rng(seed);

  // Trunk with root flare and a couple of branches.
  for (let y = 54; y < 86; y++) {
    for (let x = 31; x < 41; x++) {
      const c = x < 33 ? C.trunk2 : x > 37 ? C.trunk0 : C.trunk1;
      t.px(x, y, r() < 0.12 ? C.trunk0 : c);
    }
  }
  t.rect(28, 82, 3, 4, C.trunk1);
  t.rect(41, 82, 3, 4, C.trunk0);
  t.line(34, 56, 24, 42, C.trunk1);
  t.line(35, 56, 25, 42, C.trunk1);
  t.line(38, 56, 48, 40, C.trunk0);

  // Canopy built from overlapping leaf clumps, lit from the top-left.
  const j = () => (r() - 0.5) * 6;
  const clumps: Array<[number, number, number, number]> = [
    [36 + j(), 34 + j(), 30, 22],
    [18 + j(), 38 + j(), 15, 12],
    [54 + j(), 38 + j(), 15, 12],
    [26 + j(), 20 + j(), 16, 12],
    [46 + j(), 19 + j(), 17, 12],
    [36 + j(), 46 + j(), 20, 9],
  ];
  for (const [cx, cy, rx, ry] of clumps) {
    t.eachInEllipse(cx, cy, rx, ry, (x, y, nx, ny) => t.px(x, y, canopyShade(nx, ny, r())));
  }
  sparkleLeaves(t, r, 60);
  t.outline(C.outline);
  return t;
}

function bush(seed: number, flowers: boolean): PixelCanvas {
  const b = new PixelCanvas(32, 22);
  const r = rng(seed);
  for (const [cx, cy, rx, ry] of [
    [16, 13, 14, 8],
    [8, 13, 7, 6],
    [24, 13, 7, 6],
    [16, 8, 9, 6],
  ] as const) {
    b.eachInEllipse(cx, cy, rx, ry, (x, y, nx, ny) => b.px(x, y, canopyShade(nx, ny, r())));
  }
  sparkleLeaves(b, r, 10);
  if (flowers) {
    for (let i = 0; i < 9; i++) {
      const x = 4 + Math.floor(r() * 24);
      const y = 5 + Math.floor(r() * 12);
      if (b.filled(x, y)) b.px(x, y, i % 3 === 0 ? C.flowerGold : C.flowerPink);
    }
  }
  b.outline(C.outline);
  return b;
}

/** Small bright leaf glints and a dark underside, which make foliage read as clumps. */
function sparkleLeaves(c: PixelCanvas, r: () => number, count: number): void {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(r() * c.w);
    const y = Math.floor(r() * c.h * 0.7);
    if (c.get(x, y) === C.leaf3 || c.get(x, y) === C.leaf4) {
      c.px(x, y, C.leafGlint);
      if (c.filled(x + 1, y)) c.px(x + 1, y, C.leaf4);
    }
  }
  const under: number[] = [];
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      const v = c.get(x, y);
      if (v >= 0 && v !== C.trunk0 && v !== C.trunk1 && v !== C.trunk2 && !c.filled(x, y + 1)) under.push(x, y);
    }
  }
  for (let i = 0; i < under.length; i += 2) c.px(under[i], under[i + 1], C.leaf0);
}

// --- Props -----------------------------------------------------------------

function lamp(): PixelCanvas {
  const l = new PixelCanvas(12, 50);
  l.rect(2, 46, 8, 3, C.metal0);
  l.rect(3, 42, 6, 4, C.metal1);
  l.rect(3, 42, 6, 1, C.metal2);
  l.rect(5, 13, 2, 29, C.metal1);
  l.rect(5, 13, 1, 29, C.metal2);
  l.rect(4, 12, 4, 1, C.metal0);
  l.rect(3, 6, 6, 6, C.lampGlass);
  l.rect(5, 7, 2, 4, C.lampCore);
  l.rect(2, 4, 8, 2, C.metal0);
  l.rect(3, 2, 6, 2, C.metal1);
  l.rect(5, 1, 2, 1, C.metal2);
  l.outline(C.outline);
  return l;
}

function bench(): PixelCanvas {
  const b = new PixelCanvas(36, 20);
  b.rect(5, 2, 2, 13, C.metal0);
  b.rect(29, 2, 2, 13, C.metal0);
  b.rect(2, 2, 32, 2, C.wood2);
  b.rect(2, 5, 32, 2, C.wood1);
  b.rect(1, 9, 34, 2, C.wood2);
  b.rect(1, 11, 34, 2, C.wood1);
  b.rect(1, 13, 34, 1, C.wood0);
  b.rect(4, 14, 2, 4, C.metal0);
  b.rect(30, 14, 2, 4, C.metal0);
  b.outline(C.outline);
  return b;
}

function fountain(): PixelCanvas {
  const f = new PixelCanvas(116, 78);
  const cx = 58;
  const cy = 34;
  const rx = 55;
  const ry = 26;

  // Front wall of the basin, seen below the rim.
  for (let x = cx - rx; x <= cx + rx; x++) {
    const nx = (x + 0.5 - cx) / rx;
    if (Math.abs(nx) > 1) continue;
    const bottom = Math.floor(cy + ry * Math.sqrt(1 - nx * nx));
    for (let y = bottom - 2; y < bottom + 11; y++) {
      const seam = (x - cx + 200) % 11 === 0;
      f.px(x, y, seam ? C.stoneDark : y > bottom + 7 ? C.stoneDark : C.stone2);
    }
  }
  // Rim and dark water.
  f.eachInEllipse(cx, cy, rx, ry, (x, y, _nx, ny) => f.px(x, y, ny < 0 ? C.stone1 : C.stone0));
  const r = rng(4);
  f.eachInEllipse(cx, cy + 1, rx - 8, ry - 6, (x, y) => f.px(x, y, r() < 0.15 ? C.water0 : C.water1));
  for (const [ax, ay, len] of [
    [30, 30, 10],
    [70, 40, 12],
    [44, 46, 8],
    [80, 28, 7],
  ]) {
    f.rect(ax, ay, len, 1, C.water2);
  }
  // Centre pedestal and bowl.
  f.rect(53, 14, 10, 24, C.stone0);
  f.rect(53, 14, 3, 24, C.stone1);
  f.rect(61, 14, 2, 24, C.stone2);
  f.ellipse(cx, 14, 14, 5, C.stone1);
  f.ellipse(cx, 14, 10, 3, C.water2);
  f.outline(C.outline);
  return f;
}

function tape(): PixelCanvas {
  const t = new PixelCanvas(104, 62);
  const posts: Array<[number, number]> = [
    [4, 12],
    [98, 12],
    [4, 44],
    [98, 44],
  ];
  for (const [x, y] of posts) {
    t.rect(x, y, 3, 16, C.metal1);
    t.rect(x, y, 3, 3, C.tapeYellow);
  }
  const band = (x0: number, y0: number, x1: number, y1: number) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= steps; i++) {
      const s = i / steps;
      const sag = Math.sin(s * Math.PI) * (y0 === y1 ? 2 : 0);
      const x = Math.round(x0 + (x1 - x0) * s);
      const y = Math.round(y0 + (y1 - y0) * s + sag);
      const c = Math.floor(i / 4) % 2 === 0 ? C.tapeYellow : C.tapeBlack;
      t.px(x, y, c);
      t.px(x, y + 1, c);
    }
  };
  band(6, 17, 99, 17);
  band(6, 49, 99, 49);
  band(5, 18, 5, 48);
  band(99, 18, 99, 48);
  t.outline(C.outline);
  return t;
}

function briefcase(): PixelCanvas {
  const b = new PixelCanvas(16, 12);
  b.rect(1, 3, 14, 8, C.leather1);
  b.rect(1, 3, 14, 2, mix(C.leather1, 0xffffff, 0.15));
  b.rect(1, 10, 14, 1, C.leather0);
  b.rect(5, 1, 6, 2, C.metal1);
  b.px(8, 6, C.lampGlass);
  b.outline(C.outline);
  return b;
}

function paper(): PixelCanvas {
  const p = new PixelCanvas(11, 9);
  p.rect(1, 1, 9, 7, C.paper);
  p.rect(1, 7, 9, 1, C.paperShade);
  p.rect(2, 2, 6, 1, C.ink);
  p.rect(2, 4, 5, 1, C.ink);
  p.rect(7, 1, 3, 2, C.paperShade); // torn corner
  p.outline(C.outline);
  return p;
}

function marker(n: number): PixelCanvas {
  const m = new PixelCanvas(9, 9);
  for (let y = 0; y < 6; y++) m.rect(4 - Math.floor(y / 2), 1 + y, 1 + Math.floor(y / 2) * 2, 1, C.tapeYellow);
  m.rect(1, 7, 7, 1, mix(C.tapeYellow, C.outline, 0.4));
  m.rect(4, 3, 1, n + 1, C.tapeBlack);
  m.outline(C.outline);
  return m;
}

function accessCard(): PixelCanvas {
  const c = new PixelCanvas(11, 8);
  c.rect(1, 1, 9, 6, 0xe6e8ee);
  c.rect(1, 1, 9, 2, 0x3c6fb0);
  c.rect(2, 4, 2, 2, C.skin1); // tiny photo
  c.rect(5, 4, 4, 1, C.ink);
  c.rect(1, 6, 9, 1, C.paperShade);
  c.outline(C.outline);
  return c;
}

/** Dr. Rosli's tumbler lying on its side in a small pool of spilled coffee. */
function tumbler(): PixelCanvas {
  const t = new PixelCanvas(18, 10);
  t.rect(3, 2, 9, 4, C.metal2);
  t.rect(3, 2, 9, 1, mix(C.metal2, 0xffffff, 0.35));
  t.rect(3, 5, 9, 1, C.metal1);
  t.rect(12, 2, 2, 4, C.metal0);
  t.outline(C.outline);
  t.eachInEllipse(10, 6.5, 7, 3, (x, y) => {
    if (!t.filled(x, y)) t.px(x, y, 0x3b2618, 200);
  });
  return t;
}

function shadow(w: number, h: number): PixelCanvas {
  const s = new PixelCanvas(w, h);
  s.ellipse(w / 2, h / 2, w / 2, h / 2, C.outline, 90);
  s.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 1, C.outline, 130);
  return s;
}

function firefly(): PixelCanvas {
  const f = new PixelCanvas(5, 5);
  f.ellipse(2.5, 2.5, 2.5, 2.5, C.lampGlass, 70);
  f.px(2, 2, C.lampCore);
  f.px(1, 2, C.lampGlass, 180);
  f.px(3, 2, C.lampGlass, 180);
  f.px(2, 1, C.lampGlass, 180);
  f.px(2, 3, C.lampGlass, 180);
  return f;
}

// --- Characters ------------------------------------------------------------

/** A 16×26 chibi character. pose 0 = standing, 1 and 2 = the two walking steps. */
function character(look: Look, facing: 'down' | 'up' | 'right', pose: 0 | 1 | 2): PixelCanvas {
  const c = new PixelCanvas(16, 26);
  const dark = (col: Rgb) => mix(col, C.outline, 0.35);
  const light = (col: Rgb) => mix(col, 0xffffff, 0.18);
  const armSwing = pose === 0 ? 0 : pose === 1 ? -1 : 1;
  const body = look.coat ?? look.top;

  // Legs and shoes.
  if (facing === 'right') {
    const legs: Array<[number, number]> = pose === 1 ? [[5, 3], [9, 3]] : pose === 2 ? [[6, 3], [8, 2]] : [[6, 3], [8, 3]];
    for (const [x, len] of legs) {
      c.rect(x, 21, 2, len, look.bottom);
      c.rect(x, 21 + len, 3, 1, look.shoes);
    }
  } else {
    const leftLen = pose === 1 ? 2 : 3;
    const rightLen = pose === 2 ? 2 : 3;
    c.rect(5, 21, 3, leftLen, look.bottom);
    c.rect(8, 21, 3, rightLen, dark(look.bottom));
    c.rect(5, 21 + leftLen, 3, 1, look.shoes);
    c.rect(8, 21 + rightLen, 3, 1, look.shoes);
  }

  // Torso and arms. A coat hangs lower, over the top of the legs.
  const torsoH = look.coat ? 9 : 7;
  if (facing === 'right') {
    if (look.bag) c.rect(3, 14, 3, 6, look.bag);
    c.rect(5, 14, 6, torsoH, body);
    c.rect(5, 14, 6, 1, light(body));
    if (look.coat) c.rect(10, 14, 1, 4, look.top);
    c.rect(7, 15 + armSwing, 2, 5, dark(body));
    c.rect(7, 20 + armSwing, 2, 1, C.skin0);
  } else {
    c.rect(4, 14, 8, torsoH, body);
    c.rect(4, 14, 1, torsoH, light(body));
    c.rect(11, 14, 1, torsoH, dark(body));
    if (look.coat && facing === 'down') {
      c.rect(7, 14, 2, 5, look.top); // shirt showing between the lapels
      c.px(6, 14, dark(body));
      c.px(9, 14, dark(body));
    }
    c.rect(2, 15 + armSwing, 2, 5, body);
    c.rect(12, 15 - armSwing, 2, 5, dark(body));
    c.rect(2, 20 + armSwing, 2, 1, C.skin0);
    c.rect(12, 20 - armSwing, 2, 1, C.skin1);
    if (look.bag && facing === 'up') {
      c.rect(5, 14, 6, 6, look.bag);
      c.rect(5, 14, 6, 1, light(look.bag));
    }
    if (look.bag && facing === 'down') {
      c.rect(5, 14, 1, 5, dark(look.bag));
      c.rect(10, 14, 1, 5, dark(look.bag));
    }
  }

  // Long hair falls over the shoulders (or down the back).
  if (look.longHair && look.tudung === undefined) {
    if (facing === 'up') c.rect(4, 12, 8, 7, look.hair);
    else if (facing === 'right') c.rect(4, 11, 3, 8, look.hair);
    else {
      c.rect(3, 12, 2, 6, look.hair);
      c.rect(11, 12, 2, 6, look.hair);
    }
  }

  // Head, then hair or a tudung over it.
  const cover = look.tudung ?? look.hair;
  c.ellipse(8, 8, 6.5, 6.5, C.skin0);
  c.eachInEllipse(8, 8, 6.5, 6.5, (x, y, nx, ny) => {
    let covered: boolean;
    if (look.tudung !== undefined) {
      if (facing === 'up') covered = true;
      else if (facing === 'down') covered = ny < -0.3 || Math.abs(nx) > 0.55;
      else covered = nx < 0.3 || ny < -0.35;
    } else if (facing === 'up') covered = ny < 0.75;
    else if (facing === 'down') covered = ny < -0.15 || (Math.abs(nx) > 0.75 && ny < 0.45);
    else covered = ny < -0.2 || (nx < 0.1 && ny < 0.55);
    if (covered) c.px(x, y, ny < -0.6 && nx < 0 ? light(cover) : cover);
    else if (nx > 0.55 || ny > 0.6) c.px(x, y, C.skin1);
  });
  if (look.tudung !== undefined) {
    // The scarf drapes over the shoulders.
    if (facing === 'up') c.rect(3, 12, 10, 5, look.tudung);
    else if (facing === 'right') c.rect(4, 13, 7, 3, look.tudung);
    else {
      c.rect(3, 13, 10, 3, look.tudung);
      c.rect(3, 13, 10, 1, light(look.tudung));
    }
  }
  if (facing === 'down') {
    c.rect(5, 9, 1, 2, C.outline);
    c.rect(10, 9, 1, 2, C.outline);
    if (look.glasses) {
      c.rect(4, 9, 3, 1, C.metal2);
      c.rect(9, 9, 3, 1, C.metal2);
      c.rect(7, 9, 2, 1, C.metal0);
    }
  } else if (facing === 'right') {
    c.rect(11, 9, 1, 2, C.outline);
    if (look.glasses) c.rect(10, 9, 3, 1, C.metal2);
    c.px(14, 10, C.skin1);
  }

  c.outline(C.outline);
  return c;
}

// --- Helpers ---------------------------------------------------------------

function hash(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Smooth random values over a grid of `cell`-sized squares, for gentle colour patches. */
function valueNoise(r: () => number, cell: number): (x: number, y: number) => number {
  const cols = Math.ceil(MAP_W / cell) + 2;
  const rows = Math.ceil(MAP_H / cell) + 2;
  const grid = Array.from({ length: cols * rows }, () => r());
  const at = (i: number, j: number) => grid[j * cols + i];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const gx = x / cell;
    const gy = y / cell;
    const i = Math.floor(gx);
    const j = Math.floor(gy);
    const tx = smooth(gx - i);
    const ty = smooth(gy - j);
    const top = at(i, j) * (1 - tx) + at(i + 1, j) * tx;
    const bottom = at(i, j + 1) * (1 - tx) + at(i + 1, j + 1) * tx;
    return top * (1 - ty) + bottom * ty;
  };
}
