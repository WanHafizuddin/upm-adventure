import { describe, expect, it } from 'vitest';
import { facingFor, moveVector } from './movement';

const none = { left: false, right: false, up: false, down: false };

describe('moveVector', () => {
  it('is zero with no keys held', () => {
    expect(moveVector(none)).toEqual({ x: 0, y: 0 });
  });

  it('points right when only right is held', () => {
    expect(moveVector({ ...none, right: true })).toEqual({ x: 1, y: 0 });
  });

  it('has the same length diagonally as straight', () => {
    const v = moveVector({ ...none, up: true, right: true });
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1);
    expect(v.x).toBeGreaterThan(0);
    expect(v.y).toBeLessThan(0);
  });

  it('cancels opposite keys', () => {
    expect(moveVector({ ...none, left: true, right: true })).toEqual({ x: 0, y: 0 });
  });
});

describe('facingFor', () => {
  it('faces down when moving down', () => {
    expect(facingFor({ x: 0, y: 1 }, 'up')).toBe('down');
  });

  it('prefers the horizontal direction on a diagonal', () => {
    expect(facingFor({ x: -0.7, y: -0.7 }, 'down')).toBe('left');
  });

  it('keeps the previous facing when standing still', () => {
    expect(facingFor({ x: 0, y: 0 }, 'right')).toBe('right');
  });
});
