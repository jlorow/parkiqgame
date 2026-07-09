import Phaser from 'phaser';

import { THEME_FLAT_COLORS } from '../config/ThemeRegistry';

/** Grid-unit constants from knowledge.md */
const UNIT_PX = 48;

/**
 * Tint colours sourced from ThemeRegistry.
 * obstacleCarTint is flagged as "not yet updated" — keep original value for now.
 */
const PLAYER_TINT = THEME_FLAT_COLORS.playerCarTint;
const OBSTACLE_TINT = THEME_FLAT_COLORS.obstacleCarTint;

/** Baked texture keys — one per type (different tints) */
const TEX_PLAYER = 'car-tex-player';
const TEX_OBSTACLE = 'car-tex-obstacle';

/** Bauhaus car body dimensions */
const CAR_W = 48;
const CAR_H = 96;

/** Texture size (wider/taller to accommodate protruding wheels and mirrors) */
const TEX_W = 56;
const TEX_H = 100;
/** Offsets to map centered coords (-24..24, -48..48) into texture space */
const OX = 28;
const OY = 50;

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

// ── Helpers ─────────────────────────────────────────────────────────

/** Returns a darkened copy of a hex colour by multiplying each channel. */
function darkenColor(color: number, factor: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * factor);
  const g = Math.floor(((color >> 8) & 0xff) * factor);
  const b = Math.floor((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

// ── Texture generation ──────────────────────────────────────────────

/**
 * Generates a baked 56x100 texture for one car type if it does not
 * already exist.  Draws the full Bauhaus car stack:
 *   1. Wheels & mirrors        (under-layer)
 *   2. Chassis, lights         (mid-layer)
 *   3. Glass cabin, roof panel (top-layer)
 */
function ensureCarTexture(scene: Phaser.Scene, type: 'player' | 'obstacle'): string {
  const key = type === 'player' ? TEX_PLAYER : TEX_OBSTACLE;
  if (scene.textures.exists(key)) return key;

  const tint = type === 'player' ? PLAYER_TINT : OBSTACLE_TINT;
  const gfx = scene.add.graphics();

  // ── 1. Under-Layer: Wheels & Mirrors ──────────────────────────────

  // Wheels — dark grey, peek out of chassis sides
  gfx.fillStyle(0x1a1a1a, 1);
  gfx.fillRoundedRect(-26 + OX, -36 + OY, 4, 16, 2);   // front left
  gfx.fillRoundedRect(22 + OX, -36 + OY, 4, 16, 2);     // front right
  gfx.fillRoundedRect(-26 + OX, 20 + OY, 4, 16, 2);     // rear left
  gfx.fillRoundedRect(22 + OX, 20 + OY, 4, 16, 2);      // rear right

  // Side mirrors — body-coloured tabs near front windshield line
  gfx.fillStyle(tint, 1);
  gfx.fillRoundedRect(-28 + OX, -20 + OY, 5, 4, 1);     // left mirror
  gfx.fillRoundedRect(23 + OX, -20 + OY, 5, 4, 1);      // right mirror

  // ── 2. Mid-Layer: Main Chassis & Lights ───────────────────────────

  // Main body
  gfx.fillStyle(tint, 1);
  gfx.fillRoundedRect(-24 + OX, -48 + OY, CAR_W, CAR_H, 10);
  gfx.lineStyle(2, 0x000000, 0.25);
  gfx.strokeRoundedRect(-24 + OX, -48 + OY, CAR_W, CAR_H, 10);

  // Headlights — warm white at front edge
  gfx.fillStyle(0xfff9e6, 1);
  gfx.fillRoundedRect(-18 + OX, -46 + OY, 8, 4, 1);     // left
  gfx.fillRoundedRect(10 + OX, -46 + OY, 8, 4, 1);      // right

  // Taillights — deep red at rear corners
  gfx.fillStyle(0xff3b30, 1);
  gfx.fillRoundedRect(-18 + OX, 44 + OY, 8, 3, 1);      // left
  gfx.fillRoundedRect(10 + OX, 44 + OY, 8, 3, 1);       // right

  // ── 3. Top-Layer: Glass Cabin (The "Greenhouse") ──────────────────

  // Black window mask — full canopy profile
  gfx.fillStyle(0x111111, 1);
  gfx.fillRoundedRect(-18 + OX, -24 + OY, 36, 48, 6);

  // Roof panel — slightly darker body colour on top of glass
  // Leaves exposed: front windshield (10px), rear window (8px),
  // and narrow side windows (2px each side).
  gfx.fillStyle(darkenColor(tint, 0.7), 1);
  gfx.fillRoundedRect(-16 + OX, -14 + OY, 32, 30, 4);

  // Hood definition line — separates engine bay from cabin
  gfx.lineStyle(1, 0x000000, 0.15);
  gfx.beginPath();
  gfx.moveTo(-24 + OX, -28 + OY);
  gfx.lineTo(24 + OX, -28 + OY);
  gfx.strokePath();

  // ── 4. Bake ───────────────────────────────────────────────────────

  gfx.generateTexture(key, TEX_W, TEX_H);
  gfx.destroy();

  return key;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Creates a car sprite from a pre-baked 56x100 texture.
 * The texture is generated once per type (player / obstacle) and
 * reused for all instances.  Position and rotation use grid
 * coordinates and degrees.
 */
export function createCarSprite(
  scene: Phaser.Scene,
  config: CarConfig,
): Phaser.GameObjects.Image {
  const key = ensureCarTexture(scene, config.type);

  const image = scene.add.image(
    config.x * UNIT_PX,
    config.y * UNIT_PX,
    key,
  );
  image.setAngle(config.angle);

  return image;
}
