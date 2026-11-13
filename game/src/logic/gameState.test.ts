import { describe, expect, it, vi } from 'vitest';
import { GameState } from './gameState';

function makeState() {
  return new GameState(
    [{ clueId: 'torn_note', targetId: 'suspect_a', unlockFlags: ['linked_note_to_suspect_a'] }],
    ['met_suspect_a', 'linked_note_to_suspect_a'],
  );
}

describe('GameState', () => {
  it('starts with Day 1 incomplete', () => {
    expect(makeState().isDay1Complete()).toBe(false);
  });

  it('needs both the meeting and the board link to finish Day 1', () => {
    const state = makeState();
    state.setFlag('met_suspect_a');
    expect(state.isDay1Complete()).toBe(false);
    state.connect('torn_note', 'suspect_a');
    expect(state.isDay1Complete()).toBe(true);
  });

  it('tells listeners about pickups, flags and valid links', () => {
    const state = makeState();
    const listener = vi.fn();
    state.onChange(listener);

    state.pickUp({ id: 'torn_note', name: 'Torn Note', description: '' });
    state.setFlag('met_suspect_a');
    state.connect('torn_note', 'suspect_a');

    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('applies a dialogue node: sets its flag and hands over its clue once', () => {
    const state = makeState();
    const note = { id: 'torn_note', name: 'Torn Note', description: '' };
    const node = { id: 'n', speaker: 'X', text: '', setsFlag: 'met_x', givesClue: 'torn_note', choices: [] };

    expect(state.enterNode(node, { torn_note: note })).toBe(note);
    expect(state.flags.get('met_x')).toBe(true);
    expect(state.inventory.has('torn_note')).toBe(true);
    expect(state.enterNode(node, { torn_note: note })).toBeUndefined();
  });

  it('stays quiet when nothing actually changed', () => {
    const state = makeState();
    const note = { id: 'torn_note', name: 'Torn Note', description: '' };
    state.pickUp(note);
    state.setFlag('met_suspect_a');
    const listener = vi.fn();
    state.onChange(listener);

    state.pickUp(note);
    state.setFlag('met_suspect_a');
    state.connect('alibi_witness_statement', 'suspect_a');

    expect(listener).not.toHaveBeenCalled();
  });
});
