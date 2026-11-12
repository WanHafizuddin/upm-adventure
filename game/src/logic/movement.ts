export type Facing = 'down' | 'up' | 'left' | 'right';

export interface DirectionKeys {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

/** Direction to walk in, length 1 (or 0 when standing still), so diagonals aren't faster. */
export function moveVector(keys: DirectionKeys): { x: number; y: number } {
  const x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  const length = Math.hypot(x, y);
  return length === 0 ? { x: 0, y: 0 } : { x: x / length, y: y / length };
}

/** Which way a character should face while moving along `v`. Sideways wins on diagonals. */
export function facingFor(v: { x: number; y: number }, previous: Facing): Facing {
  if (v.x === 0 && v.y === 0) return previous;
  if (v.x !== 0) return v.x < 0 ? 'left' : 'right';
  return v.y < 0 ? 'up' : 'down';
}
