import type { Look } from '../art/look';
import type { Clue } from '../logic/clues';
import type { DeductionLink } from '../logic/deduction';
import type { DialogueChoice, DialogueNode } from '../logic/dialogue';
import type { Facing } from '../logic/movement';

// Day 1 of the case: the night Dr. Rosli is found. The full story is in
// docs/superpowers/specs/2026-11-13-campus-mystery-case-design.md.
// Everything here is data: change names, lines or clues without touching game code.

// --- Clues -------------------------------------------------------------------

export const CLUES: Readonly<Record<string, Clue>> = {
  coffee_tumbler: {
    id: 'coffee_tumbler',
    name: 'Coffee Tumbler',
    description: "Dr. Rosli's steel tumbler, lying by the fountain. The spilled coffee smells faintly bitter.",
  },
  torn_note: {
    id: 'torn_note',
    name: 'Torn Note',
    description: '"Farah — meet me by the fountain at ten. It\'s about your results. — R." Half of it is torn away.',
  },
  lab_access_card: {
    id: 'lab_access_card',
    name: 'Lab Access Card',
    description: 'A faculty access card in the grass by the hedge. The name on it: D. WONG, Lab Manager.',
  },
  farah_alibi: {
    id: 'farah_alibi',
    name: "Farah's Alibi",
    description: 'Farah says she was on level 3 of the library all evening and borrowed two books just before closing.',
  },
  daniel_alibi: {
    id: 'daniel_alibi',
    name: "Daniel's Alibi",
    description: 'Daniel says he was in Lab 2 all night with an overnight experiment, signing the logbook every half hour.',
  },
  priya_argument: {
    id: 'priya_argument',
    name: 'The Argument',
    description: 'Priya argued loudly with Dr. Rosli in the courtyard at about 9:30, then says she went up to a video call.',
  },
};

// --- People on the board -------------------------------------------------------

export interface Person {
  id: string;
  name: string;
  role: string;
  kind: 'Suspect' | 'Victim';
}

export const PEOPLE: readonly Person[] = [
  { id: 'rosli', name: 'Dr. Rosli Kamarudin', role: 'Senior lecturer, Chemistry. The victim.', kind: 'Victim' },
  { id: 'farah', name: 'Farah Idris', role: 'PhD student. Dr. Rosli supervised her.', kind: 'Suspect' },
  { id: 'daniel', name: 'Daniel Wong', role: 'Chemistry lab manager.', kind: 'Suspect' },
  { id: 'priya', name: 'Dr. Priya Nair', role: "Senior lecturer. Dr. Rosli's colleague of fifteen years.", kind: 'Suspect' },
];

// --- Who stands where in the courtyard ------------------------------------------

export interface NpcSpec {
  id: string;
  x: number;
  y: number;
  facing: Facing;
  startNode: string;
  look: Look;
}

export const NPCS: readonly NpcSpec[] = [
  {
    id: 'farah',
    x: 250,
    y: 302,
    facing: 'down',
    startNode: 'farah_intro',
    look: { hair: 0x1d1727, tudung: 0xc9708a, top: 0xd9cdb4, bottom: 0x2b3352, shoes: 0x3a2a2a },
  },
  {
    id: 'daniel',
    x: 500,
    y: 172,
    facing: 'down',
    startNode: 'daniel_intro',
    look: { hair: 0x15121c, top: 0x34405a, coat: 0xdfe2ea, bottom: 0x3c3f4f, shoes: 0x23202a },
  },
  {
    id: 'priya',
    x: 598,
    y: 458,
    facing: 'left',
    startNode: 'priya_intro',
    look: { hair: 0x120f17, longHair: true, glasses: true, top: 0x8a2f45, bottom: 0x2a2638, shoes: 0x2b2224 },
  },
];

export const PLAYER_LOOK: Look = { hair: 0x1d1727, top: 0x2f7f86, bottom: 0x2f3a5e, shoes: 0xd9d4c8, bag: 0x8b3a3a };

// --- Things to pick up or examine -----------------------------------------------

export interface FloorClue {
  clueId: string;
  x: number;
  y: number;
  sprite: 'paper' | 'card';
}

export const FLOOR_CLUES: readonly FloorClue[] = [
  { clueId: 'torn_note', x: 466, y: 372, sprite: 'paper' },
  { clueId: 'lab_access_card', x: 300, y: 154, sprite: 'card' },
];

export interface ExamineSpot {
  id: string;
  label: string;
  x: number;
  y: number;
  startNode: string;
}

export const EXAMINE_SPOTS: readonly ExamineSpot[] = [
  { id: 'crime_scene', label: 'Examine the scene', x: 512, y: 358, startNode: 'scene_look' },
];

// --- Dialogue ---------------------------------------------------------------------

const leave: DialogueChoice = { text: 'Leave', next: null };

const farahTopics: DialogueChoice[] = [
  { text: 'What was he like as a supervisor?', next: 'farah_supervisor' },
  { text: 'Where were you this evening?', next: 'farah_alibi' },
  { text: 'Ask about the torn note', next: 'farah_note', requiresClue: 'torn_note' },
  leave,
];

const danielTopics: DialogueChoice[] = [
  { text: 'Did you see Dr. Rosli tonight?', next: 'daniel_saw' },
  { text: 'Where were you this evening?', next: 'daniel_alibi' },
  { text: 'Ask about the access card', next: 'daniel_card', requiresClue: 'lab_access_card' },
  leave,
];

const priyaTopics: DialogueChoice[] = [
  { text: "Why didn't you get along?", next: 'priya_feud' },
  { text: 'When did you last see him?', next: 'priya_argument' },
  leave,
];

const node = (n: DialogueNode): [string, DialogueNode] => [n.id, n];

export const DIALOGUE: Readonly<Record<string, DialogueNode>> = Object.fromEntries([
  // The crime scene.
  node({
    id: 'scene_look',
    speaker: 'You',
    text: 'Behind the tape, a steel coffee tumbler lies on its side by the fountain. The spilled coffee smells faintly bitter. Everyone in the faculty knew that tumbler: Dr. Rosli never went anywhere without it.',
    setsFlag: 'examined_scene',
    givesClue: 'coffee_tumbler',
    choices: [{ text: 'Step back', next: null }],
  }),

  // Farah Idris.
  node({
    id: 'farah_intro',
    speaker: 'Farah Idris',
    text: "I— sorry. I'm Farah. Dr. Rosli was my supervisor. I only came out when I heard the sirens. I can't believe he's… ",
    setsFlag: 'met_farah',
    choices: farahTopics,
  }),
  node({ id: 'farah_more', speaker: 'Farah Idris', text: 'Is there something else?', choices: farahTopics }),
  node({
    id: 'farah_supervisor',
    speaker: 'Farah Idris',
    text: 'Demanding. Last week he called my results "impossible" and said he\'d go through every one of my samples himself. I thought he was going to end my PhD.',
    choices: [{ text: 'Ask something else', next: 'farah_more' }, leave],
  }),
  node({
    id: 'farah_alibi',
    speaker: 'Farah Idris',
    text: 'The library. Level 3, the quiet zone, all evening. The librarian saw me — I borrowed two books right before closing.',
    givesClue: 'farah_alibi',
    choices: [{ text: 'Ask something else', next: 'farah_more' }, leave],
  }),
  node({
    id: 'farah_note',
    speaker: 'Farah Idris',
    text: "...Okay. Fine. That note isn't what you think it is. He wanted to meet me at ten about my results. I never went. I was too scared of what he'd say.",
    setsFlag: 'farah_admits_note',
    choices: [{ text: 'Ask something else', next: 'farah_more' }, leave],
  }),

  // Daniel Wong.
  node({
    id: 'daniel_intro',
    speaker: 'Daniel Wong',
    text: "Daniel Wong, I manage the chemistry labs. Terrible business. I've been in Lab 2 since eight — I can't leave my run for long, so make it quick.",
    setsFlag: 'met_daniel',
    choices: danielTopics,
  }),
  node({ id: 'daniel_more', speaker: 'Daniel Wong', text: 'Anything else?', choices: danielTopics }),
  node({
    id: 'daniel_saw',
    speaker: 'Daniel Wong',
    text: 'Around seven. He came by the stores asking about the inventory again. He was always auditing something.',
    choices: [{ text: 'Ask something else', next: 'daniel_more' }, leave],
  }),
  node({
    id: 'daniel_alibi',
    speaker: 'Daniel Wong',
    text: "Lab 2, all night. It's an overnight run — I sign the logbook every half hour. Ten, ten-thirty, eleven. Check it if you like.",
    givesClue: 'daniel_alibi',
    choices: [{ text: 'Ask something else', next: 'daniel_more' }, leave],
  }),
  node({
    id: 'daniel_card',
    speaker: 'Daniel Wong',
    text: "That's mine? Huh. I lost it days ago — I've been using the spare. Must have dropped it out here some time. Thanks.",
    setsFlag: 'daniel_claims_card_lost',
    choices: [{ text: 'Ask something else', next: 'daniel_more' }, leave],
  }),

  // Dr. Priya Nair.
  node({
    id: 'priya_intro',
    speaker: 'Dr. Priya Nair',
    text: "Dr. Priya Nair. Yes, I knew him — fifteen years in the same department. You'll hear soon enough that we didn't get along, so you may as well hear it from me.",
    setsFlag: 'met_priya',
    choices: priyaTopics,
  }),
  node({ id: 'priya_more', speaker: 'Dr. Priya Nair', text: 'Go on.', choices: priyaTopics }),
  node({
    id: 'priya_feud',
    speaker: 'Dr. Priya Nair',
    text: 'He told the Dean I copied his grant proposal. It was the other way round. He was simply louder.',
    choices: [{ text: 'Ask something else', next: 'priya_more' }, leave],
  }),
  node({
    id: 'priya_argument',
    speaker: 'Dr. Priya Nair',
    text: 'Here, about half past nine. We argued — loudly, I\'m afraid. Then I went up to my office for a video call with Melbourne. Ten until eleven.',
    givesClue: 'priya_argument',
    choices: [{ text: 'Ask something else', next: 'priya_more' }, leave],
  }),
]);

// --- The deduction board -----------------------------------------------------------

export const LINKS: readonly DeductionLink[] = [
  {
    clueId: 'coffee_tumbler',
    targetId: 'rosli',
    unlockFlags: ['linked_tumbler_to_victim'],
    insight: 'Dr. Rosli was poisoned through his coffee.',
  },
  {
    clueId: 'torn_note',
    targetId: 'farah',
    unlockFlags: ['linked_note_to_farah'],
    insight: 'Farah was supposed to meet Dr. Rosli at ten.',
  },
  {
    clueId: 'lab_access_card',
    targetId: 'daniel',
    unlockFlags: ['linked_card_to_daniel'],
    insight: "Daniel's lab card was out here in the courtyard.",
  },
  {
    clueId: 'priya_argument',
    targetId: 'priya',
    unlockFlags: ['linked_argument_to_priya'],
    insight: 'Priya was the last person seen arguing with Dr. Rosli.',
  },
];

/** Day 1 is done once the player has met everyone, examined the scene and worked out how he died. */
export const DAY1_REQUIRED: readonly string[] = [
  'met_farah',
  'met_daniel',
  'met_priya',
  'examined_scene',
  'linked_tumbler_to_victim',
];
