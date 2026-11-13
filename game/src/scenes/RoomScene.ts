import { DOOR_W, FURNITURE, WALL_H, roomTexture } from '../art/interiors';
import type { GameState } from '../logic/gameState';
import type { Overlays } from '../ui/overlays';
import { WorldScene } from './WorldScene';

/** Any indoor location: draws the room and its furniture from the location's data. */
export class RoomScene extends WorldScene {
  constructor(state: GameState, overlays: Overlays) {
    super('room', state, overlays);
  }

  protected buildWorld(): { w: number; h: number } {
    const room = this.location.room!;
    const { w, h } = room;
    this.lights.setAmbientColor(room.ambient);

    const key = `room_${this.location.id}`;
    if (!this.textures.exists(key)) roomTexture(room).toTexture(this, key);
    this.add.image(0, 0, key).setOrigin(0).setDepth(-10000).setLighting(true);

    // Walls: the back wall, both sides, and the bottom wall either side of the doorway.
    this.block(w / 2, WALL_H / 2, w, WALL_H);
    this.block(3, h / 2, 6, h);
    this.block(w - 3, h / 2, 6, h);
    const leftW = room.doorX - DOOR_W / 2;
    const rightX = room.doorX + DOOR_W / 2;
    this.block(leftW / 2, h - 4, leftW, 8);
    this.block((rightX + w) / 2, h - 4, w - rightX, 8);

    for (const piece of room.furniture) {
      const spec = FURNITURE[piece.kind];
      const image = this.prop(`f_${piece.kind}`, piece.x, piece.y, spec.block ? { block: spec.block } : {});
      if (spec.wall) image.setDepth(-100); // hangs on the back wall, behind everyone
    }
    for (const l of room.lights) this.lights.addLight(l.x, l.y, l.radius, l.color, l.intensity, 30);

    return { w, h };
  }
}
