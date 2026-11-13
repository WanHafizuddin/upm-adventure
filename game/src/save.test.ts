import { describe, expect, it } from 'vitest';
import { createSaveStore, parseSave, type SaveData } from './save';

const good: SaveData = {
  version: 1,
  day: 2,
  clues: ['torn_note'],
  flags: ['met_farah'],
  links: ['farah|torn_note'],
  spawn: { location: 'library', x: 288, y: 274, facing: 'up' },
  place: 'PSAS · Ruang Bacaan',
};

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe('parseSave', () => {
  it('reads a valid save', () => {
    expect(parseSave(JSON.stringify(good))).toEqual(good);
  });

  it('ignores nothing, broken JSON, other versions and missing fields', () => {
    expect(parseSave(null)).toBeNull();
    expect(parseSave('{not json')).toBeNull();
    expect(parseSave(JSON.stringify({ ...good, version: 99 }))).toBeNull();
    const { spawn: _spawn, ...noSpawn } = good;
    expect(parseSave(JSON.stringify(noSpawn))).toBeNull();
    expect(parseSave(JSON.stringify({ ...good, clues: 'torn_note' }))).toBeNull();
  });
});

describe('createSaveStore', () => {
  it('saves, loads and clears', () => {
    const store = createSaveStore(fakeStorage());
    expect(store.load()).toBeNull();
    store.save(good);
    expect(store.load()).toEqual(good);
    store.clear();
    expect(store.load()).toBeNull();
  });
});
