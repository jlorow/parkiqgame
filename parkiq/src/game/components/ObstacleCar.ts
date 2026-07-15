import Phaser from 'phaser';
import { createCarSprite } from './CarSprite';

/**
 * Thin wrapper around CarSprite with `type` forced to `'obstacle'`.
 * Accepts the same position / angle parameters without needing to
 * pass the type field explicitly.
 */
export function createObstacleCar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  angle = 0,
): Phaser.GameObjects.Image {
  return createCarSprite(scene, { x, y, angle, type: 'obstacle' });
}
