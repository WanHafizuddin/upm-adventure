// Phaser 4.2.1's Shape includes the Lighting component at runtime
// (node_modules/phaser/src/gameobjects/shape/Shape.js), but its type file leaves it out.
// This tells TypeScript about it, so placeholder rectangles can call setLighting(true).
declare namespace Phaser.GameObjects {
  interface Shape extends Phaser.GameObjects.Components.Lighting {}
}
