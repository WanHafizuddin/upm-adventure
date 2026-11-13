import { ClueInventory, type Clue } from './clues';
import { isDayComplete } from './day';
import { DeductionValidator, type ConnectionResult, type DeductionLink } from './deduction';
import type { DialogueNode } from './dialogue';
import { Flags } from './flags';

/**
 * Everything the player has found or done so far. The scene and the UI overlays
 * share one instance, and change it only through these methods so listeners hear about it.
 */
export class GameState {
  readonly inventory = new ClueInventory();
  readonly flags = new Flags();
  readonly validator: DeductionValidator;
  private readonly listeners: Array<() => void> = [];
  private currentDay = 1;

  /** `dayGoals[n]` lists the flags that finish day n. */
  constructor(
    links: readonly DeductionLink[],
    private readonly dayGoals: Readonly<Record<number, readonly string[]>>,
  ) {
    this.validator = new DeductionValidator(links);
  }

  get day(): number {
    return this.currentDay;
  }

  /** Moves on to the next day of the case. */
  advanceDay(): void {
    this.currentDay++;
    this.notify();
  }

  /** Returns true if the clue was new. */
  pickUp(clue: Clue): boolean {
    const added = this.inventory.add(clue);
    if (added) this.notify();
    return added;
  }

  /** Returns true if the flag was newly set. */
  setFlag(id: string): boolean {
    const changed = this.flags.set(id);
    if (changed) this.notify();
    return changed;
  }

  /**
   * Applies what reaching a dialogue node does: turns on its flag and hands over its clue.
   * Returns the clue only the first time it's gained, so the UI can announce it once.
   */
  enterNode(node: DialogueNode, clues: Readonly<Record<string, Clue>>): Clue | undefined {
    if (node.setsFlag) this.setFlag(node.setsFlag);
    if (!node.givesClue) return undefined;
    const clue = clues[node.givesClue];
    return clue && this.pickUp(clue) ? clue : undefined;
  }

  connect(a: string, b: string): ConnectionResult {
    const result = this.validator.tryConnect(a, b);
    if (result.valid) {
      result.unlockFlags.forEach((id) => this.flags.set(id));
      this.notify();
    }
    return result;
  }

  /** Whether every goal of the current day is done. */
  isDayComplete(): boolean {
    return isDayComplete(this.dayGoals[this.currentDay] ?? [], this.flags);
  }

  onChange(listener: () => void): void {
    this.listeners.push(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}
