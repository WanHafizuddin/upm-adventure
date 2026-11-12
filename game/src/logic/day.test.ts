import { describe, expect, it } from 'vitest';
import { isDayComplete } from './day';
import { Flags } from './flags';

const required = ['met_suspect_a', 'linked_note_to_suspect_a'];

describe('isDayComplete', () => {
  it('is false while any required flag is missing', () => {
    const flags = new Flags();
    flags.set('met_suspect_a');
    expect(isDayComplete(required, flags)).toBe(false);
  });

  it('is true once every required flag is set', () => {
    const flags = new Flags();
    flags.set('met_suspect_a');
    flags.set('linked_note_to_suspect_a');
    expect(isDayComplete(required, flags)).toBe(true);
  });

  it('is true when nothing is required', () => {
    expect(isDayComplete([], new Flags())).toBe(true);
  });
});
