import { describe, expect, it } from 'vitest';
import { Flags } from './flags';

describe('Flags', () => {
  it('reports an unset flag as false', () => {
    expect(new Flags().get('met_suspect_a')).toBe(false);
  });

  it('reports a set flag as true', () => {
    const flags = new Flags();
    flags.set('met_suspect_a');
    expect(flags.get('met_suspect_a')).toBe(true);
  });

  it('returns true only the first time a flag is set', () => {
    const flags = new Flags();
    expect(flags.set('met_suspect_a')).toBe(true);
    expect(flags.set('met_suspect_a')).toBe(false);
  });

  it('lists every flag that is set', () => {
    const flags = new Flags();
    flags.set('met_farah');
    flags.set('examined_scene');
    expect(flags.all().sort()).toEqual(['examined_scene', 'met_farah']);
  });
});
