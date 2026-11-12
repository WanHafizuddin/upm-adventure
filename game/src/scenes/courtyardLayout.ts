// Shared measurements for the Day 1 courtyard, used by both the ground art and the scene.
export const MAP_W = 768;
export const MAP_H = 544;
export const BUILDING_H = 112;
export const DOOR_X = 384;

/** The vertical path from the faculty door to the bottom edge. */
export const MAIN_PATH = { x0: 360, x1: 408 };
/** The horizontal path across the middle. */
export const CROSS_PATH = { y0: 284, y1: 316 };
/** The round plaza around the fountain. Circles on the ground are drawn squashed (0.8) for the top-down 3/4 view. */
export const PLAZA = { x: 384, y: 300, inner: 62, outer: 80, squash: 0.8 };

export function plazaDistance(x: number, y: number): number {
  return Math.hypot(x - PLAZA.x, (y - PLAZA.y) / PLAZA.squash);
}

export function isPath(x: number, y: number): boolean {
  if (y < BUILDING_H) return false;
  if (x >= MAIN_PATH.x0 && x < MAIN_PATH.x1) return true;
  if (y >= CROSS_PATH.y0 && y < CROSS_PATH.y1) return true;
  return plazaDistance(x, y) < PLAZA.outer;
}
