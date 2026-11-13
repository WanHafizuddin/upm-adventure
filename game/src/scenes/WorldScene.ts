import * as Phaser from 'phaser';
import { signTexture } from '../art/signage';
import { sound } from '../audio/sound';
import { CLUES } from '../data/case';
import { LAST_DAY, daySpec, type Spawn } from '../data/days';
import { LOCATIONS, type ExamineSpot, type ExitSpec, type FloorClue, type LocationSpec, type NpcPlacement } from '../data/locations';
import { availableOn } from '../logic/days';
import type { GameState } from '../logic/gameState';
import { pickNearest } from '../logic/interaction';
import { facingFor, moveVector, type Facing } from '../logic/movement';
import type { Progress } from '../save';
import type { Overlays } from '../ui/overlays';

const SPEED = 85; // pixels per second
const REACH = 24; // how close the player's feet must be to interact
const STEP_SECONDS = 0.16; // time per walking frame
const FADE_MS = 220;

interface Interactable {
  x: number;
  y: number;
  label: string;
  promptY: number;
  use: () => void;
}

export interface PropOptions {
  /** Footprint that blocks walking: width, height (sits on the ground line). */
  block?: [number, number];
  /** Raise the footprint above the ground line by this many pixels. */
  blockLift?: number;
  shadow?: 'shadow_big' | 'shadow_small';
}

export interface WorldSceneData {
  spawn: Spawn;
}

/**
 * Everything every location shares: the player, walking, talking, picking things up, exits and
 * signs. Subclasses only draw their own surroundings in `buildWorld`.
 */
export abstract class WorldScene extends Phaser.Scene {
  protected location!: LocationSpec;
  protected player!: Phaser.Physics.Arcade.Image;
  private spawn!: Spawn;
  private playerShadow!: Phaser.GameObjects.Image;
  private torch!: Phaser.GameObjects.Light;
  private facing: Facing = 'up';
  private walkTime = 0;
  private lastPose = 0;
  private leaving = false;
  private blockers: Phaser.GameObjects.Zone[] = [];
  private interactables: Interactable[] = [];
  private prompt!: Phaser.GameObjects.Text;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(
    key: string,
    protected readonly state: GameState,
    protected readonly overlays: Overlays,
    private readonly progress: Progress,
  ) {
    super(key);
  }

  /** Draws the surroundings and returns the size of the walkable world. */
  protected abstract buildWorld(): { w: number; h: number };

  init(data: WorldSceneData): void {
    this.spawn = data.spawn;
    this.location = LOCATIONS[data.spawn.location];
    this.facing = data.spawn.facing;
    this.walkTime = 0;
    this.leaving = false;
    this.blockers = [];
    this.interactables = [];
  }

  create(): void {
    this.lights.enable();
    const { w, h } = this.buildWorld();
    this.physics.world.setBounds(0, 0, w, h);

    const day = this.state.day;
    const loc = this.location;
    loc.npcs.filter((n) => availableOn(n, day)).forEach((n) => this.addNpc(n));
    loc.floorClues.filter((c) => availableOn(c, day) && !this.state.inventory.has(c.clueId)).forEach((c) => this.addFloorClue(c));
    loc.examine.filter((e) => availableOn(e, day)).forEach((e) => this.addExamine(e));
    loc.exits.forEach((e) => this.addExit(e));
    for (const sign of loc.signs) {
      const key = signTexture(this, sign.text, sign.post ?? false);
      if (sign.post) this.prop(key, sign.x, sign.y, { block: [4, 3] });
      else this.add.image(sign.x, sign.y, key).setOrigin(0.5, 0).setDepth(-50); // on the back wall
    }

    this.buildPlayer();
    this.prompt = this.add
      .text(0, 0, '', { fontFamily: 'monospace', fontSize: '8px', color: '#ffe7b0', backgroundColor: '#0d0b1acc' })
      .setPadding(3, 1, 3, 1)
      .setOrigin(0.5, 1)
      .setDepth(10000)
      .setVisible(false);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, w, h);
    camera.startFollow(this.player, true, 0.15, 0.15);
    camera.setRoundPixels(true);
    camera.fadeIn(FADE_MS);

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

    sound.setAmbience(loc.scene === 'courtyard' ? 'outdoor' : 'indoor');
    this.overlays.setPlace(loc.name);
    this.progress.arrived(this.spawn, loc.name);
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
    const blocking = this.leaving || this.overlays.isBlocking();

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

  // --- Helpers for subclasses ----------------------------------------------------

  /** Places a prop with its base on the ground at (x, baseY). Lower props draw in front. */
  protected prop(key: string, x: number, baseY: number, opts: PropOptions = {}): Phaser.GameObjects.Image {
    if (opts.shadow) this.add.image(x, baseY, opts.shadow).setOrigin(0.5, 0.65).setDepth(-5000);
    const image = this.add.image(x, baseY, key).setOrigin(0.5, 1).setDepth(baseY).setLighting(true);
    if (opts.block) {
      const [w, h] = opts.block;
      this.block(x, baseY - h / 2 - (opts.blockLift ?? 0), w, h);
    }
    return image;
  }

  /** An invisible box the player can't walk through. */
  protected block(cx: number, cy: number, w: number, h: number): void {
    const zone = this.add.zone(cx, cy, w, h);
    this.physics.add.existing(zone, true);
    this.blockers.push(zone);
  }

  // --- Moving between places and days ----------------------------------------------

  private goTo(spawn: Spawn): void {
    if (this.leaving) return;
    this.leaving = true;
    sound.door();
    this.cameras.main.fadeOut(FADE_MS);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(LOCATIONS[spawn.location].scene, { spawn } satisfies WorldSceneData);
    });
  }

  private tryEndDay(): void {
    if (!this.state.isDayComplete()) {
      this.overlays.toast("Not yet. There's still more to look into today.");
      return;
    }
    if (this.state.day >= LAST_DAY) {
      this.overlays.toast('The case is closed, one way or another. Talk to Inspektor Aziz to try it again.');
      return;
    }
    this.leaving = true;
    this.cameras.main.fadeOut(600);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.state.advanceDay();
      const next = daySpec(this.state.day)!;
      this.overlays.showDayCard(next);
      this.scene.start(LOCATIONS[next.start.location].scene, { spawn: next.start } satisfies WorldSceneData);
    });
  }

  // --- Things in the world -----------------------------------------------------------

  private addNpc(npc: NpcPlacement): void {
    this.add.image(npc.x, npc.y, 'shadow_small').setOrigin(0.5, 0.65).setDepth(-5000);
    const sprite = this.prop(`${npc.id}_${npc.facing}_0`, npc.x, npc.y, { block: [10, 6] });
    const from = npc.talkFrom ?? { x: npc.x, y: npc.y };
    this.interactables.push({
      x: from.x,
      y: from.y,
      label: `Talk to ${npc.label}`,
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
        sound.pickup();
        this.overlays.toast(`New clue: ${clue.name}`);
        image.destroy();
        this.lights.removeLight(glint);
        this.interactables = this.interactables.filter((i) => i !== interactable);
      },
    };
    this.interactables.push(interactable);
  }

  private addExamine(spot: ExamineSpot): void {
    this.interactables.push({
      x: spot.x,
      y: spot.y,
      label: spot.label,
      promptY: spot.y - 30,
      use: () => this.overlays.openDialogue(spot.startNode),
    });
  }

  private addExit(exit: ExitSpec): void {
    const open = availableOn(exit, this.state.day);
    let use: () => void;
    if (!exit.to) use = () => this.tryEndDay();
    else if (open) {
      const to = exit.to;
      use = () => this.goTo(to);
    } else if (exit.closedText) {
      const text = exit.closedText;
      use = () => this.overlays.toast(text);
    } else return;
    this.interactables.push({ x: exit.x, y: exit.y, label: exit.label, promptY: exit.y - 12, use });
  }

  // --- The player ----------------------------------------------------------------------

  private buildPlayer(): void {
    const { x, y } = this.spawn;
    this.playerShadow = this.add.image(x, y, 'shadow_small').setOrigin(0.5, 0.65).setDepth(-5000);
    this.player = this.physics.add.image(x, y, `player_${this.facing}_0`).setOrigin(0.5, 1).setLighting(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 6).setOffset(3, 20);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.blockers);
    // A faint phone torch so the player never vanishes in the dark.
    this.torch = this.lights.addLight(x, y - 14, 60, 0xd6dcff, 1.2, 24);
  }

  private animatePlayer(v: { x: number; y: number }, seconds: number): void {
    const moving = v.x !== 0 || v.y !== 0;
    this.facing = facingFor(v, this.facing);
    this.walkTime = moving ? this.walkTime + seconds : 0;
    const pose = moving ? 1 + (Math.floor(this.walkTime / STEP_SECONDS) % 2) : 0;
    if (pose !== 0 && pose !== this.lastPose) sound.step(this.location.scene === 'courtyard' ? 'outdoor' : 'indoor');
    this.lastPose = pose;
    this.player.setTexture(`player_${this.facing}_${pose}`);
    this.player.setDepth(this.player.y);
    this.playerShadow.setPosition(this.player.x, this.player.y);
    this.torch.setPosition(this.player.x, this.player.y - 14);
  }
}
