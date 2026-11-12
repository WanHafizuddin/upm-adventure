import { describe, expect, it } from 'vitest';
import { pickNearest } from './interaction';

const origin = { x: 100, y: 100 };

describe('pickNearest', () => {
  it('returns -1 when there is nothing to pick', () => {
    expect(pickNearest(origin, [], 30)).toBe(-1);
  });

  it('picks the closer of two things in reach', () => {
    expect(pickNearest(origin, [{ x: 110, y: 100 }, { x: 100, y: 104 }], 30)).toBe(1);
  });

  it('picks the first one on a tie', () => {
    expect(pickNearest(origin, [{ x: 90, y: 100 }, { x: 110, y: 100 }], 30)).toBe(0);
  });

  it('counts vertical distance too', () => {
    expect(pickNearest(origin, [{ x: 100, y: 140 }], 30)).toBe(-1);
  });
});
