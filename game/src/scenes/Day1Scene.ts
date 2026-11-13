import * as Phaser from 'phaser';
import { LIT_WINDOWS, WINDOW_BAY_X, createSprites } from '../art/sprites';
import { CLUES, EXAMINE_SPOTS, FLOOR_CLUES, NPCS, PEOPLE, PLAYER_LOOK, type FloorClue, type NpcSpec } from '../data/day1';
import type { GameState } from '../logic/gameState';
import { pickNearest } from '../logic/interaction';
import { facingFor, moveVector, type Facing } from '../logic/movement';
import type { Overlays } from '../ui/overlays';
import { BUILDING_H, DOOR_X, MAP_H, MAP_W, PLAZA } from './courtyardLayout';

const SPEED = 85; // pixels per second
const REACH = 24; // how close the player's feet must be to interact
const STEP_SECONDS = 0.16; // time per walking frame
const LAMP_LIGHT = 0xffa431;
const AMBIENT = 0x7a76b8; // dim blue-violet night

interface Interactable {
  x: number;
  y: number;
  label: string;
  promptY: number;
  use: () => void;
}

interface PropOptions {
  /** Footprint that blocks walking: width, height (sits on the ground line). */
  block?: [number, number];
  /** Raise the footprint above the ground line by this many pixels. */
  blockLift?: number;
  shadow?: 'shadow_big' | 'shadow_small';
}

/** Day 1: the faculty courtyard at night, seen from above. */
export class Day1Scene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private playerShadow!: Phaser.GameObjects.Image;
  private torch!: Phaser.GameObjects.Light;
  private facing: Facing = 'up';
  private walkTime = 0;
  private blockers: Phaser.GameObjects.Zone[] = [];
  private interactables: Interactable[] = [];
  private prompt!: Phaser.GameObjects.Text;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(
    private readonly state: GameState,
    private readonly overlays: Overlays,
  ) {
    super('Day1');
  }

  create(): void {
    createSprites(this, PLAYER_LOOK, Object.fromEntries(NPCS.map((n) => [n.id, n.look])));
    this.lights.enable().setAmbientColor(AMBIENT);
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    this.buildCourtyard();
    this.buildCrimeScene();
    NPCS.forEach((npc) => this.addNpc(npc));
    FLOOR_CLUES.forEach((placed) => this.addFloorClue(placed));
    for (const spot of EXAMINE_SPOTS) {
      this.interactables.push({
        x: spot.x,
        y: spot.y,
        label: spot.label,
        promptY: spot.y - 30,
        use: () => this.overlays.openDialogue(spot.startNode),
      });
    }
    this.buildPlayer(DOOR_X, 520);
    this.addFireflies();

    this.prompt = this.add
      .text(0, 0, '', { fontFamily: 'monospace', fontSize: '8px', color: '#ffe7b0', backgroundColor: '#0d0b1acc' })
      .setPadding(3, 1, 3, 1)
      .setOrigin(0.5, 1)
      .setDepth(10000)
      .setVisible(false);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, MAP_W, MAP_H);
    camera.startFollow(this.player, true, 0.15, 0.15);
    camera.setRoundPixels(true);

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      w: kb.addKey(K.W),
      a: kb.addKey(K.A),
      s: kb.addKey(K.S),
      d: kb.addKey(K.D),
      up: kb.addKey(K.UP),
      down: kb.addKey(K.DOWN),
      left: kb.addKey(K.LEFT),
      right: kb.addKey(K.RIGHT),
      e: kb.addKey(K.E),
      tab: kb.addKey(K.TAB),
      esc: kb.addKey(K.ESC),
      one: kb.addKey(K.ONE),
      two: kb.addKey(K.TWO),
      three: kb.addKey(K.THREE),
      four: kb.addKey(K.FOUR),
    };
  }

  update(_time: number, deltaMs: number): void {
    const k = this.keys;
    const JustDown = Phaser.Input.Keyboard.JustDown;

    if (JustDown(k.tab)) this.overlays.toggleBoard();
    if (JustDown(k.esc)) this.overlays.closeAll();
    if (this.overlays.isDialogueOpen()) {
      if (JustDown(k.one)) this.overlays.chooseNumber(1);
      if (JustDown(k.two)) this.overlays.chooseNumber(2);
      if (JustDown(k.three)) this.overlays.chooseNumber(3);
      if (JustDown(k.four)) this.overlays.chooseNumber(4);
    }
    // Read E even while blocked, so a press during dialogue doesn't fire after it closes.
    const interactPressed = JustDown(k.e);
    const blocking = this.overlays.isBlocking();

    const v = blocking
      ? { x: 0, y: 0 }
      : moveVector({
          left: k.a.isDown || k.left.isDown,
          right: k.d.isDown || k.right.isDown,
          up: k.w.isDown || k.up.isDown,
          down: k.s.isDown || k.down.isDown,
        });
    this.player.setVelocity(v.x * SPEED, v.y * SPEED);
    this.animatePlayer(v, deltaMs / 1000);

    if (blocking) {
      this.prompt.setVisible(false);
      return;
    }

    const index = pickNearest({ x: this.player.x, y: this.player.y }, this.interactables, REACH);
    const nearest = index === -1 ? undefined : this.interactables[index];
    if (nearest) {
      this.prompt.setText(`E  ${nearest.label}`).setPosition(nearest.x, nearest.promptY).setVisible(true);
      if (interactPressed) nearest.use();
    } else {
      this.prompt.setVisible(false);
    }
  }

  private animatePlayer(v: { x: number; y: number }, seconds: number): void {
    const moving = v.x !== 0 || v.y !== 0;
    this.facing = facingFor(v, this.facing);
    this.walkTime = moving ? this.walkTime + seconds : 0;
    const pose = moving ? 1 + (Math.floor(this.walkTime / STEP_SECONDS) % 2) : 0;
    this.player.setTexture(`player_${this.facing}_${pose}`);
    this.player.setDepth(this.player.y);
    this.playerShadow.setPosition(this.player.x, this.player.y);
    this.torch.setPosition(this.player.x, this.player.y - 14);
  }

  // --- Building the courtyard --------------------------------------------

  /** Places a prop with its base on the ground at (x, baseY). Lower props draw in front. */
  private prop(key: string, x: number, baseY: number, opts: PropOptions = {}): Phaser.GameObjects.Image {
    if (opts.shadow) this.add.image(x, baseY, opts.shadow).setOrigin(0.5, 0.65).setDepth(-5000);
    const image = this.add.image(x, baseY, key).setOrigin(0.5, 1).setDepth(baseY).setLighting(true);
    if (opts.block) {
      const [w, h] = opts.block;
      this.block(x, baseY - h / 2 - (opts.blockLift ?? 0), w, h);
    }
    return image;
  }

  private block(cx: number, cy: number, w: number, h: number): void {
    const zone = this.add.zone(cx, cy, w, h);
    this.physics.add.existing(zone, true);
    this.blockers.push(zone);
  }

  private lamp(x: number, baseY: number): void {
    this.prop('lamp', x, baseY, { block: [6, 4], shadow: 'shadow_small' });
    this.lights.addLight(x, baseY - 44, 95, LAMP_LIGHT, 3.2, 34);
  }

  private buildCourtyard(): void {
    this.add.image(0, 0, 'ground').setOrigin(0).setDepth(-10000).setLighting(true);

    // Faculty building along the top, with light spilling from the lit windows and the door.
    this.add.image(0, 0, 'building').setOrigin(0).setDepth(BUILDING_H).setLighting(true);
    this.block(MAP_W / 2, (BUILDING_H - 2) / 2, MAP_W, BUILDING_H - 2);
    for (const bay of LIT_WINDOWS) this.lights.addLight(WINDOW_BAY_X(bay), BUILDING_H + 6, 85, 0xffc070, 2.6, 30);
    this.lights.addLight(DOOR_X, BUILDING_H - 30, 70, 0xffcf8a, 1.6, 30);
    this.interactables.push({
      x: DOOR_X,
      y: BUILDING_H + 4,
      label: 'Try the door',
      promptY: BUILDING_H - 12,
      use: () => this.overlays.toast('Locked. Security sealed the building for the night.'),
    });

    // Hedges on the flower beds, leaving the door path clear.
    for (let x = 34; x <= 330; x += 30) this.prop(x % 60 === 4 ? 'bush_1' : 'bush_0', x, BUILDING_H + 26, { block: [28, 6] });
    for (let x = 440; x <= 740; x += 30) this.prop(x % 60 === 20 ? 'bush_1' : 'bush_0', x, BUILDING_H + 26, { block: [28, 6] });

    // Fountain in the middle of the plaza.
    this.prop('fountain', PLAZA.x, PLAZA.y + 38, { block: [108, 50], blockLift: 6 });

    // Rain trees around the edges.
    const trees: Array<[number, number, number]> = [
      [52, 196, 0], [150, 222, 1], [40, 388, 2], [124, 470, 0], [48, 540, 1],
      [716, 192, 1], [624, 224, 2], [736, 392, 0], [650, 484, 1], [730, 540, 2],
      [250, 520, 2], [520, 534, 0],
    ];
    for (const [x, y, variant] of trees) this.prop(`tree_${variant}`, x, y, { block: [12, 6], shadow: 'shadow_big' });

    // Lamp posts and benches.
    this.lamp(338, 198);
    this.lamp(430, 198);
    this.lamp(222, 282);
    this.lamp(590, 300);
    this.lamp(430, 468);
    this.prop('bench', 284, 282, { block: [34, 6] });
    this.prop('bench', 560, 452, { block: [34, 6] });
  }

  private buildCrimeScene(): void {
    this.prop('tape', 512, 352, { block: [100, 34], blockLift: 2 });
    this.prop('briefcase', 534, 340);
    this.prop('tumbler', 500, 334);
    this.prop('marker_1', 486, 332);
    this.prop('marker_2', 542, 324);
  }

  private addNpc(npc: NpcSpec): void {
    const person = PEOPLE.find((p) => p.id === npc.id);
    // "Farah", "Daniel", "Dr. Priya": short enough for the prompt.
    const name = person?.name ?? npc.id;
    const shortName = name.startsWith('Dr. ') ? name.split(' ').slice(0, 2).join(' ') : name.split(' ')[0];
    this.add.image(npc.x, npc.y, 'shadow_small').setOrigin(0.5, 0.65).setDepth(-5000);
    const sprite = this.prop(`${npc.id}_${npc.facing}_0`, npc.x, npc.y, { block: [10, 6] });
    this.interactables.push({
      x: npc.x,
      y: npc.y,
      label: `Talk to ${shortName}`,
      promptY: npc.y - 28,
      use: () => {
        // Turn to face the player while talking.
        const facing = facingFor({ x: this.player.x - npc.x, y: this.player.y - npc.y }, npc.facing);
        sprite.setTexture(`${npc.id}_${facing}_0`);
        this.overlays.openDialogue(npc.startNode);
      },
    });
  }

  private addFloorClue(placed: FloorClue): void {
    const clue = CLUES[placed.clueId];
    const { x, y } = placed;
    const image = this.prop(placed.sprite, x, y);
    image.setDepth(y + 1);
    const glint = this.lights.addLight(x, y - 6, 26, 0xfff0c0, 2.5, 8);
    const interactable: Interactable = {
      x,
      y,
      label: 'Pick up',
      promptY: y - 10,
      use: () => {
        this.state.pickUp(clue);
        this.overlays.toast(`New clue: ${clue.name}`);
        image.destroy();
        this.lights.removeLight(glint);
        this.interactables = this.interactables.filter((i) => i !== interactable);
      },
    };
    this.interactables.push(interactable);
  }

  private buildPlayer(x: number, y: number): void {
    this.playerShadow = this.add.image(x, y, 'shadow_small').setOrigin(0.5, 0.65).setDepth(-5000);
    this.player = this.physics.add.image(x, y, 'player_up_0').setOrigin(0.5, 1).setLighting(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 6).setOffset(3, 20);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.blockers);
    // A faint phone torch so the player never vanishes in the dark.
    this.torch = this.lights.addLight(x, y - 14, 60, 0xd6dcff, 1.2, 24);
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
