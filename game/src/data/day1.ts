import type { Clue } from '../logic/clues';
import type { DeductionLink } from '../logic/deduction';
import type { DialogueNode } from '../logic/dialogue';

// Day 1 content. Adding later days should mostly mean adding files like this one.

export const TORN_NOTE: Clue = {
  id: 'torn_note',
  name: 'Torn Note',
  description: 'A half-burned note found near the scene, addressed to Suspect A.',
};

export const ALIBI_STATEMENT: Clue = {
  id: 'alibi_witness_statement',
  name: 'Alibi Witness Statement',
  description:
    "A librarian confirms someone matching Suspect A's description was in the library that night.",
};

export interface Suspect {
  id: string;
  name: string;
}

export const SUSPECT_A: Suspect = { id: 'suspect_a', name: 'Suspect A' };

export const SUSPECTS: readonly Suspect[] = [SUSPECT_A];

export const DIALOGUE: Readonly<Record<string, DialogueNode>> = {
  suspectA_1: {
    id: 'suspectA_1',
    speaker: SUSPECT_A.name,
    text: 'I was in the library the whole evening. Ask anyone.',
    setsFlag: 'met_suspect_a',
    choices: [
      { text: 'Ask something else', next: 'suspectA_1' },
      { text: 'Ask about the note', next: 'suspectA_2', requiresClue: TORN_NOTE.id },
      { text: 'Leave', next: null },
    ],
  },
  suspectA_2: {
    id: 'suspectA_2',
    speaker: SUSPECT_A.name,
    text: "...Okay. Fine. That note isn't what you think it is.",
    choices: [{ text: 'Leave', next: null }],
  },
};

export const SUSPECT_A_START = 'suspectA_1';

export const LINKS: readonly DeductionLink[] = [
  { clueId: TORN_NOTE.id, targetId: SUSPECT_A.id, unlockFlags: ['linked_note_to_suspect_a'] },
];

export const DAY1_REQUIRED: readonly string[] = ['met_suspect_a', 'linked_note_to_suspect_a'];
