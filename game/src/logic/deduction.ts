/** One correct connection on the deduction board, and the flags it unlocks. */
export interface DeductionLink {
  clueId: string;
  targetId: string;
  unlockFlags: string[];
  /** What the player learns from making this link, shown when they make it. */
  insight?: string;
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
