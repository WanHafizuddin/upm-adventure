/** What the final accusation has to prove, and which clues prove each part. */
export interface AccusationRules {
  culprit: string;
  /** How many distinct pieces of evidence the player must present. */
  evidenceNeeded: number;
  /** Each group (e.g. opportunity, means, motive) is covered by any one of its clues. */
  groups: ReadonlyArray<{ name: string; clues: readonly string[] }>;
}

export type Ending = 'true' | 'unproven' | 'wrong' | 'not_ready';

export interface Verdict {
  ending: Ending;
  /** Groups the evidence didn't cover (only filled in for the right suspect). */
  missing: string[];
}

/**
 * Judges an accusation. Too little evidence → not ready; wrong person → wrong;
 * right person proving every group → the true ending; right person otherwise → unproven.
 */
export function judgeAccusation(suspectId: string, evidenceIds: readonly string[], rules: AccusationRules): Verdict {
  const evidence = new Set(evidenceIds);
  if (evidence.size < rules.evidenceNeeded) return { ending: 'not_ready', missing: [] };
  if (suspectId !== rules.culprit) return { ending: 'wrong', missing: [] };
  const missing = rules.groups.filter((g) => !g.clues.some((c) => evidence.has(c))).map((g) => g.name);
  return { ending: missing.length === 0 ? 'true' : 'unproven', missing };
}
