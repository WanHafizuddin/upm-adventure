/** Story progress markers, e.g. "met_suspect_a". A flag can only ever be turned on. */
export class Flags {
  private readonly set_ = new Set<string>();

  /** Turns the flag on. Returns true only the first time. */
  set(id: string): boolean {
    if (this.set_.has(id)) return false;
    this.set_.add(id);
    return true;
  }

  get(id: string): boolean {
    return this.set_.has(id);
  }

  /** Every flag that is on, e.g. for saving. */
  all(): string[] {
    return [...this.set_];
  }
}
