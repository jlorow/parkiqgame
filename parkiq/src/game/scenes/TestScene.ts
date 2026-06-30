import Phaser from 'phaser';
import { createCarSprite } from '../components/CarSprite';
import { createObstacleCar } from '../components/ObstacleCar';

/**
 * Temporary test scene for Story 1-2.
 * Renders 1 player car at grid position [3,5] at 15°
 * surrounded by 4 gray obstacle cars with visible gaps.
 *
 * Spacing: 1 grid unit (48px) edge-to-edge between cars.
 * Car is 2 units wide, 4 units long.
 * ─ Horizontally: centers 3 units apart → 1 unit gap (48px)
 * ─ Vertically: centers 5 units apart → 1 unit gap (48px)
 *
 * 🔴 Remove this file after visual approval per story spec.
 */
export class TestScene extends Phaser.Scene {
  constructor() {
    super('TestScene');
  }

  create(): void {
    // --- Player car at [4,3], rotated 15° ---
    createCarSprite(this, {
      x: 4,
      y: 3,
      angle: 15,
      type: 'player',
    });

    // --- 4 obstacle cars at 1-unit-gap distances ---
    // Car is 2 units wide, 4 units long.
    // Horizontal: centers 3 apart → 1 unit gap (48px)
    // Vertical: centers 5 apart → 1 unit gap (48px)
    createObstacleCar(this, 1, 3, 0);  // left
    createObstacleCar(this, 7, 3, 0);  // right
    createObstacleCar(this, 4, -2, 0); // above (partially off-canvas)
    createObstacleCar(this, 4, 8, 0);  // below
  }
}
