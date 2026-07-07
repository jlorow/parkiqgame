import { GameObjects, Scene } from 'phaser';
import type { PuzzleTheme } from '../puzzles/puzzle-types';

/**
 * ParkingGrid — owns the gameplay surface only.
 *
 * Responsibilities:
 *  - Road surface fill
 *  - Bay lines / stall dividers / centreline
 *  - Curb border
 *
 * Does NOT own:
 *  - Theme decorations (trees, pipes, building silhouettes) → ThemeRenderer
 *  - Pillars drawn as gameplay obstacles → PuzzleScene
 *  - Cars, shadows, exit zone, UI
 */
export interface ParkingGridConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  environment: 'street' | 'garage' | 'open_lot';
  theme: PuzzleTheme;
}

type ThemeColors = {
  road: number;
  lines: number;
  pillar: number;
  pillarOutline: number;
  sidewalk: number;
};

const THEME_COLORS: Record<PuzzleTheme, ThemeColors> = {
  street:       { road: 0x1c1c1e, lines: 0xffffff, pillar: 0x1f2937, pillarOutline: 0x374151, sidewalk: 0x2a2a2d },
  garage:       { road: 0x111827, lines: 0xfbbf24, pillar: 0x374151, pillarOutline: 0x4b5563, sidewalk: 0x1a2332 },
  rooftop:      { road: 0xd1d5db, lines: 0xffffff, pillar: 0x9ca3af, pillarOutline: 0xb0b5bd, sidewalk: 0xbcc0c7 },
  underground:  { road: 0x0f172a, lines: 0xe8320a, pillar: 0x1e293b, pillarOutline: 0x334155, sidewalk: 0x131d33 },
};

/**
 * Creates the parking surface and bay lines.
 *
 * CRITICAL: Graphics positioned at (x, y) — all draw calls use LOCAL coords (0,0).
 * Never mix absolute scene coordinates with local draw calls.
 */
export function createParkingGrid(
  scene: Scene,
  config: ParkingGridConfig,
): GameObjects.Graphics {
  const { x, y, width, height, environment, theme } = config;
  const colors = THEME_COLORS[theme]!;

  const graphics = scene.add.graphics({ x, y });

  // 1. Road surface — transparent so the theme-tinted card and backdrop show through
  graphics.fillStyle(colors.road, 0.20);
  graphics.fillRect(0, 0, width, height);

  // 2. Layout lines
  switch (environment) {
    case 'street':
      drawStreetLayout(graphics, width, height, colors);
      break;
    case 'garage':
      drawGarageLayout(graphics, width, height, colors);
      break;
    case 'open_lot':
      drawOpenLotLayout(graphics, width, height, colors);
      break;
  }

  // 3. Curb border
  graphics.lineStyle(2, colors.sidewalk, 0.6);
  graphics.strokeRect(0, 0, width, height);

  return graphics;
}

// ── Layout functions ────────────────────────────────────────

function drawStreetLayout(
  gfx: GameObjects.Graphics,
  width: number,
  height: number,
  colors: ThemeColors,
): void {
  const unitPx = 48;
  const laneTopY = 96;
  const laneBottomY = 192;
  const centrelineY = 144;

  gfx.lineStyle(2, colors.lines, 0.85);
  gfx.beginPath();
  gfx.moveTo(0, laneTopY);
  gfx.lineTo(width, laneTopY);
  gfx.moveTo(0, laneBottomY);
  gfx.lineTo(width, laneBottomY);
  gfx.strokePath();

  gfx.lineStyle(2, colors.lines, 0.85);
  gfx.beginPath();
  for (let lineX = unitPx; lineX < width; lineX += unitPx) {
    gfx.moveTo(lineX, 0);
    gfx.lineTo(lineX, laneTopY);
    gfx.moveTo(lineX, laneBottomY);
    gfx.lineTo(lineX, height);
  }
  gfx.strokePath();

  // Dashed centreline
  gfx.lineStyle(1, colors.lines, 0.35);
  gfx.beginPath();
  const dashLen = 12;
  const gapLen = 12;
  const step = dashLen + gapLen;
  for (let cx = 0; cx < width; cx += step) {
    gfx.moveTo(cx, centrelineY);
    gfx.lineTo(Math.min(cx + dashLen, width), centrelineY);
  }
  gfx.strokePath();

  // Cosmetic half-unit lines
  gfx.lineStyle(1, colors.lines, 0.15);
  gfx.beginPath();
  const halfPx = unitPx / 2;
  for (let lineX = halfPx; lineX < width; lineX += unitPx) {
    gfx.moveTo(lineX, 0);
    gfx.lineTo(lineX, laneTopY);
    gfx.moveTo(lineX, laneBottomY);
    gfx.lineTo(lineX, height);
  }
  gfx.strokePath();
}

function drawGarageLayout(
  gfx: GameObjects.Graphics,
  width: number,
  height: number,
  colors: ThemeColors,
): void {
  const unitPx = 48;

  gfx.lineStyle(2, colors.lines, 0.85);
  gfx.beginPath();
  for (let lineX = unitPx; lineX < width; lineX += unitPx) {
    gfx.moveTo(lineX, 0);
    gfx.lineTo(lineX, height);
  }
  gfx.strokePath();

  const pillarW = 24;
  const pillarH = 48;
  const leftPillarX = width * 0.25 - pillarW / 2;
  const rightPillarX = width * 0.75 - pillarW / 2;
  const pillarY = (height - pillarH) / 2;

  gfx.fillStyle(colors.pillar, 1);
  gfx.fillRect(leftPillarX, pillarY, pillarW, pillarH);
  gfx.fillRect(rightPillarX, pillarY, pillarW, pillarH);

  gfx.lineStyle(2, colors.pillarOutline, 1);
  gfx.strokeRect(leftPillarX, pillarY, pillarW, pillarH);
  gfx.strokeRect(rightPillarX, pillarY, pillarW, pillarH);

  gfx.lineStyle(1, colors.lines, 0.15);
  gfx.beginPath();
  const halfPx = unitPx / 2;
  for (let lineX = halfPx; lineX < width; lineX += unitPx) {
    gfx.moveTo(lineX, 0);
    gfx.lineTo(lineX, height);
  }
  gfx.strokePath();
}

function drawOpenLotLayout(
  gfx: GameObjects.Graphics,
  width: number,
  height: number,
  colors: ThemeColors,
): void {
  const unitPx = 48;

  gfx.lineStyle(2, colors.lines, 0.85);
  gfx.beginPath();
  for (let lineY = unitPx; lineY < height; lineY += unitPx) {
    gfx.moveTo(0, lineY);
    gfx.lineTo(width, lineY);
  }
  gfx.strokePath();

  gfx.lineStyle(1, colors.lines, 0.15);
  gfx.beginPath();
  const halfPx = unitPx / 2;
  for (let lineY = halfPx; lineY < height; lineY += unitPx) {
    gfx.moveTo(0, lineY);
    gfx.lineTo(width, lineY);
  }
  gfx.strokePath();
}

/**
 * Optional: bake the grid into a static GPU texture for performance.
 */
export function getOrCreateBakedGrid(
  scene: Scene,
  config: ParkingGridConfig,
): GameObjects.Image {
  const key = `baked_grid_${config.theme}_${config.environment}_${config.width}x${config.height}`;

  if (!scene.textures.exists(key)) {
    const vectorGrid = createParkingGrid(scene, config);
    vectorGrid.generateTexture(key, config.width, config.height);
    vectorGrid.destroy();
  }

  return scene.add.image(config.x, config.y, key).setOrigin(0, 0);
}
