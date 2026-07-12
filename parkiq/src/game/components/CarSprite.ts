import Phaser from 'phaser';

/** Grid-unit constants from knowledge.md */
const UNIT_PX = 48;

/** Baked texture keys — player and 5 obstacle variants */
const TEX_PLAYER = 'car-player';

export interface CarConfig {
  /** Grid X position (multiplied by UNIT_PX to get pixel position) */
  x: number;
  /** Grid Y position (multiplied by UNIT_PX to get pixel position) */
  y: number;
  /** Rotation angle in degrees */
  angle: number;
  /** Car variant */
  type: 'player' | 'obstacle';
  /** Optional specific obstacle variant (1-5); random if omitted */
  obstacleVariant?: number;
  /** Override the default player texture (e.g. 'car-limo' for the limousine) */
  textureKey?: string;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Creates a car sprite from a preloaded SVG texture.
 *
 * Player: always uses 'car-player' texture.
 * Obstacle: picks one of 5 preloaded obstacle variants at random
 *           (or uses obstacleVariant if specified).
 *
 * No tint is applied — colors are baked into the SVG assets.
 * Position and rotation use grid coordinates and degrees.
 */
export function createCarSprite(
  scene: Phaser.Scene,
  config: CarConfig,
): Phaser.GameObjects.Image {
  let key: string;

  if (config.type === 'player') {
    key = config.textureKey ?? TEX_PLAYER;
  } else {
    const v = config.obstacleVariant ?? Phaser.Math.Between(1, 5);
    key = `car-obstacle-${v}`;
  }

  const image = scene.add.image(
    config.x * UNIT_PX,
    config.y * UNIT_PX,
    key,
  );
  image.setAngle(config.angle);

  return image;
}
