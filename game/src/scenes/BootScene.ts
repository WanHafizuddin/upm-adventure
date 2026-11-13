import * as Phaser from 'phaser';
import { createInteriorSprites } from '../art/interiors';
import { createSignage } from '../art/signage';
import { createSprites } from '../art/sprites';
import { LOOKS, PLAYER_LOOK } from '../data/case';
import { DAYS } from '../data/days';
import { LOCATIONS } from '../data/locations';
import type { Overlays } from '../ui/overlays';
import type { WorldSceneData } from './WorldScene';

/** Draws every texture once, shows the Day 1 title card, then starts the first location. */
export class BootScene extends Phaser.Scene {
  constructor(private readonly overlays: Overlays) {
    super('boot');
  }

  create(): void {
    createSprites(this, PLAYER_LOOK, LOOKS);
    createInteriorSprites(this);
    createSignage(this);
    const first = DAYS[0];
    this.overlays.showDayCard(first);
    this.scene.start(LOCATIONS[first.start.location].scene, { spawn: first.start } satisfies WorldSceneData);
  }
}
