import { GameObjects, Scene } from 'phaser';

/**
 * Structural configuration for generating the top-down parking grid card.
 */
export interface ParkingGridConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  environment: 'street' | 'garage' | 'open_lot';
}

/**
 * Renders an optimized top-down orthogonal parking grid using vector paths.
 *
 * CRITICAL: The graphics object is positioned at (x, y) via scene.add.graphics({ x, y }).
 * All internal draw calls use LOCAL coordinates (0,0) → (width, height).
 * Never mix absolute scene coordinates with local draw calls — this causes
 * the "double-translation" bug where geometry renders outside the viewport.
 */
export function createParkingGrid(
  scene: Scene,
  config: ParkingGridConfig
): GameObjects.Graphics {
  const { x, y, width, height, environment } = config;

  // Position at (x,y) — all drawing below uses local coords (0,0)
  const graphics = scene.add.graphics({ x, y });

  // 1. Asphalt road surface — always first (bottom layer)
  graphics.fillStyle(0x1c1c1e, 1);
  graphics.fillRect(0, 0, width, height);

  // 2. Environment-specific elements
  switch (environment) {
    case 'street':
      drawStreetLayout(graphics, width, height);
      break;
    case 'garage':
      drawGarageLayout(graphics, width, height);
      break;
    case 'open_lot':
      drawOpenLotLayout(graphics, width, height);
      break;
  }

  return graphics;
}

/**
 * Street layout: centre driving lane flanked by top and bottom parking stalls.
 * Horizontal border lines at y=96 and y=192 divide stalls from lane.
 * Vertical stall lines every 48px, split to avoid crossing the lane.
 * Dashed centreline at y=144.
 */
function drawStreetLayout(
  gfx: GameObjects.Graphics,
  width: number,
  height: number
): void {
  const unitPx = 48;
  const laneTopY = 96;
  const laneBottomY = 192;
  const centrelineY = 144;

  // Horizontal lane border lines
  gfx.lineStyle(2, 0xffffff, 1);
  gfx.beginPath();
  gfx.moveTo(0, laneTopY);
  gfx.lineTo(width, laneTopY);
  gfx.moveTo(0, laneBottomY);
  gfx.lineTo(width, laneBottomY);
  gfx.strokePath();

  // Vertical stall lines — skip boundary (start at unitPx, stop before width)
  gfx.lineStyle(2, 0xffffff, 1);
  gfx.beginPath();
  for (let lineX = unitPx; lineX < width; lineX += unitPx) {
    gfx.moveTo(lineX, 0);
    gfx.lineTo(lineX, laneTopY);
    gfx.moveTo(lineX, laneBottomY);
    gfx.lineTo(lineX, height);
  }
  gfx.strokePath();

  // Dashed centreline
  gfx.lineStyle(1, 0xffffff, 0.4);
  gfx.beginPath();
  const dashLen = 12;
  const gapLen = 12;
  const step = dashLen + gapLen;
  for (let cx = 0; cx < width; cx += step) {
    gfx.moveTo(cx, centrelineY);
    gfx.lineTo(Math.min(cx + dashLen, width), centrelineY);
  }
  gfx.strokePath();
}

/**
 * Garage layout: full-height vertical stall lines + 2 structural pillars.
 * Pillars centred at 25% and 75% of width, sitting between bay lines.
 * Pillar dimensions: 24px wide × 48px tall, vertically centred.
 */
function drawGarageLayout(
  gfx: GameObjects.Graphics,
  width: number,
  height: number
): void {
  const unitPx = 48;

  // Vertical stall lines — internal only (start at unitPx, stop before width)
  gfx.lineStyle(2, 0xffffff, 1);
  gfx.beginPath();
  for (let lineX = unitPx; lineX < width; lineX += unitPx) {
    gfx.moveTo(lineX, 0);
    gfx.lineTo(lineX, height);
  }
  gfx.strokePath();

  // Pillars — drawn AFTER lines so they render on top
  // Width=24px sits cleanly between bay lines (12px clearance each side)
  // Height=48px, vertically centred
  const pillarW = 24;
  const pillarH = 48;
  const leftPillarX = width * 0.25 - pillarW / 2;  // centre at 72px
  const rightPillarX = width * 0.75 - pillarW / 2; // centre at 216px
  const pillarY = (height - pillarH) / 2;           // vertically centred

  // Fill
  gfx.fillStyle(0x1f2937, 1);
  gfx.fillRect(leftPillarX, pillarY, pillarW, pillarH);
  gfx.fillRect(rightPillarX, pillarY, pillarW, pillarH);

  // Outline border (adds 3D structural depth)
  gfx.lineStyle(2, 0x374151, 1);
  gfx.strokeRect(leftPillarX, pillarY, pillarW, pillarH);
  gfx.strokeRect(rightPillarX, pillarY, pillarW, pillarH);
}

/**
 * Open lot layout: horizontal parking lines spanning full width.
 * Lines at internal intervals only (start at unitPx, stop before height).
 */
function drawOpenLotLayout(
  gfx: GameObjects.Graphics,
  width: number,
  height: number
): void {
  const unitPx = 48;

  gfx.lineStyle(2, 0xffffff, 1);
  gfx.beginPath();
  for (let lineY = unitPx; lineY < height; lineY += unitPx) {
    gfx.moveTo(0, lineY);
    gfx.lineTo(width, lineY);
  }
  gfx.strokePath();
}

/**
 * Optional: bake the grid into a static GPU texture for performance.
 * Use this instead of createParkingGrid() once the grid is visually confirmed
 * correct — reduces rendering overhead to a single batched draw call.
 */
export function getOrCreateBakedGrid(
  scene: Scene,
  config: ParkingGridConfig
): GameObjects.Image {
  const key = `baked_grid_${config.environment}_${config.width}x${config.height}`;

  if (!scene.textures.exists(key)) {
    const vectorGrid = createParkingGrid(scene, config);
    vectorGrid.generateTexture(key, config.width, config.height);
    vectorGrid.destroy();
  }

  return scene.add.image(config.x, config.y, key).setOrigin(0, 0);
}
