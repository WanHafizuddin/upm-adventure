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

  describe('open and made links', () => {
    const board = [
      { clueId: 'torn_note', targetId: 'suspect_a', unlockFlags: [] },
      { clueId: 'gate_log', targetId: 'alibi', unlockFlags: [] },
      { clueId: 'gate_log', targetId: 'suspect_a', unlockFlags: [] },
    ];

    it('lists only links whose two cards are both on the board', () => {
      const validator = new DeductionValidator(board);
      const open = validator.openLinks(new Set(['torn_note', 'gate_log', 'suspect_a']));
      expect(open.map((l) => `${l.clueId}-${l.targetId}`)).toEqual(['torn_note-suspect_a', 'gate_log-suspect_a']);
    });

    it('moves a link from open to made once it is connected', () => {
      const validator = new DeductionValidator(board);
      const present = new Set(['torn_note', 'gate_log', 'alibi', 'suspect_a']);
      validator.tryConnect('alibi', 'gate_log');
      expect(validator.openLinks(present)).toHaveLength(2);
      expect(validator.madeLinks().map((l) => l.targetId)).toEqual(['alibi']);
    });
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
