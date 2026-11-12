import { describe, expect, it } from 'vitest';
import { ClueInventory, type Clue } from './clues';

const tornNote: Clue = { id: 'torn_note', name: 'Torn Note', description: 'A note.' };

describe('ClueInventory', () => {
  it('does not hold a clue that was never added', () => {
    expect(new ClueInventory().has('torn_note')).toBe(false);
  });

  it('holds a clue after it is added', () => {
    const inventory = new ClueInventory();
    inventory.add(tornNote);
    expect(inventory.has('torn_note')).toBe(true);
  });

  it('ignores a second copy of the same clue', () => {
    const inventory = new ClueInventory();
    expect(inventory.add(tornNote)).toBe(true);
    expect(inventory.add(tornNote)).toBe(false);
    expect(inventory.all()).toHaveLength(1);
  });
});
