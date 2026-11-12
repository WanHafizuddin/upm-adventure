import type { Flags } from './flags';

/** A day is complete once every one of its required flags is set. */
export function isDayComplete(required: readonly string[], flags: Flags): boolean {
  return required.every((id) => flags.get(id));
}
