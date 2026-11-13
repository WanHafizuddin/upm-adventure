/** Whether something (an NPC, a clue, an exit) is around on `day`. No `days` list means every day. */
export function availableOn(item: { days?: readonly number[] }, day: number): boolean {
  return item.days === undefined || item.days.includes(day);
}
