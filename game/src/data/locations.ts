import type { FurnitureKind } from '../art/interiors';
import type { Facing } from '../logic/movement';
import type { Spawn } from './days';

// Every place the player can be, at UPM Serdang, and who or what is there on which day.
// `days` lists the days something is around; leave it out for "every day".

export interface NpcPlacement {
  id: string;
  /** Short name for the prompt, e.g. "Farah", "Puan Lim". */
  label: string;
  x: number;
  y: number;
  facing: Facing;
  startNode: string;
  days?: number[];
  /** Where the player talks to them from, if not right in front (e.g. across a counter). */
  talkFrom?: { x: number; y: number };
}

export interface FloorClue {
  clueId: string;
  x: number;
  y: number;
  sprite: 'paper' | 'card';
  days?: number[];
}

export interface ExamineSpot {
  id: string;
  label: string;
  x: number;
  y: number;
  startNode: string;
  days?: number[];
}

export interface ExitSpec {
  label: string;
  x: number;
  y: number;
  /** Where it leads. Leave out for the courtyard's "go home" exit, which ends the day. */
  to?: Spawn;
  days?: number[];
  /** Shown when the exit is closed today. Without it, a closed exit isn't shown at all. */
  closedText?: string;
}

export interface SignSpec {
  text: string;
  x: number;
  /** Top edge for a wall plaque; ground line for a signpost. */
  y: number;
  /** A freestanding signpost on the ground instead of a plaque on the wall. */
  post?: boolean;
}

export interface Furniture {
  kind: FurnitureKind;
  x: number;
  /** Ground line (bottom) of the piece. */
  y: number;
}

export interface LightSpec {
  x: number;
  y: number;
  radius: number;
  color: number;
  intensity: number;
}

export interface RoomSpec {
  w: number;
  h: number;
  floor: 'wood' | 'carpet' | 'tile';
  wall: number;
  /** x of the doorway in the bottom wall. */
  doorX: number;
  ambient: number;
  furniture: Furniture[];
  lights: LightSpec[];
}

export interface LocationSpec {
  id: string;
  /** Shown in the HUD. */
  name: string;
  scene: 'courtyard' | 'room';
  room?: RoomSpec;
  npcs: NpcPlacement[];
  floorClues: FloorClue[];
  examine: ExamineSpot[];
  exits: ExitSpec[];
  signs: SignSpec[];
}

const toCourtyard = (x: number, y: number, facing: Facing): Spawn => ({ location: 'courtyard', x, y, facing });

export const LOCATIONS: Readonly<Record<string, LocationSpec>> = {
  courtyard: {
    id: 'courtyard',
    name: 'Laman Fakulti Sains',
    scene: 'courtyard',
    npcs: [
      { id: 'farah', label: 'Farah', x: 250, y: 302, facing: 'down', startNode: 'farah_intro', days: [1] },
      { id: 'daniel', label: 'Daniel', x: 500, y: 172, facing: 'down', startNode: 'daniel_intro', days: [1] },
      { id: 'priya', label: 'Dr. Priya', x: 598, y: 458, facing: 'left', startNode: 'priya_intro', days: [1] },
      { id: 'priya', label: 'Dr. Priya', x: 598, y: 458, facing: 'left', startNode: 'priya2_intro', days: [2] },
    ],
    floorClues: [
      { clueId: 'torn_note', x: 466, y: 372, sprite: 'paper', days: [1, 2] },
      { clueId: 'lab_access_card', x: 300, y: 154, sprite: 'card', days: [1, 2] },
    ],
    examine: [{ id: 'crime_scene', label: 'Examine the scene', x: 512, y: 358, startNode: 'scene_look', days: [1] }],
    exits: [
      {
        label: 'Enter Fakulti Sains',
        x: 384,
        y: 116,
        to: { location: 'faculty', x: 288, y: 242, facing: 'up' },
        days: [2],
        closedText: 'Locked. Security sealed the building for the night.',
      },
      {
        label: 'Go to PSAS (library)',
        x: 14,
        y: 300,
        to: { location: 'library', x: 288, y: 274, facing: 'up' },
        days: [2],
        closedText: "PSAS closed at eleven. It's too late tonight.",
      },
      {
        label: 'Go to the security office',
        x: 754,
        y: 300,
        to: { location: 'security', x: 240, y: 226, facing: 'up' },
        days: [2],
        closedText: 'Security is busy with the police tonight. Try tomorrow.',
      },
      { label: 'Head back to KTDI', x: 384, y: 538 },
    ],
    // "FAKULTI SAINS" is painted on the building itself.
    signs: [
      { text: '← PSAS', x: 44, y: 280, post: true },
      { text: 'KESELAMATAN →', x: 718, y: 280, post: true },
      { text: 'KTDI ↓', x: 340, y: 540, post: true },
    ],
  },

  library: {
    id: 'library',
    name: 'PSAS · Ruang Bacaan',
    scene: 'room',
    room: {
      w: 576,
      h: 320,
      floor: 'carpet',
      wall: 0x4a3f63,
      doorX: 288,
      ambient: 0x8a83b4,
      furniture: [
        ...[56, 104, 152, 200, 376, 424, 472, 520].map((x) => ({ kind: 'shelf' as const, x, y: 96 })),
        ...[56, 104, 152].map((x) => ({ kind: 'shelf' as const, x, y: 172 })),
        ...[56, 104, 152].map((x) => ({ kind: 'shelf' as const, x, y: 236 })),
        { kind: 'table', x: 392, y: 176 },
        { kind: 'table', x: 492, y: 176 },
        { kind: 'table', x: 392, y: 246 },
        { kind: 'table', x: 492, y: 246 },
        { kind: 'desk', x: 232, y: 282 },
        { kind: 'plant', x: 24, y: 306 },
        { kind: 'plant', x: 552, y: 306 },
        { kind: 'window', x: 288, y: 50 },
      ],
      lights: [
        { x: 392, y: 160, radius: 70, color: 0xffc27a, intensity: 2.2 },
        { x: 492, y: 160, radius: 70, color: 0xffc27a, intensity: 2.2 },
        { x: 392, y: 230, radius: 70, color: 0xffc27a, intensity: 2.2 },
        { x: 492, y: 230, radius: 70, color: 0xffc27a, intensity: 2.2 },
        { x: 140, y: 150, radius: 160, color: 0xb8c6ff, intensity: 1.0 },
        { x: 232, y: 262, radius: 80, color: 0xffd9a0, intensity: 1.6 },
      ],
    },
    npcs: [
      { id: 'lim', label: 'Puan Lim', x: 232, y: 258, facing: 'down', startNode: 'lim_intro', talkFrom: { x: 232, y: 292 } },
      { id: 'farah', label: 'Farah', x: 442, y: 212, facing: 'down', startNode: 'farah2_intro', days: [2] },
    ],
    floorClues: [],
    examine: [],
    exits: [{ label: 'Back to the courtyard', x: 288, y: 306, to: toCourtyard(46, 300, 'right') }],
    signs: [
      { text: 'PERPUSTAKAAN SULTAN ABDUL SAMAD', x: 288, y: 16 },
      { text: 'ZON SENYAP', x: 442, y: 146, post: true },
    ],
  },

  security: {
    id: 'security',
    name: 'Pejabat Keselamatan',
    scene: 'room',
    room: {
      w: 480,
      h: 272,
      floor: 'tile',
      wall: 0x3e4a63,
      doorX: 240,
      ambient: 0x8a90b8,
      furniture: [
        { kind: 'monitors', x: 240, y: 112 },
        { kind: 'cabinet', x: 40, y: 98 },
        { kind: 'cabinet', x: 62, y: 98 },
        { kind: 'cabinet', x: 84, y: 98 },
        { kind: 'dispenser', x: 444, y: 100 },
        { kind: 'sofa', x: 380, y: 222 },
        { kind: 'plant', x: 24, y: 258 },
        { kind: 'plant', x: 456, y: 258 },
        { kind: 'board', x: 140, y: 46 },
        { kind: 'board', x: 340, y: 46 },
      ],
      lights: [
        { x: 240, y: 92, radius: 100, color: 0x7fe0ff, intensity: 2.0 },
        { x: 240, y: 170, radius: 200, color: 0xdfe8ff, intensity: 1.0 },
      ],
    },
    npcs: [{ id: 'rahman', label: 'Encik Rahman', x: 298, y: 126, facing: 'left', startNode: 'rahman_intro' }],
    floorClues: [],
    examine: [],
    exits: [{ label: 'Back to the courtyard', x: 240, y: 258, to: toCourtyard(722, 300, 'left') }],
    signs: [{ text: 'PEJABAT KESELAMATAN', x: 240, y: 16 }],
  },

  faculty: {
    id: 'faculty',
    name: 'Fakulti Sains · Aras Bawah',
    scene: 'room',
    room: {
      w: 576,
      h: 288,
      floor: 'tile',
      wall: 0x51476a,
      doorX: 288,
      ambient: 0x8c86b6,
      furniture: [
        { kind: 'counter', x: 92, y: 104 },
        { kind: 'fridge', x: 160, y: 104 },
        { kind: 'table', x: 104, y: 196 },
        { kind: 'cart', x: 232, y: 184 },
        { kind: 'board', x: 300, y: 46 },
        { kind: 'labdoor', x: 480, y: 50 },
        { kind: 'sofa', x: 372, y: 246 },
        { kind: 'plant', x: 24, y: 274 },
        { kind: 'plant', x: 552, y: 274 },
      ],
      lights: [
        { x: 104, y: 120, radius: 110, color: 0xffd8a0, intensity: 1.8 },
        { x: 300, y: 140, radius: 170, color: 0xe6eeff, intensity: 1.0 },
        { x: 480, y: 110, radius: 110, color: 0xe6eeff, intensity: 0.9 },
      ],
    },
    npcs: [
      { id: 'ani', label: 'Kak Ani', x: 206, y: 178, facing: 'right', startNode: 'ani_intro' },
      { id: 'daniel', label: 'Daniel', x: 438, y: 124, facing: 'down', startNode: 'daniel2_intro', days: [2] },
    ],
    floorClues: [],
    examine: [{ id: 'lab_door', label: 'Look at Makmal 2', x: 480, y: 64, startNode: 'lab_door' }],
    exits: [{ label: 'Back to the courtyard', x: 288, y: 274, to: toCourtyard(384, 148, 'down') }],
    signs: [
      { text: 'FAKULTI SAINS · ARAS BAWAH', x: 288, y: 16 },
      { text: 'PANTRI', x: 104, y: 32 },
      { text: 'MAKMAL 2', x: 480, y: 6 },
      { text: 'SURAU →', x: 196, y: 32 },
    ],
  },
};
