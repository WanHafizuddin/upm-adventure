import { describe, expect, it } from 'vitest';
import { ClueInventory } from './clues';
import { isChoiceAvailable, resolveChoice, type DialogueNode } from './dialogue';

const second: DialogueNode = { id: 'n2', speaker: 'A', text: 'Second.', choices: [] };
const first: DialogueNode = {
  id: 'n1',
  speaker: 'A',
  text: 'First.',
  choices: [
    { text: 'Continue', next: 'n2' },
    { text: 'Leave', next: null },
    { text: 'Broken link', next: 'missing' },
  ],
};
const nodes = { n1: first, n2: second };

describe('isChoiceAvailable', () => {
  it('always allows a choice with no requirement', () => {
    expect(isChoiceAvailable({ text: 'Hi', next: null }, new ClueInventory())).toBe(true);
  });

  it('blocks a clue-gated choice until the clue is held', () => {
    const choice = { text: 'Ask about the note', next: 'n2', requiresClue: 'torn_note' };
    const inventory = new ClueInventory();
    expect(isChoiceAvailable(choice, inventory)).toBe(false);
    inventory.add({ id: 'torn_note', name: 'Torn Note', description: '' });
    expect(isChoiceAvailable(choice, inventory)).toBe(true);
  });
});

describe('resolveChoice', () => {
  it('follows the chosen link', () => {
    expect(resolveChoice(first, 0, nodes)).toBe(second);
  });

  it('ends the conversation for a choice with no next node', () => {
    expect(resolveChoice(first, 1, nodes)).toBeNull();
  });

  it('stays on the current node for an out-of-range choice', () => {
    expect(resolveChoice(first, 5, nodes)).toBe(first);
  });

  it('stays on the current node when the link names an unknown node', () => {
    expect(resolveChoice(first, 2, nodes)).toBe(first);
  });
});
