import { describe, expect, it } from 'vitest';
import { DeductionValidator } from './deduction';

const links = [
  { clueId: 'torn_note', targetId: 'suspect_a', unlockFlags: ['linked_note_to_suspect_a'] },
];

describe('DeductionValidator', () => {
  it('accepts a clue dragged onto its suspect', () => {
    const result = new DeductionValidator(links).tryConnect('torn_note', 'suspect_a');
    expect(result).toEqual({ valid: true, unlockFlags: ['linked_note_to_suspect_a'] });
  });

  it('accepts the suspect dragged onto the clue', () => {
    const result = new DeductionValidator(links).tryConnect('suspect_a', 'torn_note');
    expect(result).toEqual({ valid: true, unlockFlags: ['linked_note_to_suspect_a'] });
  });

  it('rejects a pair that is not in the solution', () => {
    const result = new DeductionValidator(links).tryConnect('alibi_witness_statement', 'suspect_a');
    expect(result).toEqual({ valid: false, unlockFlags: [] });
  });

  it('rejects a link that was already made, in either order', () => {
    const validator = new DeductionValidator(links);
    validator.tryConnect('torn_note', 'suspect_a');
    expect(validator.tryConnect('torn_note', 'suspect_a')).toEqual({ valid: false, unlockFlags: [] });
    expect(validator.tryConnect('suspect_a', 'torn_note')).toEqual({ valid: false, unlockFlags: [] });
  });

  it('passes on the insight a link teaches', () => {
    const validator = new DeductionValidator([
      { clueId: 'coffee_tumbler', targetId: 'rosli', unlockFlags: ['linked_tumbler_to_victim'], insight: 'Poisoned coffee.' },
    ]);
    expect(validator.tryConnect('rosli', 'coffee_tumbler').insight).toBe('Poisoned coffee.');
  });

  it('remembers which links have been made', () => {
    const validator = new DeductionValidator(links);
    expect(validator.isConnected('suspect_a', 'torn_note')).toBe(false);
    validator.tryConnect('torn_note', 'suspect_a');
    expect(validator.isConnected('suspect_a', 'torn_note')).toBe(true);
  });

  it('can list its made links and restore them into a fresh validator', () => {
    const first = new DeductionValidator(links);
    first.tryConnect('torn_note', 'suspect_a');
    const second = new DeductionValidator(links);
    second.restoreConnections(first.connections());
    expect(second.isConnected('suspect_a', 'torn_note')).toBe(true);
    expect(second.tryConnect('torn_note', 'suspect_a').valid).toBe(false);
  });
});
