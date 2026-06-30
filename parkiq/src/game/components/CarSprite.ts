import Phaser from 'phaser';

/** Grid-unit constants from knowledge.md */
const UNIT_PX = 48;
const CAR_WIDTH = 2 * UNIT_PX; // 96
const CAR_LENGTH = 4 * UNIT_PX; // 192
const CORNER_RADIUS = 8;
const WINDOW_INSET = 8;
const WINDOW_HEIGHT = 40;

/** Body colours from knowledge.md COLORS constant */
const PLAYER_BODY = 0xe8320a;
const OBSTACLE_BODY = 0x6b7280;

/** Windscreen — roughly 80% brightness of the body colour */
const PLAYER_WINDOW = 0xc02808;
const OBSTACLE_WINDOW = 0x565b66;

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
 * Creates a top-down car shape using Phaser Graphics.
 * The car is drawn as a rounded rectangle with a darker windscreen strip.
 * Position and rotation use grid coordinates and degrees.
 */
export function createCarSprite(
  scene: Phaser.Scene,
  config: CarConfig,
): Phaser.GameObjects.Graphics {
  const bodyColor =
    config.type === 'player' ? PLAYER_BODY : OBSTACLE_BODY;
  const windowColor =
    config.type === 'player' ? PLAYER_WINDOW : OBSTACLE_WINDOW;

  // Debug log — remove after visual verification
  // eslint-disable-next-line no-console
  console.log(
    `[CarSprite] type=${config.type} bodyColor=0x${bodyColor.toString(16)} pixelPos=(${config.x * UNIT_PX}, ${config.y * UNIT_PX}) angle=${config.angle}`,
  );

  const graphics = scene.add.graphics();
  const halfW = CAR_WIDTH / 2;
  const halfL = CAR_LENGTH / 2;

  // --- Car body (rounded rect, centred at 0,0) ---
  graphics.fillStyle(bodyColor, 1);
  graphics.fillRoundedRect(-halfW, -halfL, CAR_WIDTH, CAR_LENGTH, CORNER_RADIUS);

  // --- Windscreen (darker rect at the front / top) ---
  graphics.fillStyle(windowColor, 1);
  graphics.fillRect(
    -halfW + WINDOW_INSET,
    -halfL + WINDOW_INSET,
    CAR_WIDTH - WINDOW_INSET * 2,
    WINDOW_HEIGHT,
  );

  // --- Position & rotate ---
  graphics.setPosition(config.x * UNIT_PX, config.y * UNIT_PX);
  graphics.setAngle(config.angle);

  return graphics;
}
