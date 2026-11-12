export interface Clue {
  id: string;
  name: string;
  description: string;
}

/** The clues the player is carrying. Each clue is held at most once. */
export class ClueInventory {
  private readonly clues = new Map<string, Clue>();

  /** Adds the clue. Returns false (and changes nothing) if it is already held. */
  add(clue: Clue): boolean {
    if (this.clues.has(clue.id)) return false;
    this.clues.set(clue.id, clue);
    return true;
  }

  has(id: string): boolean {
    return this.clues.has(id);
  }

  /** Clues in the order they were picked up. */
  all(): readonly Clue[] {
    return [...this.clues.values()];
  }
}
