import * as Phaser from 'phaser';
import './style.css';
import { CLUES, LINKS, PEOPLE } from './data/case';
import { DAY_GOALS } from './data/days';
import { DIALOGUE } from './data/dialogue';
import { GameState } from './logic/gameState';
import { BootScene } from './scenes/BootScene';
import { CourtyardScene } from './scenes/CourtyardScene';
import { RoomScene } from './scenes/RoomScene';
import { Overlays } from './ui/overlays';

const state = new GameState(LINKS, DAY_GOALS);
const overlays = new Overlays(document.getElementById('ui')!, state, { dialogue: DIALOGUE, clues: CLUES, people: PEOPLE });

const game = new Phaser.Game({
  type: Phaser.WEBGL, // lighting needs WebGL
  parent: 'game',
  width: 480,
  height: 270,
  pixelArt: true,
  roundPixels: true,
  maxLights: 16,
  backgroundColor: '#0d0b1a',
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 } },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [new BootScene(overlays), new CourtyardScene(state, overlays), new RoomScene(state, overlays)],
});

// Dev-only handles for poking at the game from the browser console. Not included in `npm run build`.
if (import.meta.env.DEV) {
  Object.assign(window, { __game: game, __state: state });
}
