import * as Phaser from 'phaser';
import { createInteriorSprites } from '../art/interiors';
import { createSignage } from '../art/signage';
import { createSprites } from '../art/sprites';
import { CLUES, LOOKS, PLAYER_LOOK } from '../data/case';
import { DAYS, type Spawn } from '../data/days';
import { LOCATIONS } from '../data/locations';
import type { GameState } from '../logic/gameState';
import type { Progress, SaveData } from '../save';
import type { Overlays } from '../ui/overlays';
import type { WorldSceneData } from './WorldScene';

/** Draws every texture once, then offers Continue (if there's a save) or starts Day 1. */
export class BootScene extends Phaser.Scene {
  constructor(
    private readonly state: GameState,
    private readonly overlays: Overlays,
    private readonly progress: Progress,
    private readonly saved: SaveData | null,
  ) {
    super('boot');
  }

  create(): void {
    createSprites(this, PLAYER_LOOK, LOOKS);
    createInteriorSprites(this);
    createSignage(this);

    const saved = this.saved;
    if (!saved) {
      this.newGame();
      return;
    }
    this.overlays.showTitle(
      `Continue — Day ${saved.day} · ${saved.place}`,
      () => {
        this.overlays.markDaysAnnounced(saved.day - 1);
        this.state.restore(saved, CLUES);
        this.overlays.toast(`Welcome back. Day ${saved.day}.`);
        this.go(saved.spawn);
      },
      () => {
        this.progress.clear();
        this.newGame();
      },
    );
  }

  private newGame(): void {
    const first = DAYS[0];
    this.overlays.showDayCard(first);
    this.go(first.start);
  }

  private go(spawn: Spawn): void {
    this.scene.start(LOCATIONS[spawn.location].scene, { spawn } satisfies WorldSceneData);
  }
}
