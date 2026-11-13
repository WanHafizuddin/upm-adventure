import * as Phaser from 'phaser';
import './style.css';
import { sound } from './audio/sound';
import { CLUES, LINKS, PEOPLE } from './data/case';
import { DAY_GOALS } from './data/days';
import { DIALOGUE } from './data/dialogue';
import { GameState } from './logic/gameState';
import { BootScene } from './scenes/BootScene';
import { CourtyardScene } from './scenes/CourtyardScene';
import { RoomScene } from './scenes/RoomScene';
import { Progress, createSaveStore } from './save';
import { Overlays } from './ui/overlays';

const state = new GameState(LINKS, DAY_GOALS);
const overlays = new Overlays(document.getElementById('ui')!, state, { dialogue: DIALOGUE, clues: CLUES, people: PEOPLE });
const saves = createSaveStore(window.localStorage);
const saved = saves.load();
const progress = new Progress(state, saves);
// Browsers only allow sound after the player interacts; M toggles it.
const unlockSound = () => sound.unlock();
window.addEventListener('pointerdown', unlockSound);
window.addEventListener('keydown', (e) => {
  unlockSound();
  if (e.key === 'm' || e.key === 'M') overlays.toast(sound.toggleMute() ? 'Sound off (M)' : 'Sound on (M)');
});

overlays.setRestartHandler(() => {
  progress.clear();
  window.location.reload();
});

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
  scene: [
    new BootScene(state, overlays, progress, saved),
    new CourtyardScene(state, overlays, progress),
    new RoomScene(state, overlays, progress),
  ],
});

// Dev-only handles for poking at the game from the browser console. Not included in `npm run build`.
if (import.meta.env.DEV) {
  Object.assign(window, { __game: game, __state: state });
}
