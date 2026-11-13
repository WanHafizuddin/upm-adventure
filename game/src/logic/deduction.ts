/** One correct connection on the deduction board, and the flags it unlocks. */
export interface DeductionLink {
  clueId: string;
  targetId: string;
  unlockFlags: string[];
  /** What the player learns from making this link, shown when they make it. */
  insight?: string;
  /** A question shown on the board while the link is still to be made, saying what to look for. */
  lead?: string;
}

export interface ConnectionResult {
  valid: boolean;
  unlockFlags: readonly string[];
  insight?: string;
}

const REJECTED: ConnectionResult = { valid: false, unlockFlags: [] };

/** Checks board connections against the solution. Direction doesn't matter. */
export class DeductionValidator {
  private readonly made = new Set<string>();

  constructor(private readonly links: readonly DeductionLink[]) {}

  /** Tries to connect two board nodes. A link that was already made is rejected. */
  tryConnect(a: string, b: string): ConnectionResult {
    const link = this.find(a, b);
    if (link === undefined) return REJECTED;

    const key = pairKey(a, b);
    if (this.made.has(key)) return REJECTED;

    this.made.add(key);
    return link.insight === undefined
      ? { valid: true, unlockFlags: [...link.unlockFlags] }
      : { valid: true, unlockFlags: [...link.unlockFlags], insight: link.insight };
  }

  isConnected(a: string, b: string): boolean {
    return this.made.has(pairKey(a, b));
  }

  /** Links not made yet whose two cards are both in `present`, in solution order. */
  openLinks(present: ReadonlySet<string>): DeductionLink[] {
    return this.links.filter(
      (l) => present.has(l.clueId) && present.has(l.targetId) && !this.made.has(pairKey(l.clueId, l.targetId)),
    );
  }

  /** Links made so far, in solution order. */
  madeLinks(): DeductionLink[] {
    return this.links.filter((l) => this.made.has(pairKey(l.clueId, l.targetId)));
  }

  /** Links made so far, as opaque keys, e.g. for saving. */
  connections(): string[] {
    return [...this.made];
  }

  /** Marks links (from `connections()`) as already made. */
  restoreConnections(keys: readonly string[]): void {
    keys.forEach((key) => this.made.add(key));
  }

  private find(a: string, b: string): DeductionLink | undefined {
    return this.links.find(
      (l) => (l.clueId === a && l.targetId === b) || (l.clueId === b && l.targetId === a),
    );
  }
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}
