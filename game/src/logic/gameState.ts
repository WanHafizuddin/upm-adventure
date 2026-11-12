import { ClueInventory, type Clue } from './clues';
import { isDayComplete } from './day';
import { DeductionValidator, type ConnectionResult, type DeductionLink } from './deduction';
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

  constructor(
    links: readonly DeductionLink[],
    private readonly day1Required: readonly string[],
  ) {
    this.validator = new DeductionValidator(links);
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

  connect(a: string, b: string): ConnectionResult {
    const result = this.validator.tryConnect(a, b);
    if (result.valid) {
      result.unlockFlags.forEach((id) => this.flags.set(id));
      this.notify();
    }
    return result;
  }

  isDay1Complete(): boolean {
    return isDayComplete(this.day1Required, this.flags);
  }

  onChange(listener: () => void): void {
    this.listeners.push(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}
