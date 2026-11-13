import type { Flags } from './flags';

/** Whether something (an NPC, a clue, an exit) is around on `day`. No `days` list means every day. */
export function availableOn(item: { days?: readonly number[] }, day: number): boolean {
  return item.days === undefined || item.days.includes(day);
}

/** One of the day's goals, in words the player sees, and the flag that ticks it off. */
export interface Objective {
  flag: string;
  text: string;
}

/** The day's to-do list for the HUD: each objective with whether it's done. */
export function checklist(objectives: readonly Objective[], flags: Flags): { text: string; done: boolean }[] {
  return objectives.map((o) => ({ text: o.text, done: flags.get(o.flag) }));
}
