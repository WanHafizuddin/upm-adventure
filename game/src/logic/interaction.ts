export interface Point {
  x: number;
  y: number;
}

/**
 * Index of the candidate closest to `origin` (straight-line distance) and within `reach`,
 * or -1 if none is in reach. On a tie the earlier candidate wins.
 */
export function pickNearest(origin: Point, candidates: readonly Point[], reach: number): number {
  let best = -1;
  let bestDistance = Infinity;
  candidates.forEach((candidate, index) => {
    const distance = Math.hypot(candidate.x - origin.x, candidate.y - origin.y);
    if (distance <= reach && distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}
