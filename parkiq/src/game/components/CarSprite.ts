import Phaser from 'phaser';

/** Grid-unit constants from knowledge.md */
const UNIT_PX = 48;

/** Tint colours from knowledge.md COLORS constant */
const PLAYER_TINT = 0xe8320a;
const OBSTACLE_TINT = 0x6b7280;

export interface CarConfig {
  /** Grid X position (multiplied by UNIT_PX to get pixel position) */
  x: number;
  /** Grid Y position (multiplied by UNIT_PX to get pixel position) */
  y: number;
  /** Rotation angle in degrees */
  angle: number;
  /** Car variant */
  type: 'player' | 'obstacle';
}

/**
 * Creates a car sprite from the shared SVG texture ('car').
 * The SVG is a black silhouette that is tinted to the
 * appropriate colour per type:
 *  - player   → #E8320A (racing red)
 *  - obstacle  → #6B7280 (neutral gray)
 *
 * The SVG texture must be loaded before this is called
 * (e.g. in a scene's preload() via this.load.svg()).
 *
 * Position and rotation use grid coordinates and degrees.
 */
export function createCarSprite(
  scene: Phaser.Scene,
  config: CarConfig,
): Phaser.GameObjects.Image {
  const tint = config.type === 'player' ? PLAYER_TINT : OBSTACLE_TINT;

  const image = scene.add.image(
    config.x * UNIT_PX,
    config.y * UNIT_PX,
    'car',
  );

  // setTint + setTintMode(FILL) replaces pixels entirely (required for a flat black
  // SVG silhouette — setTint alone would multiply black × color = black).
  // In Phaser 4, setTintFill() was removed; the replacement is:
  //   image.setTint(color).setTintMode(Phaser.TintModes.FILL)
  image.setTint(tint).setTintMode(Phaser.TintModes.FILL);
  image.setAngle(config.angle);
  image.setScale(2.25);

  return image;
}
