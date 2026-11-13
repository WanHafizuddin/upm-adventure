import { describe, expect, it } from 'vitest';
import { availableOn } from './days';

describe('availableOn', () => {
  it('treats things with no day list as available every day', () => {
    expect(availableOn({}, 1)).toBe(true);
    expect(availableOn({}, 4)).toBe(true);
  });

  it('only offers things on the days they list', () => {
    expect(availableOn({ days: [2] }, 1)).toBe(false);
    expect(availableOn({ days: [2] }, 2)).toBe(true);
    expect(availableOn({ days: [1, 2] }, 3)).toBe(false);
  });
});
