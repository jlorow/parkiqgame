import Phaser from 'phaser';
import type { Puzzle, PuzzleTheme } from '../puzzles/puzzle-types';
import { createCarSprite } from '../components/CarSprite';
import { createParkingGrid } from '../components/ParkingGrid';
import { createObstacleCar } from '../components/ObstacleCar';
import { DrivingControls } from '../components/DrivingControls';
import type { DrivingInputState } from '../components/DrivingControls';
import { getPuzzleByIndex } from '../../lib/puzzle-engine';
import { puzzleComplete, getProgress } from '../../lib/devvit-client';
import { THEME_FLAT_COLORS } from '../config/ThemeRegistry';

// ──────────────────────────────────────────────────────────
//  Layout Constants
// ──────────────────────────────────────────────────────────

const UNIT_PX = 48;
const SCALE_X = 1.35;
const SCALE_Y = 1.53;
const CONTAINER_X = 1;
const CONTAINER_Y = -30;
const CONTAINER_OFFSET_X = 0.5;
const CONTAINER_OFFSET_Y = 0.5;

// ════════════════════════════════════════════════════════════
//  Developer Testing Flags  —  set true to bypass mechanics
// ════════════════════════════════════════════════════════════

const DEBUG_SKIP_PUZZLE_5 = true;    // Skip puzzle 5 → load puzzle 6
const DEBUG_DISABLE_COLLISIONS = false; // Ignore all collision hitboxes

// ════════════════════════════════════════════════════════════

const HUD_Y = 8;
const PARKIQ_FONT = '20px';
const HUD_MUTED_FONT = '13px';

const OBJECTIVE_Y = 500;

const CARD_Y = CONTAINER_Y - 6;
const GRID_SIZE = 288;

const CARD_H = 704;
const CARD_BOTTOM = CARD_Y + CARD_H;

const CONTROLS_CENTER_X = 195;
const CONTROLS_CENTER_Y = 690;

// ──────────────────────────────────────────────────────────
//  Instruction Panel Constants
//  The panel is sized from the text word-wrap width plus
//  padding, so it adapts if the instruction string or wrap
//  width changes.
// ──────────────────────────────────────────────────────────

const INSTRUCTION_WRAP_WIDTH = 320;   // Word-wrap width for instruction text — also used to size the panel
const INSTRUCTION_PANEL_PAD_X = 16;   // Horizontal padding between text content and panel edge
const INSTRUCTION_PANEL_PAD_Y = 10;   // Vertical padding between text and panel edge
const INSTRUCTION_PANEL_RADIUS = 10;  // Corner radius of the rounded-rect panel

// ──────────────────────────────────────────────────────────
//  Sprite counter-scale — keeps car/obstacle images proportional
//  when container applies non-uniform scale (SCALE_X ≠ SCALE_Y).
// ──────────────────────────────────────────────────────────

const COUNTER_SCALE_Y = SCALE_X / SCALE_Y;

// ──────────────────────────────────────────────────────────
//  Car visual scale — shrinks the sprite so the visual width
//  fits within a single lane (48px) with ~4px margin per side.
//  0.20 ≈ 40 / 200
//  VISUAL_W = 200 × 0.20 = 40px  (≈ 83% of lane width)
//  VISUAL_H = 400 × 0.20 × COUNTER_SCALE_Y ≈ 70.6px
// ──────────────────────────────────────────────────────────

const CAR_VISUAL_SCALE = 0.20;

// ──────────────────────────────────────────────────────────
//  Movement & Collision Constants
// ──────────────────────────────────────────────────────────

const MOVE_SPEED = 120;
const ROTATION_SPEED = 90;
const CAR_W = 36;
const CAR_H = 64;

// Visual display dimensions at CAR_VISUAL_SCALE (container-local)
const VISUAL_W = 200 * CAR_VISUAL_SCALE;
const VISUAL_H = 400 * CAR_VISUAL_SCALE * COUNTER_SCALE_Y;

// Cell centers for each grid edge (container-local coordinates)
const COL0_CENTER = (0 + CONTAINER_OFFSET_X) * UNIT_PX;
const COL5_CENTER = (5 + CONTAINER_OFFSET_X) * UNIT_PX;
const ROW5_CENTER = (5 + CONTAINER_OFFSET_Y) * UNIT_PX;

// Both X and Y clamps are computed dynamically per frame in update()
// using the car's current rotation angle. X keeps the visual ~6px inside
// the grid edge; Y allows ~8px overhang (car nosing out of the bay).

// ──────────────────────────────────────────────────────────
//  Scene
// ──────────────────────────────────────────────────────────

export class PuzzleScene extends Phaser.Scene {
  private puzzle!: Puzzle;
  /** Guard against double-fire of exit-zone win */
  private exited = false;
  /** Themed environment scene — drawn at depth 2, rebuilt on puzzle change */
  private themeEnvGfx: Phaser.GameObjects.Graphics | null = null;
  /** Silent elapsed-time counter — no UI, only used for timeTaken in puzzleComplete() */
  private elapsedSeconds = 0;
  private elapsedEvent!: Phaser.Time.TimerEvent;
  /** Spawn position for resetting the car on collision */
  private spawnX = 0;
  private spawnY = 0;
  private spawnAngle = 0;

  /** Player car — baked texture image inside the parking container */
  private playerCarImage!: Phaser.GameObjects.Image;
  private carX = 0;
  private carY = 0;
  private carAngle = 0;

  /** Driving input pad */
  private drivingControls!: DrivingControls;

  /** HUD puzzle-number text — updated when next puzzle loads in place */
  private puzzleNumberText!: Phaser.GameObjects.Text;

  /** Parking container — rebuilt when next puzzle loads in place */
  private parkingContainer!: Phaser.GameObjects.Container;
  /** True once loadAndRender() has completed — guards update() against async race */
  private ready = false;
  /** Red flash overlay triggered on collision — fades out via tween */
  private collisionFlash!: Phaser.GameObjects.Graphics;
  /** Collision cooldown: next time (ms) at which crunch sound may fire again */
  private collisionCooldownUntil = 0;
  /** True on the frame after reset — prevents same-frame exit-check false win */
  private skipExitCheck = false;
  /** Collision cooldown: next time (ms) at which crunch sound may fire again */
  private collisionCooldownUntil = 0;
  /** True on the frame after reset — prevents same-frame exit-check false win */
  private skipExitCheck = false;

  private get webAudio(): Phaser.Sound.WebAudioSoundManager {
    return this.sound as Phaser.Sound.WebAudioSoundManager;
  }

  constructor() {
    super('PuzzleScene');
  }

  preload(): void {
    this.load.audio('crunch', 'assets/sounds/crunch.mp3');
    this.load.audio('success', 'assets/sounds/success.mp3');

    // ── Car SVGs ──────────────────────────────────────────────────
    this.load.svg('car-player', 'assets/sprites/cars/Car-Player.svg', { width: 200, height: 400 });
    this.load.svg('car-obstacle-1', 'assets/sprites/cars/Car-obstacle-01.svg', { width: 200, height: 400 });
    this.load.svg('car-obstacle-2', 'assets/sprites/cars/Car-obstacle-02.svg', { width: 200, height: 400 });
    this.load.svg('car-obstacle-3', 'assets/sprites/cars/Car-obstacle-03.svg', { width: 200, height: 400 });
    this.load.svg('car-obstacle-4', 'assets/sprites/cars/Car-obstacle-04.svg', { width: 200, height: 400 });
    this.load.svg('car-obstacle-5', 'assets/sprites/cars/Car-obstacle-05.svg', { width: 200, height: 400 });

    // ── Road tile SVGs (full 288×288 grid surface per theme) ──────
    this.load.svg('road-street',       'assets/sprites/roads/Road-Street.svg',       { width: 780, height: 780 });
    this.load.svg('road-garage',       'assets/sprites/roads/Road-Garage.svg',       { width: 780, height: 780 });
    this.load.svg('road-underground',  'assets/sprites/roads/Road-Underground.svg',  { width: 780, height: 780 });
    this.load.svg('road-rooftop',      'assets/sprites/roads/Road-Rooftop.svg',      { width: 780, height: 780 });

    // ── Prop SVGs ─────────────────────────────────────────────────
    this.load.svg('prop-tree',       'assets/sprites/props/Prop-Tree.svg',       { width: 64, height: 64 });
    this.load.svg('prop-shrub-1',    'assets/sprites/props/Prop-Shrub-1.svg',    { width: 48, height: 48 });
    this.load.svg('prop-shrub-2',    'assets/sprites/props/Prop-Shrub-2.svg',    { width: 48, height: 48 });
    this.load.svg('prop-lamppost',   'assets/sprites/props/Prop-Lamppost.svg',   { width: 32, height: 128 });
    this.load.svg('prop-cone',       'assets/sprites/props/Prop-Cone.svg',       { width: 32, height: 48 });
    this.load.svg('prop-barricade-1','assets/sprites/props/Prop-Barricade-1.svg',{ width: 64, height: 48 });
    this.load.svg('prop-barricade-2','assets/sprites/props/Prop-Barricade-2.svg',{ width: 64, height: 48 });
  }

  create(): void {
    this.exited = false;
    this.ready = false;
    this.elapsedSeconds = 0;

    this.input.once('pointerdown', () => {
      void this.webAudio.context.resume();
    });

    this.renderDefaultBackground();
    this.renderControlSurface();
    this.createCollisionFlash();

    // Puzzle loads asynchronously — render static chrome first, then fetch progress
    void this.loadAndRender();
  }

  // ──────────────────────────────────────────────────────────
  //  Index-based puzzle loading (Step 1)
  // ──────────────────────────────────────────────────────────

  private async loadAndRender(): Promise<void> {
    let { puzzleIndex } = await getProgress();

    if (DEBUG_SKIP_PUZZLE_5 && puzzleIndex === 5) {
      puzzleIndex = 6;
    }

    this.puzzle = getPuzzleByIndex(puzzleIndex);

    this.renderEnvironment();
    this.renderHUD();
    this.renderObjective();
    this.renderControls();
    this.renderParkingScene();

    this.startElapsedTimer();
    this.ready = true;

    this.events.once('shutdown', () => {
      this.playerCarImage.destroy();
    });
  }

  // ──────────────────────────────────────────────────────────
  //  Silent elapsed-time counter (Step 2)
  //  No UI, no expiry — only provides timeTaken for puzzleComplete().
  // ──────────────────────────────────────────────────────────

  private startElapsedTimer(): void {
    if (this.elapsedEvent) this.elapsedEvent.destroy();
    this.elapsedSeconds = 0;
    this.elapsedEvent = this.time.addEvent({
      delay: 1000,
      callback: () => { this.elapsedSeconds += 1; },
      loop: true,
    });
  }

  // ──────────────────────────────────────────────────────────
  //  Default Background (fallback drawn before theme is known)
  // ──────────────────────────────────────────────────────────

  private renderDefaultBackground(): void {
    const W = 390;
    const H = 844;
    const steps = 32;
    const stepH = Math.ceil(H / steps);

    const bg = this.add.graphics();
    bg.setDepth(0);

    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const c = Math.floor(0x0f + (0x1a - 0x0f) * t);
      const color = (c << 16) | (c << 8) | c;
      bg.fillStyle(color, 1);
      bg.fillRect(0, i * stepH, W, stepH);
    }

    const vig = this.add.graphics();
    vig.setDepth(1);
    vig.fillStyle(0x000000, 0.25);
    vig.fillRect(0, 0, W, 18);
    vig.fillRect(0, H - 18, W, 18);
    vig.fillRect(0, 0, 10, H);
    vig.fillRect(W - 10, 0, 10, H);
  }

  // ──────────────────────────────────────────────────────────
  //  Neutral Control Surface
  //  Theme-independent UI panel below the playfield.
  //  Covers from container bottom (~411) to canvas floor (844),
  //  at depth 3 — above theme backdrop (2) but below container (5)
  //  and controls (9–11). Eliminates the visible seam between
  //  the default gradient (depth 0) and the theme ground surface
  //  (depth 2) in the control region while keeping theme colours
  //  out of the UI area.
  // ──────────────────────────────────────────────────────────

  private renderControlSurface(): void {
    const panel = this.add.graphics();
    panel.setDepth(3);
    // Derive position from existing layout constants so the panel
    // stays aligned if CONTAINER_Y, GRID_SIZE, SCALE_Y, or canvas
    // dimensions are adjusted later.
    const containerBottom = CONTAINER_Y + GRID_SIZE * SCALE_Y;
    panel.fillStyle(0x141414, 1);
    panel.fillRect(0, containerBottom, this.scale.width, this.scale.height - containerBottom);
  }

  // ──────────────────────────────────────────────────────────
  //  Themed Environment Scene (STEP A — full-screen backdrop)
  //  Called after puzzle loads so theme is known.
  //  Draws at depth 2 — between vignette (1) and control surface (3).
  // ──────────────────────────────────────────────────────────

  private renderEnvironment(): void {
    // Destroy previous environment if exists (for puzzle-to-puzzle transitions)
    if (this.themeEnvGfx) {
      this.themeEnvGfx.destroy();
    }

    const gfx = this.add.graphics();
    gfx.setDepth(2);
    this.themeEnvGfx = gfx;

    const W = 390;
    const H = 844;
    const theme = this.puzzle.theme;

    switch (theme) {
      case 'street':
        this.drawStreetBackdrop(gfx, W, H);
        break;
      case 'garage':
        this.drawGarageBackdrop(gfx, W, H);
        break;
      case 'underground':
        this.drawUndergroundBackdrop(gfx, W, H);
        break;
      case 'rooftop':
        this.drawRooftopBackdrop(gfx, W, H);
        break;
    }
  }

  // ── Theme backdrop helpers (Theme Base + Ground Surface) ────────

  private drawStreetBackdrop(gfx: Phaser.GameObjects.Graphics, W: number, H: number): void {
    // Downtown Night sky gradient (y=0-120) — deeper purple-blue
    for (let y = 0; y < 120; y++) {
      const t = y / 120;
      const r = Math.floor(0x08 + (0x15 - 0x08) * t);
      const g = Math.floor(0x08 + (0x12 - 0x08) * t);
      const b = Math.floor(0x14 + (0x22 - 0x14) * t);
      const color = (r << 16) | (g << 8) | b;
      gfx.fillStyle(color, 0.9);
      gfx.fillRect(0, y, W, 1);
    }
    // Stars in the sky
    gfx.fillStyle(0xffffff, 0.5);
    const starPositions = [
      { x: 30, y: 15 }, { x: 80, y: 8 }, { x: 150, y: 25 },
      { x: 200, y: 12 }, { x: 260, y: 20 }, { x: 320, y: 10 },
      { x: 350, y: 28 }, { x: 110, y: 35 }, { x: 290, y: 5 },
    ];
    for (const s of starPositions) {
      gfx.fillRect(s.x, s.y, 2, 2);
    }
    // Building silhouettes above the card (y=0-52) — Downtown skyline
    gfx.fillStyle(0x0d0d1a, 0.85);
    const skylineBuildings = [
      { x: 0, w: 32, h: 44 }, { x: 34, w: 26, h: 35 },
      { x: 62, w: 18, h: 48 }, { x: 82, w: 38, h: 30 },
      { x: 122, w: 22, h: 42 }, { x: 146, w: 30, h: 36 },
      { x: 178, w: 36, h: 46 }, { x: 216, w: 16, h: 28 },
      { x: 234, w: 28, h: 40 }, { x: 264, w: 20, h: 50 },
      { x: 286, w: 34, h: 32 }, { x: 322, w: 24, h: 44 },
      { x: 348, w: 42, h: 38 },
    ];
    for (const b of skylineBuildings) {
      gfx.fillRect(b.x, 52 - b.h, b.w, b.h);
    }
    // Lit windows on buildings
    gfx.fillStyle(0xfbbf24, 0.4);
    const litWindows: Array<{ x: number; y: number }> = [
      { x: 8, y: 18 }, { x: 16, y: 30 },
      { x: 40, y: 14 }, { x: 48, y: 24 },
      { x: 90, y: 16 }, { x: 100, y: 26 }, { x: 108, y: 10 },
      { x: 130, y: 20 }, { x: 138, y: 32 },
      { x: 155, y: 14 }, { x: 165, y: 26 },
      { x: 188, y: 12 }, { x: 198, y: 22 }, { x: 206, y: 34 },
      { x: 244, y: 16 }, { x: 252, y: 28 },
      { x: 272, y: 10 }, { x: 280, y: 22 },
      { x: 296, y: 18 }, { x: 306, y: 28 },
      { x: 330, y: 12 }, { x: 340, y: 24 },
      { x: 358, y: 16 }, { x: 370, y: 28 }, { x: 380, y: 36 },
    ];
    for (const w of litWindows) {
      gfx.fillRect(w.x, 52 - w.y, 3, 3);
    }
    // Sandy/beige ground below card (y=CARD_BOTTOM-844)
    for (let y = CARD_BOTTOM; y < H; y++) {
      const t = (y - CARD_BOTTOM) / (H - CARD_BOTTOM);
      const r = Math.floor(0x2a + (0x1a - 0x2a) * Math.min(t * 2, 1));
      const g = Math.floor(0x22 + (0x14 - 0x22) * Math.min(t * 2, 1));
      const b = Math.floor(0x18 + (0x0c - 0x18) * Math.min(t * 2, 1));
      const color = (r << 16) | (g << 8) | b;
      gfx.fillStyle(color, 1);
      gfx.fillRect(0, y, W, 1);
    }
    // Curb edge at top of ground area
    gfx.fillStyle(0x4a3728, 0.5);
    gfx.fillRect(0, CARD_BOTTOM - 5, W, 6);
  }

  private drawGarageBackdrop(gfx: Phaser.GameObjects.Graphics, W: number, H: number): void {
    // Upper wall (y=0-52)
    gfx.fillStyle(0x0a0f14, 1);
    gfx.fillRect(0, 0, W, 52);
    // Concrete beam at top of card
    gfx.fillStyle(0x1f2937, 1);
    gfx.fillRect(0, 44, W, 8);
    // Lower floor (y=CARD_BOTTOM-844)
    gfx.fillStyle(0x0d1117, 1);
    gfx.fillRect(0, CARD_BOTTOM, W, H - CARD_BOTTOM);
    // Floor line
    gfx.lineStyle(1, 0x374151, 0.4);
    gfx.beginPath();
    gfx.moveTo(0, CARD_BOTTOM);
    gfx.lineTo(W, CARD_BOTTOM);
    gfx.strokePath();
  }

  private drawUndergroundBackdrop(gfx: Phaser.GameObjects.Graphics, W: number, H: number): void {
    // Upper wall — concrete with formwork texture
    gfx.fillStyle(0x060a0f, 1);
    gfx.fillRect(0, 0, W, 52);
    // Formwork lines on the wall
    gfx.lineStyle(1, 0x1a2332, 0.3);
    gfx.beginPath();
    for (let ly = 0; ly < 44; ly += 6) {
      gfx.moveTo(0, ly);
      gfx.lineTo(W, ly);
    }
    gfx.strokePath();
    // Red/white warning stripe at top of card
    for (let sx = 0; sx < W; sx += 8) {
      const isRed = Math.floor(sx / 8) % 2 === 0;
      gfx.fillStyle(isRed ? 0xe8320a : 0xffffff, isRed ? 0.35 : 0.12);
      gfx.fillRect(sx, 44, 8, 8);
    }
    // Pipe ends protruding from top
    gfx.fillStyle(0x4a5568, 0.6);
    gfx.fillRect(50, 30, 8, 16);
    gfx.fillRect(130, 28, 10, 18);
    gfx.fillRect(210, 32, 8, 14);
    gfx.fillRect(290, 29, 10, 17);
    gfx.fillRect(350, 31, 8, 15);
    // Lower floor
    gfx.fillStyle(0x060a0f, 1);
    gfx.fillRect(0, CARD_BOTTOM, W, H - CARD_BOTTOM);
    gfx.lineStyle(1, 0xe8320a, 0.15);
    gfx.beginPath();
    gfx.moveTo(0, CARD_BOTTOM);
    gfx.lineTo(W, CARD_BOTTOM);
    gfx.strokePath();
  }

  private drawRooftopBackdrop(gfx: Phaser.GameObjects.Graphics, W: number, H: number): void {
    // Sky gradient behind building silhouettes — dusk colors
    for (let y = 0; y < 60; y++) {
      const t = y / 60;
      const r = Math.floor(0x0a + (0x2a - 0x0a) * t);
      const g = Math.floor(0x0e + (0x30 - 0x0e) * t);
      const b = Math.floor(0x1a + (0x40 - 0x1a) * t);
      const color = (r << 16) | (g << 8) | b;
      gfx.fillStyle(color, 1);
      gfx.fillRect(0, y, W, 1);
    }
    // Building silhouettes at top of card area — richer skyline
    gfx.fillStyle(0x1a1a2e, 0.7);
    const buildings = [
      { x: 0, w: 36, h: 42 }, { x: 38, w: 22, h: 30 },
      { x: 62, w: 44, h: 46 }, { x: 108, w: 18, h: 24 },
      { x: 128, w: 30, h: 38 }, { x: 160, w: 24, h: 28 },
      { x: 186, w: 36, h: 44 }, { x: 224, w: 20, h: 32 },
      { x: 246, w: 42, h: 48 }, { x: 290, w: 18, h: 22 },
      { x: 310, w: 34, h: 36 }, { x: 346, w: 44, h: 40 },
    ];
    for (const b of buildings) {
      gfx.fillRect(b.x, 52 - b.h, b.w, b.h);
    }
    // More lit windows — warm orange glow
    gfx.fillStyle(0xfbbf24, 0.35);
    const windows: Array<{ x: number; y: number }> = [
      { x: 8, y: 18 }, { x: 18, y: 28 }, { x: 28, y: 36 },
      { x: 44, y: 14 }, { x: 52, y: 22 },
      { x: 72, y: 10 }, { x: 82, y: 20 }, { x: 92, y: 30 }, { x: 100, y: 40 },
      { x: 136, y: 16 }, { x: 146, y: 28 },
      { x: 168, y: 12 }, { x: 178, y: 22 },
      { x: 196, y: 14 }, { x: 206, y: 24 }, { x: 214, y: 34 },
      { x: 232, y: 10 }, { x: 242, y: 20 },
      { x: 256, y: 14 }, { x: 268, y: 24 }, { x: 278, y: 36 },
      { x: 318, y: 16 }, { x: 330, y: 26 },
      { x: 356, y: 18 }, { x: 368, y: 28 }, { x: 380, y: 34 },
    ];
    for (const w of windows) {
      gfx.fillRect(w.x, 52 - w.y, 3, 3);
    }
    // Lower light concrete
    gfx.fillStyle(0x9ca3af, 0.35);
    gfx.fillRect(0, CARD_BOTTOM, W, H - CARD_BOTTOM);
    // Safety rail at top of lower area
    gfx.lineStyle(2, 0x6b7280, 0.5);
    gfx.beginPath();
    gfx.moveTo(0, CARD_BOTTOM + 3);
    gfx.lineTo(W, CARD_BOTTOM + 3);
    for (let px = 0; px < W; px += 30) {
      gfx.moveTo(px, CARD_BOTTOM);
      gfx.lineTo(px, CARD_BOTTOM + 9);
    }
    gfx.strokePath();
  }

  // ── Theme foreground props (inside parking container) ───────────

  private addThemeForeground(container: Phaser.GameObjects.Container, theme: PuzzleTheme): void {
    const foreGfx = this.add.graphics();
    foreGfx.setDepth(4.5);
    container.add(foreGfx);
    // Helper to add an SVG image prop to the container
    const addProp = (key: string, x: number, y: number, scale = 1) => {
      const img = this.add.image(x, y, key);
      img.setScale(scale);
      img.setDepth(4.5);
      container.add(img);
    };

    if (theme === 'street') {
      // Trees at bottom corners
      addProp('prop-tree', 24, 258);
      addProp('prop-tree', 264, 258);
      // Shrubs along bottom edge (replacing grass tufts)
      addProp('prop-shrub-1', 74, 282);
      addProp('prop-shrub-2', 130, 282);
      addProp('prop-shrub-1', 186, 282);
      addProp('prop-shrub-2', 242, 282);
      // Two more trees at top corners
      addProp('prop-tree', 24, 0);
      addProp('prop-tree', 264, 0);
      // Crosswalk stripes near exit zone (white painted bars)
      foreGfx.fillStyle(0xffffff, 1);
      for (let cx = 0; cx < 288; cx += 14) {
        foreGfx.fillRect(cx, 38, 12, 6);
      }
      // Lamppost on left side
      addProp('prop-lamppost', 11, 105);
      // Sidewalk paving grid at bottom edge
      foreGfx.lineStyle(1, 0x6b7280, 1);
      foreGfx.beginPath();
      for (let px = 0; px < 288; px += 16) {
        foreGfx.moveTo(px, 280);
        foreGfx.lineTo(px, 288);
      }
      foreGfx.strokePath();
    } else if (theme === 'garage') {
      // Concrete beam at top edge
      foreGfx.fillStyle(0x374151, 1);
      foreGfx.fillRect(0, 0, 288, 8);
      foreGfx.lineStyle(2, 0x4b5563, 1);
      foreGfx.beginPath();
      foreGfx.moveTo(0, 5);
      foreGfx.lineTo(288, 5);
      foreGfx.strokePath();
      // Shopping cart at bottom-left
      foreGfx.lineStyle(3, 0x9ca3af, 1);
      foreGfx.strokeRect(20, 253, 27, 21);
      foreGfx.fillStyle(0x9ca3af, 1);
      foreGfx.fillCircle(25, 274, 5);
      foreGfx.fillCircle(43, 274, 5);
      // Barrier blocks at edge
      foreGfx.fillStyle(0xfbbf24, 1);
      foreGfx.fillRect(241, 265, 21, 15);
      foreGfx.fillRect(265, 265, 21, 15);
    } else if (theme === 'underground') {
      // Overhead pipe segments at top edge
      foreGfx.fillStyle(0x4a5568, 1);
      foreGfx.fillRect(0, 0, 288, 6);
      foreGfx.fillRect(54, -3, 9, 15);
      foreGfx.fillRect(134, -3, 9, 15);
      foreGfx.fillRect(214, -3, 9, 15);
      // Large overhead rectangular duct running across
      foreGfx.fillStyle(0x6b7280, 1);
      foreGfx.fillRect(50, -9, 180, 12);
      foreGfx.fillStyle(0x4a5568, 1);
      foreGfx.fillRect(50, -9, 180, 3);
      // Drainage grate at bottom-right corner
      foreGfx.lineStyle(2, 0x4a5568, 1);
      foreGfx.beginPath();
      for (let gx = 230; gx < 260; gx += 4) {
        foreGfx.moveTo(gx, 278);
        foreGfx.lineTo(gx, 288);
      }
      foreGfx.strokePath();
    } else if (theme === 'rooftop') {
      // Safety railing at bottom edge
      foreGfx.lineStyle(3, 0x6b7280, 1);
      foreGfx.beginPath();
      foreGfx.moveTo(0, 282);
      foreGfx.lineTo(288, 282);
      for (let px = 0; px < 288; px += 24) {
        foreGfx.moveTo(px, 279);
        foreGfx.lineTo(px, 285);
      }
      foreGfx.strokePath();
      // AC unit / ventilator box at top-right
      foreGfx.fillStyle(0x6b7280, 1);
      foreGfx.fillRect(223, 243, 33, 21);
      foreGfx.lineStyle(2, 0x9ca3af, 1);
      foreGfx.strokeRect(223, 243, 33, 21);
      foreGfx.fillStyle(0x4a5568, 1);
      foreGfx.fillRect(229, 248, 9, 6);
      foreGfx.fillRect(241, 248, 9, 6);
      // Potted plants along the railing
      this.drawPottedPlant(foreGfx, 20, 280);
      this.drawPottedPlant(foreGfx, 268, 280);
    }
  }

  /** Small potted plant: brown pot + green leaves */
  private drawPottedPlant(gfx: Phaser.GameObjects.Graphics, x: number, y: number): void {
    gfx.fillStyle(0x8b5e3c, 1);
    gfx.fillRect(x - 5, y - 6, 10, 6);
    gfx.fillStyle(0x4ade80, 1);
    gfx.fillCircle(x, y - 12, 6);
    gfx.fillCircle(x - 5, y - 9, 5);
    gfx.fillCircle(x + 5, y - 9, 5);
  }

  // ──────────────────────────────────────────────────────────
  //  Parking Scene — Container with grid + obstacles + player car
  // ──────────────────────────────────────────────────────────

  private renderParkingScene(): void {
    const pc = this.puzzle.playerCar;

    this.spawnX = (pc.col + CONTAINER_OFFSET_X) * UNIT_PX;
    this.spawnY = (pc.row + CONTAINER_OFFSET_Y) * UNIT_PX;
    this.spawnAngle = pc.angle;
    this.carX = this.spawnX;
    this.carY = this.spawnY;
    this.carAngle = this.spawnAngle;

    const container = this.add.container(CONTAINER_X, CONTAINER_Y);
    container.setScale(SCALE_X, SCALE_Y);
    container.setDepth(5);
    this.parkingContainer = container;

    // ── Road tile image (under grid lines) ──────────────────────────
    const roadKey = `road-${this.puzzle.theme}`;
    const roadImage = this.add.image(0, 0, roadKey);
    roadImage.setOrigin(0, 0);
    roadImage.setDisplaySize(GRID_SIZE, GRID_SIZE);
    container.add(roadImage);

    const grid = createParkingGrid(this, {
      x: 0,
      y: 0,
      width: GRID_SIZE,
      height: GRID_SIZE,
      environment: this.puzzle.environment,
      theme: this.puzzle.theme,
    });
    container.add(grid);

    // ── Step 3: Exit zone visual — gate/chevron redesign ────────────
    const ez = this.puzzle.exitZone;
    const exitPixelX = (ez.col + CONTAINER_OFFSET_X) * UNIT_PX - 48;
    const exitPixelY = (ez.row + CONTAINER_OFFSET_Y) * UNIT_PX - 48;
    const exitZoneCenterX = exitPixelX + 48;
    const exitZoneCenterY = exitPixelY + 48;
    const exitGfx = this.add.graphics();

    // Exit zone fill / border / chevron — sourced from ThemeRegistry
    exitGfx.fillStyle(THEME_FLAT_COLORS.exitZoneColor, 0.40);
    exitGfx.fillRect(exitPixelX, exitPixelY, 96, 96);

    // Bright border — reads as a gate frame
    exitGfx.lineStyle(2, THEME_FLAT_COLORS.exitZoneColor, 0.85);
    exitGfx.strokeRect(exitPixelX, exitPixelY, 96, 96);

    // Chevron arrows pointing in the exit direction
    exitGfx.lineStyle(2, THEME_FLAT_COLORS.exitZoneColor, 0.75);
    exitGfx.beginPath();
    if (ez.direction === 'top') {
      // Upward-pointing chevron (^)
      exitGfx.moveTo(exitZoneCenterX - 18, exitZoneCenterY + 8);
      exitGfx.lineTo(exitZoneCenterX, exitZoneCenterY - 8);
      exitGfx.lineTo(exitZoneCenterX + 18, exitZoneCenterY + 8);
    } else if (ez.direction === 'bottom') {
      exitGfx.moveTo(exitZoneCenterX - 18, exitZoneCenterY - 8);
      exitGfx.lineTo(exitZoneCenterX, exitZoneCenterY + 8);
      exitGfx.lineTo(exitZoneCenterX + 18, exitZoneCenterY - 8);
    } else if (ez.direction === 'left') {
      exitGfx.moveTo(exitZoneCenterX + 8, exitZoneCenterY - 18);
      exitGfx.lineTo(exitZoneCenterX - 8, exitZoneCenterY);
      exitGfx.lineTo(exitZoneCenterX + 8, exitZoneCenterY + 18);
    } else if (ez.direction === 'right') {
      exitGfx.moveTo(exitZoneCenterX - 8, exitZoneCenterY - 18);
      exitGfx.lineTo(exitZoneCenterX + 8, exitZoneCenterY);
      exitGfx.lineTo(exitZoneCenterX - 8, exitZoneCenterY + 18);
    }
    exitGfx.strokePath();

    container.add(exitGfx);
    this.tweens.add({
      targets: exitGfx,
      alpha: { from: 0.3, to: 0.5 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Themed foreground elements framing the grid ────────────
    this.addThemeForeground(container, this.puzzle.theme);

    for (const obs of this.puzzle.obstacles) {
      if (obs.type === 'pillar' || obs.type === 'wall') continue;

      const obsImg = createObstacleCar(
        this,
        obs.col + CONTAINER_OFFSET_X,
        obs.row + CONTAINER_OFFSET_Y,
        obs.angle,
      );
      obsImg.setDepth(6);
      obsImg.setScale(CAR_VISUAL_SCALE, CAR_VISUAL_SCALE * COUNTER_SCALE_Y);
      container.add(obsImg);
    }

    const playerCar = createCarSprite(this, {
      x: pc.col + CONTAINER_OFFSET_X,
      y: pc.row + CONTAINER_OFFSET_Y,
      angle: pc.angle,
      type: 'player',
    });
    playerCar.setDepth(50);
    playerCar.setScale(CAR_VISUAL_SCALE, CAR_VISUAL_SCALE * COUNTER_SCALE_Y);
    container.add(playerCar);
    this.playerCarImage = playerCar;

  }

  // ──────────────────────────────────────────────────────────
  //  Objective Text
  // ──────────────────────────────────────────────────────────

  private renderObjective(): void {
    // Create text first so we can measure its rendered height
    const text = this.add
      .text(CONTROLS_CENTER_X, OBJECTIVE_Y, 'Drive out without hitting another car.', {
        fontSize: '14px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 4,
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: INSTRUCTION_WRAP_WIDTH },
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    // Draw a subtle panel behind the text using the measured text height.
    // Panel dimensions are derived from INSTRUCTION_WRAP_WIDTH + padding,
    // positioned relative to CONTROLS_CENTER_X / OBJECTIVE_Y.
    const panelW = INSTRUCTION_WRAP_WIDTH + INSTRUCTION_PANEL_PAD_X * 2;
    const panelH = text.height + INSTRUCTION_PANEL_PAD_Y * 2;
    const panelX = CONTROLS_CENTER_X - panelW / 2;
    const panelY = OBJECTIVE_Y - INSTRUCTION_PANEL_PAD_Y;

    const panel = this.add.graphics();
    panel.setDepth(8);

    // Soft dark fill with subtle contrast against the control surface (0x141414)
    panel.fillStyle(0x1a1a1a, 0.9);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, INSTRUCTION_PANEL_RADIUS);

    // Thin border for definition
    panel.lineStyle(1, 0x2a2a2a, 0.4);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, INSTRUCTION_PANEL_RADIUS);
  }

  // ──────────────────────────────────────────────────────────
  //  HUD — PARKIQ (orange), Puzzle #, Leaderboard
  //  No timer text rendered (Step 2).
  // ──────────────────────────────────────────────────────────

  private renderHUD(): void {
    this.add
      .text(20, HUD_Y, 'PARKIQ', {
        fontSize: PARKIQ_FONT,
        color: '#E8320A',
        stroke: '#000000',
        strokeThickness: 4,
        fontStyle: 'bold',
      })
      .setDepth(10);

    this.puzzleNumberText = this.add
      .text(195, HUD_Y + 2, `PUZZLE #${this.puzzle.id}`, {
        fontSize: HUD_MUTED_FONT,
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0)
      .setDepth(10);


  }

  // ──────────────────────────────────────────────────────────
  //  Driving Controls
  // ──────────────────────────────────────────────────────────

  private renderControls(): void {
    this.drivingControls = new DrivingControls(
      this,
      CONTROLS_CENTER_X,
      CONTROLS_CENTER_Y,
      // No sound key — crunch is reserved for collision only
    );
  }

  // ──────────────────────────────────────────────────────────
  //  Update — deterministic image-based movement (no physics)
  // ──────────────────────────────────────────────────────────

  override update(_time: number, delta: number): void {
    if (!this.ready || this.exited) return;

    // Reset per-frame flag that is set by resetToSpawn() when collision fires
    this.skipExitCheck = false;

    const input: DrivingInputState = this.drivingControls.getState();
    const dt = delta / 1000;

    // ── 1. Rotation ────────────────────────────────────────
    if (input.left) this.carAngle -= ROTATION_SPEED * dt;
    if (input.right) this.carAngle += ROTATION_SPEED * dt;

    // ── 2. Candidate movement ──────────────────────────────
    let moveDir = 0;
    if (input.forward) moveDir = 1;
    else if (input.reverse) moveDir = -1;

    let candidateX = this.carX;
    let candidateY = this.carY;

    if (moveDir !== 0) {
      const rad = Phaser.Math.DegToRad(this.carAngle);
      const step = MOVE_SPEED * dt * moveDir;
      candidateX += Math.sin(rad) * step;
      candidateY += -Math.cos(rad) * step;
    }

    // ── 3. Boundary clamp — rotation-aware on both axes ──
    // Compute rotated AABB half-extents so the visual stays ~6px inside the
    // grid on X and overhangs ~8px on Y at every angle.
    // Formulas: half-extents of a rotated rectangle:
    //   halfW = |½VW·cosθ| + |½VH·sinθ|
    //   halfH = |½VW·sinθ| + |½VH·cosθ|
    const rc = Phaser.Math.DegToRad(this.carAngle);
    const sc = Math.abs(Math.cos(rc));
    const ss = Math.abs(Math.sin(rc));
    const halfVW = VISUAL_W / 2;
    const halfVH = VISUAL_H / 2;
    const halfEffW = halfVW * sc + halfVH * ss;
    const halfEffH = halfVW * ss + halfVH * sc;
    const colHalf = CAR_W / 2;
    const rowHalf = CAR_H / 2;
    candidateX = Math.max(
      (COL0_CENTER - colHalf) + halfEffW,
      Math.min(candidateX, (COL5_CENTER + colHalf) - halfEffW),
    );
    // Top clamp: keep visual edge at screen y = 0 (avoids off-screen clipping).
    // Bottom clamp: unchanged — 8px overhang past grid bottom.
    candidateY = Math.max(
      -CONTAINER_Y / SCALE_Y + halfEffH,
      Math.min(candidateY, ROW5_CENTER - halfEffH + rowHalf),
    );

    // ── 4. Collision — reject candidate if overlapping any obstacle ──
    const canMove = !this.checkCollision(candidateX, candidateY);

    if (canMove) {
      this.carX = candidateX;
      this.carY = candidateY;
    } else if (moveDir !== 0) {
      // Collision: reset to spawn (knowledge.md spec)
      this.resetToSpawn();
      this.triggerCollisionFlash();
      // Play crunch sound — guarded by 300ms cooldown to prevent double-fire
      if (this.time.now >= this.collisionCooldownUntil) {
        try { this.sound.play('crunch'); } catch { /* audio locked */ }
        this.collisionCooldownUntil = this.time.now + 300;
      }
    }

    // ── 5. Apply to image ──────────────────────────────────
    this.playerCarImage.setPosition(this.carX, this.carY);
    this.playerCarImage.setAngle(this.carAngle);

    // ── 6. Exit zone check — win flow ──────────────────────
    if (!this.exited && !this.skipExitCheck && this.checkExitReached(this.carX, this.carY)) {
      this.exited = true;
      void this.handleWin();
    }
  }

  // ──────────────────────────────────────────────────────────
  //  Win handler — in-place next puzzle (Step 3)
  // ──────────────────────────────────────────────────────────

  private async handleWin(): Promise<void> {
    // 1. Success sound
    try {
      this.sound.play('success');
    } catch {
      // audio context may be locked
    }

    // 2. POST /api/puzzle-complete
    const result = await puzzleComplete({
      timeTaken: this.elapsedSeconds,
      puzzleId: this.puzzle.id,
    }).catch((error: unknown) => {
      console.error('[exit] puzzleComplete failed:', error);
      return { puzzleIndex: this.puzzle.id >= 15 ? 1 : this.puzzle.id + 1 };
    });

    // 3. If puzzle 15 cleared — show celebration overlay briefly
    if (this.puzzle.id === 15) {
      await this.showClearedOverlay();
    }

    // 4. Load next puzzle in place
    const nextIndex = result.puzzleIndex;
    this.loadNextPuzzleInPlace(nextIndex);
  }

  private showClearedOverlay(): Promise<void> {
    return new Promise((resolve) => {
      const overlay = this.add
        .text(195, 420, 'You cleared all puzzles!', {
          fontSize: '28px',
          color: '#E8320A',
          stroke: '#000000',
          strokeThickness: 4,
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 320 },
        })
        .setOrigin(0.5)
        .setDepth(200);

      this.time.delayedCall(1500, () => {
        overlay.destroy();
        resolve();
      });
    });
  }

  private loadNextPuzzleInPlace(nextIndex: number): void {
    this.ready = false;
    // Destroy old parking container (grid + obstacles + player car)
    this.parkingContainer.destroy(true);

    // Load new puzzle
    this.puzzle = getPuzzleByIndex(nextIndex);

    // Update HUD puzzle number
    this.puzzleNumberText.setText(`PUZZLE #${this.puzzle.id}`);

    // Redraw themed environment for the new theme
    this.renderEnvironment();

    // Reset state
    this.exited = false;

    // Re-render parking scene with new puzzle data
    this.renderParkingScene();

    // Restart elapsed timer
    this.startElapsedTimer();
    this.ready = true;
  }

  // ──────────────────────────────────────────────────────────
  //  Collision Detection (container-local coordinates)
  // ──────────────────────────────────────────────────────────

  private checkCollision(cx: number, cy: number): boolean {
    if (DEBUG_DISABLE_COLLISIONS) return false;

    const playerRect = new Phaser.Geom.Rectangle(
      cx - CAR_W / 2,
      cy - CAR_H / 2,
      CAR_W,
      CAR_H,
    );

    for (const obs of this.puzzle.obstacles) {
      if (obs.type === 'pillar' || obs.type === 'wall') continue;
      const ox = (obs.col + CONTAINER_OFFSET_X) * UNIT_PX;
      const oy = (obs.row + CONTAINER_OFFSET_Y) * UNIT_PX;
      const obsRect = new Phaser.Geom.Rectangle(
        ox - CAR_W / 2,
        oy - CAR_H / 2,
        CAR_W,
        CAR_H,
      );
      if (Phaser.Geom.Rectangle.Overlaps(playerRect, obsRect)) {
        return true;
      }
    }
    return false;
  }

  private checkExitReached(cx: number, cy: number): boolean {
    const carRect = new Phaser.Geom.Rectangle(
      cx - CAR_W / 2,
      cy - CAR_H / 2,
      CAR_W,
      CAR_H,
    );
    const ez = this.puzzle.exitZone;
    const exitPixelX = (ez.col + CONTAINER_OFFSET_X) * UNIT_PX - 48;
    const exitPixelY = (ez.row + CONTAINER_OFFSET_Y) * UNIT_PX - 48;
    const exitRect = new Phaser.Geom.Rectangle(exitPixelX, exitPixelY, 96, 96);

    return Phaser.Geom.Rectangle.Overlaps(carRect, exitRect);
  }

  // ──────────────────────────────────────────────────────────
  //  Collision reset — unchanged from prior epics
  // ──────────────────────────────────────────────────────────

  // ──────────────────────────────────────────────────────────
  //  Collision Flash — brief red screen overlay
  // ──────────────────────────────────────────────────────────

  /** Creates a full-screen red rectangle overlay, initially invisible. */
  private createCollisionFlash(): void {
    this.collisionFlash = this.add.graphics();
    this.collisionFlash.setDepth(999);
    this.collisionFlash.fillStyle(0xe8320a, 1);
    this.collisionFlash.fillRect(0, 0, this.scale.width, this.scale.height);
    this.collisionFlash.setAlpha(0);
  }

  /** Flashes the red overlay on collision — fades out over 200ms. */
  private triggerCollisionFlash(): void {
    this.tweens.killTweensOf(this.collisionFlash);
    this.collisionFlash.setAlpha(0.35);
    this.tweens.add({
      targets: this.collisionFlash,
      alpha: 0,
      duration: 200,
      ease: 'Sine.easeOut',
    });
  }

  private resetToSpawn(): void {
    this.carX = this.spawnX;
    this.carY = this.spawnY;
    this.carAngle = this.spawnAngle;
    this.playerCarImage.setPosition(this.carX, this.carY);
    this.playerCarImage.setAngle(this.carAngle);
    // Prevent same-frame exit check — the car was just reset due to collision,
    // so we must not also trigger a win in the same update() pass.
    this.skipExitCheck = true;
  }
}
