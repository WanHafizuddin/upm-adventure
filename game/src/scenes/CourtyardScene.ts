import * as Phaser from 'phaser';
import { LIT_WINDOWS, WINDOW_BAY_X } from '../art/sprites';
import { daySpec } from '../data/days';
import type { GameState } from '../logic/gameState';
import type { Overlays } from '../ui/overlays';
import { BUILDING_H, DOOR_X, MAP_H, MAP_W, PLAZA } from './courtyardLayout';
import { WorldScene } from './WorldScene';

const LAMP_LIGHT = 0xffa431;
/** Dim blue-violet night; a touch warmer and lighter in the evening. */
const AMBIENT = { Night: 0x7a76b8, Evening: 0x8a7db0 } as const;

/** The courtyard of Fakulti Sains, UPM, seen from above. */
export class CourtyardScene extends WorldScene {
  constructor(state: GameState, overlays: Overlays) {
    super('courtyard', state, overlays);
  }

  protected buildWorld(): { w: number; h: number } {
    const day = this.state.day;
    this.lights.setAmbientColor(AMBIENT[daySpec(day)?.time ?? 'Night']);
    this.add.image(0, 0, 'ground').setOrigin(0).setDepth(-10000).setLighting(true);

    // Fakulti Sains along the top, with light spilling from the lit windows and the door.
    this.add.image(0, 0, 'building').setOrigin(0).setDepth(BUILDING_H).setLighting(true);
    this.block(MAP_W / 2, (BUILDING_H - 2) / 2, MAP_W, BUILDING_H - 2);
    for (const bay of LIT_WINDOWS) this.lights.addLight(WINDOW_BAY_X(bay), BUILDING_H + 6, 85, 0xffc070, 2.6, 30);
    this.lights.addLight(DOOR_X, BUILDING_H - 30, 70, 0xffcf8a, 1.6, 30);

    // Hedges on the flower beds, leaving the door path clear.
    for (let x = 34; x <= 330; x += 30) this.prop(x % 60 === 4 ? 'bush_1' : 'bush_0', x, BUILDING_H + 26, { block: [28, 6] });
    for (let x = 440; x <= 740; x += 30) this.prop(x % 60 === 20 ? 'bush_1' : 'bush_0', x, BUILDING_H + 26, { block: [28, 6] });

    this.prop('fountain', PLAZA.x, PLAZA.y + 38, { block: [108, 50], blockLift: 6 });

    const trees: Array<[number, number, number]> = [
      [52, 196, 0], [150, 222, 1], [40, 388, 2], [124, 470, 0], [48, 540, 1],
      [716, 192, 1], [624, 224, 2], [736, 392, 0], [650, 484, 1], [730, 540, 2],
      [230, 538, 2], [520, 534, 0],
    ];
    for (const [x, y, variant] of trees) this.prop(`tree_${variant}`, x, y, { block: [12, 6], shadow: 'shadow_big' });

    // The two lamps either side of the path to the faculty door fly red UPM banners.
    const lamps: Array<[number, number, string]> = [
      [338, 198, 'lamp_upm'], [430, 198, 'lamp_upm'], [222, 282, 'lamp'], [590, 300, 'lamp'], [430, 468, 'lamp'],
    ];
    for (const [x, y, key] of lamps) {
      // The banner lamp is wider (banner on the right), so shift it to keep the pole in the same place.
      this.prop(key, key === 'lamp_upm' ? x + 6 : x, y, { shadow: 'shadow_small' });
      this.block(x, y - 2, 6, 4); // the pole
      this.lights.addLight(x, y - 44, 95, LAMP_LIGHT, 3.2, 34);
    }

    // The big UPM sign by the south path, floodlit from below.
    this.prop('upm_monument', 300, 446, { block: [104, 10], shadow: 'shadow_big' });
    this.lights.addLight(300, 452, 90, 0xffd08a, 2.4, 40);
    this.prop('bench', 284, 282, { block: [34, 6] });
    this.prop('bench', 560, 452, { block: [34, 6] });

    // Campus life: students' motorcycles and the campus bus stop.
    for (const x of [652, 686, 720]) this.prop('f_motorcycle', x, 356, { block: [26, 6] });
    this.prop('f_busstop', 446, 528, { block: [6, 4] });

    // The crime scene. The tape stays up; the tumbler and briefcase are only there the first night.
    this.prop('tape', 512, 352, { block: [100, 34], blockLift: 2 });
    this.prop('marker_1', 486, 332);
    this.prop('marker_2', 542, 324);
    if (day === 1) {
      this.prop('briefcase', 534, 340);
      this.prop('tumbler', 500, 334);
    }

    this.addFireflies();
    return { w: MAP_W, h: MAP_H };
  }

  private addFireflies(): void {
    const r = new Phaser.Math.RandomDataGenerator(['fireflies']);
    for (let i = 0; i < 14; i++) {
      const x = r.between(20, MAP_W - 20);
      const y = r.between(BUILDING_H + 30, MAP_H - 10);
      const fly = this.add.image(x, y, 'firefly').setDepth(9000).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.2);
      this.tweens.add({
        targets: fly,
        x: x + r.between(-24, 24),
        y: y + r.between(-16, 16),
        alpha: { from: 0.15, to: 0.95 },
        duration: r.between(1800, 3600),
        delay: r.between(0, 2000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }
}
