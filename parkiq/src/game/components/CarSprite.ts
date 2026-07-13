import Phaser from 'phaser';

/** Baked texture keys — player and 5 obstacle variants */
const TEX_PLAYER = 'car-player';

export interface CarConfig {
  /** Pixel X position (0–288, container-local) */
  x: number;
  /** Pixel Y position (0–288, container-local) */
  y: number;
  /** Rotation angle in degrees */
  angle: number;
  /** Car variant */
  type: 'player' | 'obstacle';
  /** Optional specific obstacle variant (1-5); random if omitted */
  obstacleVariant?: number;
  /** Override the default player texture (e.g. 'car-limo' for the limousine) */
  textureKey?: string | undefined;
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
 * Position uses pixel coordinates (container-local), rotation in degrees.
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

  // x,y are pixel coordinates — no UNIT_PX multiplication
  const image = scene.add.image(config.x, config.y, key);
  image.setAngle(config.angle);

  return image;
}
