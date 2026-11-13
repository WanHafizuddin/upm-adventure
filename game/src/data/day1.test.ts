import { describe, expect, it } from 'vitest';
import { GameState } from '../logic/gameState';
import { CLUES, DAY1_REQUIRED, DIALOGUE, EXAMINE_SPOTS, FLOOR_CLUES, LINKS, NPCS, PEOPLE } from './day1';

// Content checks: catch typos and dead ends in the Day 1 data before anyone plays it.

const nodes = Object.values(DIALOGUE);
const personIds = new Set(PEOPLE.map((p) => p.id));

describe('Day 1 content', () => {
  it('only links dialogue to nodes that exist', () => {
    for (const node of nodes) {
      expect(DIALOGUE[node.id], `node key for ${node.id}`).toBe(node);
      for (const choice of node.choices) {
        if (choice.next !== null) expect(DIALOGUE[choice.next], `${node.id} → ${choice.next}`).toBeDefined();
      }
    }
  });

  it('only refers to clues that exist', () => {
    for (const node of nodes) {
      if (node.givesClue) expect(CLUES[node.givesClue], `${node.id} gives ${node.givesClue}`).toBeDefined();
      for (const choice of node.choices) {
        if (choice.requiresClue) expect(CLUES[choice.requiresClue], `${node.id} needs ${choice.requiresClue}`).toBeDefined();
      }
    }
    for (const placed of FLOOR_CLUES) expect(CLUES[placed.clueId], placed.clueId).toBeDefined();
    for (const link of LINKS) expect(CLUES[link.clueId], link.clueId).toBeDefined();
  });

  it('links every clue to a person on the board', () => {
    for (const link of LINKS) expect(personIds.has(link.targetId), link.targetId).toBe(true);
  });

  it('starts every conversation and examination at a real node', () => {
    for (const npc of NPCS) {
      expect(personIds.has(npc.id), npc.id).toBe(true);
      expect(DIALOGUE[npc.startNode], npc.startNode).toBeDefined();
    }
    for (const spot of EXAMINE_SPOTS) expect(DIALOGUE[spot.startNode], spot.startNode).toBeDefined();
  });

  it('makes every clue obtainable on Day 1', () => {
    const obtainable = new Set([...FLOOR_CLUES.map((c) => c.clueId), ...nodes.flatMap((n) => (n.givesClue ? [n.givesClue] : []))]);
    for (const id of Object.keys(CLUES)) expect(obtainable.has(id), id).toBe(true);
  });

  it('can be completed by playing through the content', () => {
    const state = new GameState(LINKS, DAY1_REQUIRED);
    for (const placed of FLOOR_CLUES) state.pickUp(CLUES[placed.clueId]);

    // Visit every node reachable from each conversation, taking only choices the player could pick.
    const starts = [...NPCS.map((n) => n.startNode), ...EXAMINE_SPOTS.map((s) => s.startNode)];
    for (let pass = 0; pass < 3; pass++) {
      const seen = new Set<string>();
      const queue = [...starts];
      while (queue.length) {
        const id = queue.shift()!;
        if (seen.has(id)) continue;
        seen.add(id);
        const node = DIALOGUE[id];
        state.enterNode(node, CLUES);
        for (const choice of node.choices) {
          const open = !choice.requiresClue || state.inventory.has(choice.requiresClue);
          if (open && choice.next) queue.push(choice.next);
        }
      }
    }
    expect(state.isDay1Complete()).toBe(false); // the board link is still needed

    for (const link of LINKS) expect(state.connect(link.targetId, link.clueId).valid, link.clueId).toBe(true);
    expect(state.isDay1Complete()).toBe(true);
    for (const flag of DAY1_REQUIRED) expect(state.flags.get(flag), flag).toBe(true);
  });
});
