import { describe, expect, it, vi } from 'vitest';
import { GameState } from './gameState';

function makeState() {
  return new GameState(
    [{ clueId: 'torn_note', targetId: 'suspect_a', unlockFlags: ['linked_note_to_suspect_a'] }],
    { 1: ['met_suspect_a', 'linked_note_to_suspect_a'], 2: ['met_librarian'] },
  );
}

describe('GameState', () => {
  it('starts on day 1 with the day incomplete', () => {
    const state = makeState();
    expect(state.day).toBe(1);
    expect(state.isDayComplete()).toBe(false);
  });

  it('needs every goal of the current day', () => {
    const state = makeState();
    state.setFlag('met_suspect_a');
    expect(state.isDayComplete()).toBe(false);
    state.connect('torn_note', 'suspect_a');
    expect(state.isDayComplete()).toBe(true);
  });

  it('moves to the next day and checks that day’s goals', () => {
    const state = makeState();
    const listener = vi.fn();
    state.onChange(listener);

    state.advanceDay();

    expect(state.day).toBe(2);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(state.isDayComplete()).toBe(false);
    state.setFlag('met_librarian');
    expect(state.isDayComplete()).toBe(true);
  });

  it('treats a day with no listed goals as complete', () => {
    const state = makeState();
    state.advanceDay();
    state.advanceDay();
    expect(state.isDayComplete()).toBe(true);
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
