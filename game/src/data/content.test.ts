import { describe, expect, it } from 'vitest';
import { availableOn } from '../logic/days';
import { GameState } from '../logic/gameState';
import { CLUES, LINKS, LOOKS, PEOPLE } from './case';
import { DIALOGUE } from './dialogue';
import { DAYS, DAY_GOALS } from './days';
import { LOCATIONS, type LocationSpec } from './locations';

// Content checks: catch typos, dead ends and soft-locks in the story data before anyone plays it.

const nodes = Object.values(DIALOGUE);
const locations = Object.values(LOCATIONS);
const personIds = new Set(PEOPLE.map((p) => p.id));
const isClue = (id: string) => CLUES[id] !== undefined;

/** Locations the player can get to on `day`, following exits open that day from where the day starts. */
function reachable(day: number): LocationSpec[] {
  const start = DAYS.find((d) => d.day === day)!.start.location;
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    for (const exit of LOCATIONS[queue.shift()!].exits) {
      if (exit.to && availableOn(exit, day) && !seen.has(exit.to.location)) {
        seen.add(exit.to.location);
        queue.push(exit.to.location);
      }
    }
  }
  return [...seen].map((id) => LOCATIONS[id]);
}

/** Every dialogue start the player can reach on `day`. */
function startsOn(day: number): string[] {
  return reachable(day).flatMap((loc) => [
    ...loc.npcs.filter((n) => availableOn(n, day)).map((n) => n.startNode),
    ...loc.examine.filter((e) => availableOn(e, day)).map((e) => e.startNode),
  ]);
}

/** Clues the player could possibly get on `day` (ignoring which questions are still locked). */
function obtainableOn(day: number): Set<string> {
  const found = new Set(reachable(day).flatMap((loc) => loc.floorClues.filter((c) => availableOn(c, day)).map((c) => c.clueId)));
  const seen = new Set<string>();
  const queue = startsOn(day);
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const node = DIALOGUE[id];
    if (node.givesClue) found.add(node.givesClue);
    for (const choice of node.choices) if (choice.next) queue.push(choice.next);
  }
  return found;
}

describe('story content', () => {
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
      if (node.givesClue) expect(isClue(node.givesClue), `${node.id} gives ${node.givesClue}`).toBe(true);
      for (const choice of node.choices) {
        if (choice.requiresClue) expect(isClue(choice.requiresClue), `${node.id} needs ${choice.requiresClue}`).toBe(true);
      }
    }
    for (const loc of locations) for (const c of loc.floorClues) expect(isClue(c.clueId), c.clueId).toBe(true);
  });

  it('links clues to people or to other clues', () => {
    for (const link of LINKS) {
      expect(isClue(link.clueId), link.clueId).toBe(true);
      expect(isClue(link.targetId) || personIds.has(link.targetId), link.targetId).toBe(true);
    }
  });

  it('gives every character a look and every conversation a real start', () => {
    for (const loc of locations) {
      for (const npc of loc.npcs) {
        expect(LOOKS[npc.id], `look for ${npc.id}`).toBeDefined();
        expect(DIALOGUE[npc.startNode], npc.startNode).toBeDefined();
      }
      for (const spot of loc.examine) expect(DIALOGUE[spot.startNode], spot.startNode).toBeDefined();
    }
  });

  it('only sends exits and day starts to real places inside the room', () => {
    const spawns = [...locations.flatMap((l) => l.exits.flatMap((e) => (e.to ? [e.to] : []))), ...DAYS.map((d) => d.start)];
    for (const spawn of spawns) {
      const target = LOCATIONS[spawn.location];
      expect(target, spawn.location).toBeDefined();
      if (target.room) {
        expect(spawn.x, `${spawn.location} x`).toBeLessThan(target.room.w);
        expect(spawn.y, `${spawn.location} y`).toBeLessThan(target.room.h);
      }
    }
    for (const loc of locations) {
      if (loc.scene === 'room') {
        expect(loc.room, loc.id).toBeDefined();
        expect(loc.room!.w, `${loc.id} wide enough for the camera`).toBeGreaterThanOrEqual(480);
        expect(loc.room!.h, `${loc.id} tall enough for the camera`).toBeGreaterThanOrEqual(272);
      }
    }
  });

  it('makes every clue obtainable on some day', () => {
    const all = new Set(DAYS.flatMap((d) => [...obtainableOn(d.day)]));
    for (const id of Object.keys(CLUES)) expect(all.has(id), id).toBe(true);
  });

  it("never needs a clue on a day when it can't be found", () => {
    for (const day of DAYS) {
      const obtainable = obtainableOn(day.day);
      for (const link of LINKS) {
        if (!link.unlockFlags.some((f) => day.goals.includes(f))) continue;
        for (const end of [link.clueId, link.targetId].filter(isClue)) {
          expect(obtainable.has(end), `day ${day.day} needs ${end}`).toBe(true);
        }
      }
    }
  });

  it('can be played through, day by day, using only what each day offers', () => {
    const state = new GameState(LINKS, DAY_GOALS);
    for (const day of DAYS) {
      expect(state.day).toBe(day.day);
      for (const loc of reachable(day.day)) {
        for (const c of loc.floorClues) if (availableOn(c, day.day)) state.pickUp(CLUES[c.clueId]);
      }
      for (let pass = 0; pass < 3; pass++) {
        const seen = new Set<string>();
        const queue = startsOn(day.day);
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
      for (const link of LINKS) {
        const held = (id: string) => !isClue(id) || state.inventory.has(id);
        if (held(link.clueId) && held(link.targetId)) state.connect(link.targetId, link.clueId);
      }
      expect(state.isDayComplete(), `day ${day.day} complete`).toBe(true);
      state.advanceDay();
    }
  });
});
