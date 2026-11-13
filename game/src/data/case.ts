import type { Look } from '../art/look';
import type { Clue } from '../logic/clues';
import type { DeductionLink } from '../logic/deduction';

// The case: every clue, the people on the board, how everyone looks, and the board's links.
// The story behind it is in docs/superpowers/specs/2026-11-13-campus-mystery-case-design.md.

export const CLUES: Readonly<Record<string, Clue>> = {
  // Day 1
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
  // Day 2
  library_gate_log: {
    id: 'library_gate_log',
    name: 'Library Gate Log',
    description: "Farah's student card went out through the library gate at 10:55 pm. She was inside until closing.",
  },
  door_access_log: {
    id: 'door_access_log',
    name: 'Door Access Log',
    description:
      "Faculty side door: Daniel's spare card out at 9:41 pm, back in at 10:24 pm. His \"lost\" main card opened the same door at 6:15 pm that evening.",
  },
  cleaner_statement: {
    id: 'cleaner_statement',
    name: "Cleaner's Statement",
    description: 'Kak Ani saw Daniel at the pantry counter around 9:45 pm, standing next to a steel tumbler.',
  },
  // Day 3
  presigned_logbook: {
    id: 'presigned_logbook',
    name: 'Pre-signed Logbook',
    description:
      "Makmal 2's logbook: the 10:00 and 10:30 entries are signed identically, in one stroke, with the same smudge. They were written in advance.",
  },
  audit_notes: {
    id: 'audit_notes',
    name: "Rosli's Audit Notes",
    description:
      'A reagent is missing from the Makmal 2 stores and the stock bottles were topped up to hide it. A sticky note: "Report D.W. to the Dean — Thurs 9am."',
  },
  video_call_record: {
    id: 'video_call_record',
    name: 'Video Call Record',
    description: "Priya's office computer: a video call with Melbourne from 9:58 pm to 11:02 pm.",
  },
};

export interface Person {
  id: string;
  name: string;
  role: string;
  kind: 'Suspect' | 'Victim';
}

/** The people on the deduction board. */
export const PEOPLE: readonly Person[] = [
  { id: 'rosli', name: 'Dr. Rosli Kamarudin', role: 'Senior lecturer, Chemistry. The victim.', kind: 'Victim' },
  { id: 'farah', name: 'Farah Idris', role: 'PhD student. Dr. Rosli supervised her.', kind: 'Suspect' },
  { id: 'daniel', name: 'Daniel Wong', role: 'Chemistry lab manager.', kind: 'Suspect' },
  { id: 'priya', name: 'Dr. Priya Nair', role: "Senior lecturer. Dr. Rosli's colleague of fifteen years.", kind: 'Suspect' },
];

export const PLAYER_LOOK: Look = { hair: 0x1d1727, top: 0x2f7f86, bottom: 0x2f3a5e, shoes: 0xd9d4c8, bag: 0x8b3a3a };

/** How every character other than the player looks, by id. */
export const LOOKS: Readonly<Record<string, Look>> = {
  farah: { hair: 0x1d1727, tudung: 0xc9708a, top: 0xd9cdb4, bottom: 0x2b3352, shoes: 0x3a2a2a },
  daniel: { hair: 0x15121c, top: 0x34405a, coat: 0xdfe2ea, bottom: 0x3c3f4f, shoes: 0x23202a },
  priya: { hair: 0x120f17, longHair: true, glasses: true, top: 0x8a2f45, bottom: 0x2a2638, shoes: 0x2b2224 },
  lim: { hair: 0x9a9aa6, glasses: true, top: 0x4f7a5a, bottom: 0x3a3548, shoes: 0x2b2224 },
  rahman: { hair: 0x15121c, top: 0x2a3c66, bottom: 0x1f2433, shoes: 0x15131a },
  ani: { hair: 0x1d1727, tudung: 0x3f8a86, top: 0x7d93a8, bottom: 0x3a4152, shoes: 0x2b2224 },
};

export const LINKS: readonly DeductionLink[] = [
  // Day 1
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
  // Day 2
  {
    clueId: 'library_gate_log',
    targetId: 'farah_alibi',
    unlockFlags: ['farah_cleared'],
    insight: "Farah's alibi holds: she was in the library until 10:55, after he collapsed.",
  },
  {
    clueId: 'door_access_log',
    targetId: 'lab_access_card',
    unlockFlags: ['daniel_card_lie'],
    insight: 'Daniel\'s "lost" card was used that evening. He lied about losing it.',
  },
  {
    clueId: 'door_access_log',
    targetId: 'daniel_alibi',
    unlockFlags: ['daniel_left_lab'],
    insight: "Daniel's spare card left the building at 9:41. He wasn't in the lab all night.",
  },
  {
    clueId: 'cleaner_statement',
    targetId: 'coffee_tumbler',
    unlockFlags: ['tumbler_at_pantry'],
    insight: "Dr. Rosli's tumbler was at the pantry at 9:45 — and so was Daniel.",
  },
  // Day 3
  {
    clueId: 'presigned_logbook',
    targetId: 'daniel_alibi',
    unlockFlags: ['daniel_alibi_broken'],
    insight: "Daniel signed the logbook in advance. His 'all night in the lab' alibi is fake.",
  },
  {
    clueId: 'video_call_record',
    targetId: 'priya_argument',
    unlockFlags: ['priya_cleared'],
    insight: "Priya was on a call from 9:58 to 11:02. She couldn't have done it.",
  },
  {
    clueId: 'audit_notes',
    targetId: 'daniel',
    unlockFlags: ['daniel_motive'],
    insight: 'Dr. Rosli was about to report Daniel for stealing from the stores. That is a motive.',
  },
];
