import type { Spawn } from './data/days';
import type { Snapshot } from './logic/gameState';

/** What's kept in the browser between visits. */
export interface SaveData extends Snapshot {
  version: 1;
  /** Where the player last arrived; Continue puts them back here. */
  spawn: Spawn;
  /** That place's name, for the Continue button. */
  place: string;
}

const KEY = 'case-files-serdang-raya:save';

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Reads a save, or returns null for missing, broken or incompatible data. */
export function parseSave(json: string | null): SaveData | null {
  if (json === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  const spawn = d.spawn as Record<string, unknown> | undefined;
  const ok =
    d.version === 1 &&
    typeof d.day === 'number' &&
    isStringArray(d.clues) &&
    isStringArray(d.flags) &&
    isStringArray(d.links) &&
    typeof d.place === 'string' &&
    typeof spawn === 'object' &&
    spawn !== null &&
    typeof spawn.location === 'string' &&
    typeof spawn.x === 'number' &&
    typeof spawn.y === 'number' &&
    typeof spawn.facing === 'string';
  return ok ? (data as SaveData) : null;
}

/** Save, load and clear through any `localStorage`-like storage (injected so it can be tested). */
export function createSaveStore(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
  return {
    load: (): SaveData | null => parseSave(storage.getItem(KEY)),
    save: (data: SaveData): void => {
      try {
        storage.setItem(KEY, JSON.stringify(data));
      } catch {
        // Storage can be full or disabled (private mode); the game still plays, it just won't remember.
      }
    },
    clear: (): void => storage.removeItem(KEY),
  };
}

export type SaveStore = ReturnType<typeof createSaveStore>;

/**
 * Keeps the save up to date: whenever the game state changes, and whenever the player arrives
 * somewhere (that spot is where Continue will put them back).
 */
export class Progress {
  private spawn: Spawn | null = null;
  private place = '';

  constructor(
    private readonly state: { snapshot(): Snapshot; onChange(listener: () => void): void },
    private readonly store: SaveStore,
  ) {
    state.onChange(() => this.save());
  }

  arrived(spawn: Spawn, place: string): void {
    this.spawn = spawn;
    this.place = place;
    this.save();
  }

  clear(): void {
    this.store.clear();
  }

  private save(): void {
    if (!this.spawn) return; // nothing to save until the player is somewhere
    this.store.save({ version: 1, ...this.state.snapshot(), spawn: this.spawn, place: this.place });
  }
}
