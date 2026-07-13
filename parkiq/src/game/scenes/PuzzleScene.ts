import Phaser from 'phaser';
import type { Puzzle, PuzzleTheme, TrainConfig } from '../puzzles/puzzle-types';
import { createCarSprite } from '../components/CarSprite';
import { createParkingGrid } from '../components/ParkingGrid';
import { createObstacleCar } from '../components/ObstacleCar';
import { DrivingControls } from '../components/DrivingControls';
import type { DrivingInputState } from '../components/DrivingControls';
import { getPuzzleByIndex, getBonusPuzzle } from '../../lib/puzzle-engine';
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

const DEBUG_SKIP_PUZZLE_5 = false;   // Skip puzzle 5 → load puzzle 6
const DEBUG_DISABLE_COLLISIONS = false; // Ignore all collision hitboxes
const DEBUG_LOAD_BONUS = false;          // Force-load bonus Dual-Train level on start

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
//  Train Segment Dimensions
//  Derived: each segment fills ~92% of UNIT_PX (48px), leaving
//  ~2px margin per side within a grid cell. The car sprite
//  uses CAR_W=36 (75% width margin) — trains are deliberately
//  wider because they occupy entire cells and the visual should
//  read as "this whole space is blocked."
//  44 / 48 ≈ 0.917 (92% fill)
// ──────────────────────────────────────────────────────────

const TRAIN_W = 44;
const TRAIN_H = 44;

// ──────────────────────────────────────────────────────────
//  Train Segment Color
// ──────────────────────────────────────────────────────────

const TRAIN_COLOR = 0xCC3333;  // Train body fill (Graphics primitive fallback)

// Track row visual offsets (container-local) — shifts train sprites closer together
// to eliminate visual overlap with stationary player car at spawn (row 5) and exit (row 2) cells.
// Row 3 shifts down +15px (168 → 183), Row 4 shifts up -15px (216 → 201).
// This is a rendering-only offset: collision boxes (TRAIN_COLLISION_H=32) are unaffected.
const TRACK_RENDER_OFFSET: Record<number, number> = { 3: 15, 4: -15 };

// Shared helper: computes the container-local Y center for a given train row,
// applying the visual offset so rendering and collision agree on where the
// sprite is drawn. Both updateTrains() and checkTrainCollision() call this.
const getTrainRowY = (row: number): number =>
  (row + CONTAINER_OFFSET_Y) * UNIT_PX + (TRACK_RENDER_OFFSET[row] ?? 0);

// ──────────────────────────────────────────────────────────
//  Movement & Collision Constants
// ──────────────────────────────────────────────────────────

const MOVE_SPEED = 120;
const ROTATION_SPEED = 90;
const CAR_W = 36;
const CAR_H = 64;

// ── Rotated AABB lookup tables (derived from corrected formula) ───────
// Keyed by angle bucket. Values are effective AABB {w, h} in pixels.
// Sedan/suv base 36×64:
//   0°: 45×69   15°: 58×73   30°: 68×74   45°: 73×73
//  60°: 74×68   75°: 73×58   90°: 69×45
const SEDAN_BOX: Record<number, { w: number; h: number }> = {
  0:  { w: 45, h: 69 },
  15: { w: 58, h: 73 },
  30: { w: 68, h: 74 },
  45: { w: 73, h: 73 },
  60: { w: 74, h: 68 },
  75: { w: 73, h: 58 },
  90: { w: 69, h: 45 },
};

// Large vehicle (truck/limo/semitruck) base 36×96:
//   0°: 49×100  45°: 99×99  90°: 100×49
const LARGE_BOX: Record<number, { w: number; h: number }> = {
  0:  { w: 49, h: 100 },
  45: { w: 99, h: 99 },
  90: { w: 100, h: 49 },
};

// ── Truck (long vehicle) collision & visual constants ────────────────
// Triggered by playerVehicle: 'truck' in puzzle data.
// Collision box: same width (fits lane), 1.5× height.
// Visual: existing car sprite stretched vertically + trailer overlay.
// ─────────────────────────────────────────────────────────────────────

const LARGE_CAR_W = 36;
const LARGE_CAR_H = 96;
/** Height multiplier vs sedan for the truck visual sprite scale */
const TRUCK_VISUAL_SCALE_Y = 1.5;
/** Scale factor for the Trailer.svg sprite (×200×981 loaded, target 30px visual width, 130px height) */
const TRAILER_VISUAL_SCALE = 0.15;

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
//  Parking Bay Marking Renderer
// ──────────────────────────────────────────────────────────

/**
 * Draws real parking-style bay markings inside the exit zone.
 *
 * - `parallel`: two horizontal curb lines flanking the bay + corner ticks
 * - `perpendicular`: vertical stall-divider lines + back line + top ticks
 *
 * A subtle green-tinted fill keeps the exit-zone signal visible
 * without the old solid-green rectangle look.
 */
function drawParkingBayMarkings(
  gfx: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  type: 'parallel' | 'perpendicular',
): void {
  console.log(`[MARKINGS] drawParkingBayMarkings called: type=${type}, bounds=(${x.toFixed(1)}, ${y.toFixed(1)}, ${size}x${size})`);
  const inset = 3;
  const tickLen = 10;
  const lineW = 2;
  const tickW = 1.5;
  const lineColor = 0xffffff;

  // Subtle green tint fill — signals "goal" without the old solid rectangle
  gfx.fillStyle(THEME_FLAT_COLORS.exitZoneColor, 0.18);
  gfx.fillRect(x, y, size, size);

  if (type === 'parallel') {
    // ── Parallel curb lines ──
    // Two horizontal lines (top / bottom) mark the stall boundaries.
    // Corner ticks extend inward to suggest the curb edges.
    gfx.lineStyle(lineW, lineColor, 0.85);
    gfx.beginPath();
    // Top line
    gfx.moveTo(x + inset, y + inset);
    gfx.lineTo(x + size - inset, y + inset);
    // Bottom line
    gfx.moveTo(x + inset, y + size - inset);
    gfx.lineTo(x + size - inset, y + size - inset);
    gfx.strokePath();

    // Corner ticks (short vertical strokes at each corner)
    gfx.lineStyle(tickW, lineColor, 0.6);
    gfx.beginPath();
    gfx.moveTo(x + inset, y + inset);
    gfx.lineTo(x + inset, y + inset + tickLen);
    gfx.moveTo(x + size - inset, y + inset);
    gfx.lineTo(x + size - inset, y + inset + tickLen);
    gfx.moveTo(x + inset, y + size - inset);
    gfx.lineTo(x + inset, y + size - inset - tickLen);
    gfx.moveTo(x + size - inset, y + size - inset);
    gfx.lineTo(x + size - inset, y + size - inset - tickLen);
    gfx.strokePath();
  } else {
    // ── Perpendicular stall dividers ──
    // Two vertical lines (left / right) + back line (bottom).
    // Short horizontal ticks at the top suggest the open lane edge.
    gfx.lineStyle(lineW, lineColor, 0.85);
    gfx.beginPath();
    // Left line
    gfx.moveTo(x + inset, y + inset);
    gfx.lineTo(x + inset, y + size - inset);
    // Right line
    gfx.moveTo(x + size - inset, y + inset);
    gfx.lineTo(x + size - inset, y + size - inset);
    // Back / bottom line
    gfx.moveTo(x + inset, y + size - inset);
    gfx.lineTo(x + size - inset, y + size - inset);
    gfx.strokePath();

    // Top ticks (short horizontal strokes at the open edge)
    gfx.lineStyle(tickW, lineColor, 0.6);
    gfx.beginPath();
    gfx.moveTo(x + inset, y + inset);
    gfx.lineTo(x + inset + tickLen, y + inset);
    gfx.moveTo(x + size - inset, y + inset);
    gfx.lineTo(x + size - inset - tickLen, y + inset);
    gfx.strokePath();
  }
}

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

  /** Active collision dimensions — may differ for truck puzzles */
  private activeCarW = CAR_W;
  private activeCarH = CAR_H;
  /** Active visual dimensions for rotation-aware clamp */
  private activeVisW = VISUAL_W;
  private activeVisH = VISUAL_H;
  /** Truck trailer overlay graphics (null for sedan puzzles) */
  private truckTrailerGfx: Phaser.GameObjects.Graphics | null = null;
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
  /** Loading screen container — destroyed in create() once all assets are loaded */
  private loadingGroup: Phaser.GameObjects.Container | null = null;
  /** Particle emitter for collision debris burst */
  private collisionEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  /** Collision cooldown: next time (ms) at which crunch sound may fire again */
  private collisionCooldownUntil = 0;
  /** Crash-pause cooldown: next time (ms) at which movement resumes after a crash overlay */
  private crashPausedUntil = 0;
  /** True on the frame after reset — prevents same-frame exit-check false win */
  private skipExitCheck = false;

  /** True when the current puzzle is the bonus Dual-Train level */
  private isBonusLevel = false;
  /** Per-track scroll offset (px) — unbounded, wraps for rendering */
  private trainOffsets: number[] = [];
  /** Graphics per cell per track — [track][col] */
  private trainSprites: Phaser.GameObjects.Graphics[][] = [];
  /** Cached train configs from the bonus puzzle */
  private trainConfigs: TrainConfig[] = [];



  /** Gap indicator — green rect over safe crossing columns */
  private gapIndicatorGfx: Phaser.GameObjects.Graphics | null = null;
  /** Gap indicator tween — alpha pulse while a safe gap is showing */
  private gapIndicatorTween: Phaser.Tweens.Tween | null = null;
  /** True while the gap indicator rect is being drawn (tracks open/close transitions) */
  private gapIndicatorActive = false;


  private get webAudio(): Phaser.Sound.WebAudioSoundManager {
    return this.sound as Phaser.Sound.WebAudioSoundManager;
  }

  constructor() {
    super('PuzzleScene');
  }

  preload(): void {
    // ── Loading screen — branded car visual + progress bar ──────
    // All elements are Phaser primitives (Graphics + Text), no loaded assets needed.
    // Cleaned up in create() via loadingGroup.destroy(true).
    this.loadingGroup = this.add.container(0, 0).setDepth(9999);

    // Stylized car silhouette — red body rectangle
    const carBody = this.add.graphics();
    carBody.fillStyle(0xE8320A, 1);
    carBody.fillRoundedRect(175, 380, 40, 80, 8);  // centered, 40×80
    this.loadingGroup.add(carBody);

    // Car windshield accent
    const carWindshield = this.add.graphics();
    carWindshield.fillStyle(0xFF5E64, 1);
    carWindshield.fillRoundedRect(180, 390, 30, 20, 4);
    this.loadingGroup.add(carWindshield);

    // "ParkIQ" text
    const titleText = this.add.text(195, 480, 'ParkIQ', {
      fontSize: '28px',
      color: '#E8320A',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.loadingGroup.add(titleText);

    // Progress bar — background track
    const barWidth = 200;
    const barHeight = 8;
    const barX = (390 - barWidth) / 2;
    const barY = 520;
    const track = this.add.graphics();
    track.fillStyle(0x2A2A2A, 1);
    track.fillRect(barX, barY, barWidth, barHeight);
    this.loadingGroup.add(track);

    // Progress bar — fill (updated by load.on('progress'))
    const fill = this.add.graphics();
    this.loadingGroup.add(fill);

    this.load.on('progress', (value: number) => {
      if (!(this as any)._tloadLogged) {
        (this as any)._tloadLogged = true;
        // Remove CSS loading screen on first progress event — Phaser is now actively
        // rendering the loading elements, so the handoff is seamless.
        document.getElementById('loading')?.remove();
      }
      fill.clear();
      fill.fillStyle(0xE8320A, 1);
      fill.fillRect(barX, barY, barWidth * value, barHeight);
    });

    // ── Asset loading ─────────────────────────────────────────────
    this.load.audio('crunch', 'assets/sounds/crunch.mp3');
    this.load.audio('success', 'assets/sounds/success.mp3');

    // ── Car SVGs ──────────────────────────────────────────────────
    this.load.svg('car-player', 'assets/sprites/cars/Car-Player.svg', { width: 200, height: 400 });
    this.load.svg('car-obstacle-1', 'assets/sprites/cars/Car-obstacle-01.svg', { width: 200, height: 400 });
    this.load.svg('car-obstacle-2', 'assets/sprites/cars/Car-obstacle-02.svg', { width: 200, height: 400 });
    this.load.svg('car-obstacle-3', 'assets/sprites/cars/Car-obstacle-03.svg', { width: 200, height: 400 });
    this.load.svg('car-obstacle-4', 'assets/sprites/cars/Car-obstacle-04.svg', { width: 200, height: 400 });
    this.load.svg('car-obstacle-5', 'assets/sprites/cars/Car-obstacle-05.svg', { width: 200, height: 400 });
    this.load.svg('car-limo', 'assets/sprites/cars/Limousine.svg', { width: 200, height: 605 });
    this.load.svg('car-trailer', 'assets/sprites/cars/Trailer.svg', { width: 200, height: 981 });

    // ── Road tile SVGs (full 288×288 grid surface per theme) ──────
    this.load.svg('road-street',       'assets/sprites/roads/Road-Street.svg',       { width: 780, height: 780 });
    this.load.svg('road-garage',       'assets/sprites/roads/Road-Garage.svg',       { width: 780, height: 780 });
    this.load.svg('road-underground',  'assets/sprites/roads/Road-Underground.svg',  { width: 780, height: 780 });
    this.load.svg('road-rooftop',      'assets/sprites/roads/Road-Rooftop.svg',      { width: 780, height: 780 });

    this.load.audio('train', 'assets/sounds/train.mp3');

    // ── Prop SVGs ─────────────────────────────────────────────────
    this.load.svg('prop-tree',       'assets/sprites/props/Prop-Tree.svg',       { width: 64, height: 64 });
    this.load.svg('prop-shrub-1',    'assets/sprites/props/Prop-Shrub-1.svg',    { width: 48, height: 48 });
    this.load.svg('prop-shrub-2',    'assets/sprites/props/Prop-Shrub-1.svg',    { width: 48, height: 48 });
    this.load.svg('prop-lamppost',   'assets/sprites/props/Prop-Tree.svg',       { width: 32, height: 128 });
  }

  create(): void {
    this.exited = false;
    this.ready = false;
    this.elapsedSeconds = 0;

    // Destroy loading screen — all assets are guaranteed loaded by now
    this.loadingGroup?.destroy(true);
    this.loadingGroup = null;

    this.input.once('pointerdown', () => {
      void this.webAudio.context.resume();
    });

    this.renderDefaultBackground();
    this.renderControlSurface();
    this.initCollisionParticles();

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

    if (DEBUG_LOAD_BONUS) {
      this.loadBonusLevel();
      return;
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

    // Set active dimensions based on vehicle type
    // All long vehicles (truck/limo/semitruck) share 36×96 collision.
    if (this.puzzle.playerVehicle === 'truck' || this.puzzle.playerVehicle === 'limo' || this.puzzle.playerVehicle === 'semitruck') {
      this.activeCarW = LARGE_CAR_W;
      this.activeCarH = LARGE_CAR_H;
      // Each unique-asset vehicle has its own native dimensions
      if (this.puzzle.playerVehicle === 'limo') {
        this.activeVisW = 200 * CAR_VISUAL_SCALE; // 40
        this.activeVisH = 605 * CAR_VISUAL_SCALE * COUNTER_SCALE_Y;
      } else if (this.puzzle.playerVehicle === 'semitruck') {
        this.activeVisW = 200 * TRAILER_VISUAL_SCALE; // 30
        this.activeVisH = 981 * TRAILER_VISUAL_SCALE * COUNTER_SCALE_Y;
      } else {
        this.activeVisW = VISUAL_W; // 40
        this.activeVisH = VISUAL_H * TRUCK_VISUAL_SCALE_Y; // 70.6 × 1.5 ≈ 106
      }
    } else {
      this.activeCarW = CAR_W;
      this.activeCarH = CAR_H;
      this.activeVisW = VISUAL_W;
      this.activeVisH = VISUAL_H;
    }

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

    // ── Step 3: Exit zone visual ────────────────────────────────────
    const ez = this.puzzle.exitZone;
    const baySize = this.puzzle.parkingType ? 48 : 96;
    const halfBay = baySize / 2;
    const exitPixelX = (ez.col + CONTAINER_OFFSET_X) * UNIT_PX - halfBay;
    const exitPixelY = (ez.row + CONTAINER_OFFSET_Y) * UNIT_PX - halfBay;
    const exitZoneCenterX = exitPixelX + halfBay;
    const exitZoneCenterY = exitPixelY + halfBay;
    const exitGfx = this.add.graphics();

    console.log(`[MARKINGS] puzzle.parkingType=${this.puzzle.parkingType}, puzzle.parkingAngle=${this.puzzle.parkingAngle}, baySize=${baySize}, exitPos=(${exitPixelX.toFixed(1)}, ${exitPixelY.toFixed(1)}), branch=${this.puzzle.parkingType ? 'PARKING_MARKINGS' : 'LEGACY_RECT'}`);

    if (this.puzzle.parkingType) {
      // Position diagnostic — container-local → scene-space mapping
      const sceneTop = CONTAINER_Y + exitPixelY * SCALE_Y;
      const sceneBottom = CONTAINER_Y + (exitPixelY + baySize) * SCALE_Y;
      const sceneLeft = CONTAINER_X + exitPixelX * SCALE_X;
      const sceneRight = CONTAINER_X + (exitPixelX + baySize) * SCALE_X;
      console.log(`[MARKINGS] scene-space box: top=${sceneTop.toFixed(1)} bottom=${sceneBottom.toFixed(1)} left=${sceneLeft.toFixed(1)} right=${sceneRight.toFixed(1)} (canvas 0..844, container top=${CONTAINER_Y})`);
      console.log(`[MARKINGS] MAGENTA test at depth=5 — is it visible?`);

      // TEST: Solid magenta at depth=5, no tween, 100% alpha
      exitGfx.fillStyle(0xff00ff, 1);
      exitGfx.fillRect(exitPixelX, exitPixelY, baySize, baySize);
      exitGfx.lineStyle(3, 0xff00ff, 1);
      exitGfx.strokeRect(exitPixelX, exitPixelY, baySize, baySize);
      exitGfx.setDepth(5);
    } else {
      // Legacy: filled rectangle + border + direction chevron
      exitGfx.fillStyle(THEME_FLAT_COLORS.exitZoneColor, 0.40);
      exitGfx.fillRect(exitPixelX, exitPixelY, baySize, baySize);
      exitGfx.lineStyle(2, THEME_FLAT_COLORS.exitZoneColor, 0.85);
      exitGfx.strokeRect(exitPixelX, exitPixelY, baySize, baySize);

      exitGfx.lineStyle(2, THEME_FLAT_COLORS.exitZoneColor, 0.75);
      exitGfx.beginPath();
      if (ez.direction === 'top') {
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
    }

    container.add(exitGfx);
    if (!this.puzzle.parkingType) {
      this.tweens.add({
        targets: exitGfx,
        alpha: { from: 0.3, to: 0.5 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

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

    const vehicle = this.puzzle.playerVehicle ?? 'sedan';
    const playerCar = createCarSprite(this, {
      x: pc.col + CONTAINER_OFFSET_X,
      y: pc.row + CONTAINER_OFFSET_Y,
      angle: pc.angle,
      type: 'player',
      textureKey: vehicle === 'limo' ? 'car-limo' : vehicle === 'semitruck' ? 'car-trailer' : undefined,
    });
    const isLong = vehicle === 'truck' || vehicle === 'limo' || vehicle === 'semitruck';
    playerCar.setDepth(50);
    if (isLong) {
      if (vehicle === 'limo') {
        playerCar.setScale(CAR_VISUAL_SCALE, CAR_VISUAL_SCALE * COUNTER_SCALE_Y); // limo loaded at 200×605, scale 0.20×0.882
      } else if (vehicle === 'semitruck') {
        playerCar.setScale(TRAILER_VISUAL_SCALE, TRAILER_VISUAL_SCALE * COUNTER_SCALE_Y); // Trailer.svg loaded at 200×981, scale 0.15×0.882
      } else {
        playerCar.setScale(CAR_VISUAL_SCALE, CAR_VISUAL_SCALE * TRUCK_VISUAL_SCALE_Y * COUNTER_SCALE_Y);
      }
    } else {
      playerCar.setScale(CAR_VISUAL_SCALE, CAR_VISUAL_SCALE * COUNTER_SCALE_Y);
    }
    container.add(playerCar);
    this.playerCarImage = playerCar;

    // ── Trailer overlay (graphics-primitive, 'truck' variant only) ──
    if (vehicle === 'truck' && !this.truckTrailerGfx) {
      const trailerGfx = this.add.graphics();
      trailerGfx.setDepth(49);
      container.add(trailerGfx);
      this.truckTrailerGfx = trailerGfx;
    }

    // ── Train tracks (bonus level only) ───────────────────────────
    if (this.puzzle.trains && this.puzzle.trains.length > 0) {
      this.renderTrainTracks();
    }
  }

  // ──────────────────────────────────────────────────────────
  //  Objective Text
  // ──────────────────────────────────────────────────────────

  private renderObjective(): void {
    // Create text first so we can measure its rendered height
    const text = this.add
      .text(CONTROLS_CENTER_X, OBJECTIVE_Y, this.puzzle.question, {
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

    // Crash-pause: freeze movement while the CRASH! overlay is showing
    if (this.time.now < this.crashPausedUntil) return;

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
    const halfVW = this.activeVisW / 2;
    const halfVH = this.activeVisH / 2;
    const halfEffW = halfVW * sc + halfVH * ss;
    const halfEffH = halfVW * ss + halfVH * sc;
    const colHalf = this.activeCarW / 2;
    candidateX = Math.max(
      (COL0_CENTER - colHalf) + halfEffW,
      Math.min(candidateX, (COL5_CENTER + colHalf) - halfEffW),
    );
    // Top clamp: keep visual edge at screen y = 0 (avoids off-screen clipping).
    // Bottom clamp: 8px overhang past grid bottom (GRID_SIZE), independent of
    // vehicle collision height.  The old formula used `rowHalf` which scaled the
    // overhang with LARGE_CAR_H, giving long vehicles 24px of overflow.
    const BOTTOM_OVERHANG_PX = 24;
    candidateY = Math.max(
      -CONTAINER_Y / SCALE_Y + halfEffH,
      Math.min(candidateY, GRID_SIZE + BOTTOM_OVERHANG_PX - halfEffH),
    );

    // ── 4. Train movement — scroll offsets each frame (bonus level only) ──
    if (this.isBonusLevel && this.trainConfigs.length > 0) {
      this.updateTrains(dt);
      this.renderGapIndicator();
    }

    // ── 5. Train collision — always-active, not gated by moveDir ──
    if (this.isBonusLevel && !this.exited && this.checkTrainCollision()) {
      this.triggerCollisionBurst();
      this.resetToSpawn();
      this.tryPlayTrainHitSound();
      candidateX = this.carX;
      candidateY = this.carY;
    }

    // ── 6. Collision — reject candidate if overlapping any obstacle ──
    const canMove = !this.checkCollision(candidateX, candidateY);

    if (canMove) {
      this.carX = candidateX;
      this.carY = candidateY;
    } else if (moveDir !== 0) {
      // Collision: reset to spawn (knowledge.md spec)
      this.triggerCollisionBurst();
      this.resetToSpawn();
      this.tryPlayTrainHitSound();
    }

    // ── 7. Apply to image ──────────────────────────────────
    this.playerCarImage.setPosition(this.carX, this.carY);
    this.playerCarImage.setAngle(this.carAngle);

    // ── 7b. Trailer overlay — update position behind car (graphics-primitive, 'truck' only) ────
    if (this.truckTrailerGfx) {
      this.updateTruckTrailer();
    }

    // ── 8. Exit zone check — win flow ──────────────────────
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

    // 2. POST /api/puzzle-complete (skip for bonus level — outside rotation)
    let nextIndex = 1;
    if (!this.isBonusLevel) {
      const result = await puzzleComplete({
        timeTaken: this.elapsedSeconds,
        puzzleId: this.puzzle.id,
      }).catch((error: unknown) => {
        console.error('[exit] puzzleComplete failed:', error);
        return { puzzleIndex: this.puzzle.id >= 15 ? 1 : this.puzzle.id + 1 };
      });
      nextIndex = result.puzzleIndex;
    }

    // 3. If puzzle 15 cleared — celebrate then load bonus level
    if (this.puzzle.id === 15) {
      await this.showClearedOverlay();
      this.loadBonusLevel();
      return;
    }

    // 4. If bonus level cleared — go back to daily rotation (puzzle 1)
    if (this.isBonusLevel) {
      this.isBonusLevel = false;
      this.loadNextPuzzleInPlace(nextIndex);
      return;
    }

    // 5. Load next puzzle in place (normal rotation)
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

    // Destroy trailer overlay BEFORE container (prevents double-destroy)
    if (this.truckTrailerGfx) {
      this.truckTrailerGfx.destroy();
      this.truckTrailerGfx = null;
    }

    // Destroy old parking container (grid + obstacles + player car)
    // This also destroys any remaining children (train sprites, etc.)
    this.parkingContainer.destroy(true);

    // Reset bonus-level state
    this.isBonusLevel = false;
    this.trainOffsets = [];
    this.trainConfigs = [];
    this.trainSprites = [];

    // Stop train movement sound if leaving bonus level
    this.sound.stopByKey('train');

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

  /** Determines which lookup table to use based on vehicle/obstacle type */
  private getVehicleTable(type: string): 'sedan' | 'large' {
    if (type === 'truck' || type === 'limo' || type === 'semitruck') {
      return 'large';
    }
    return 'sedan';
  }

  /**
   * Returns the effective rotated AABB size for the given angle.
   * Snaps to nearest bucket: 15° steps for sedan table, {0,45,90} for large.
   *
   * Reduction: 1) r = angle mod 180  2) if r > 90: r = 180 - r  3) snap to bucket.
   * This correctly maps 90° → 90 (not 0) and 270° → 90 (same as 90).
   */
  private getRotatedBox(table: 'sedan' | 'large', angleDeg: number): { w: number; h: number } {
    // Step 1: reduce to [0, 180) — rotated AABB has 180° period
    let r = angleDeg % 180;
    if (r < 0) r += 180;
    // Step 2: mirror around 90° — AABB at θ equals AABB at (180 - θ)
    if (r > 90) r = 180 - r;

    if (table === 'sedan') {
      // Step 3: snap to nearest of {0,15,30,45,60,75,90}
      const bucket = Math.round(r / 15) * 15;
      return SEDAN_BOX[bucket] ?? SEDAN_BOX[0]!;
    } else {
      // Step 3: snap to nearest of {0,45,90}
      const bucket = r < 22.5 ? 0 : r < 67.5 ? 45 : 90;
      return LARGE_BOX[bucket] ?? LARGE_BOX[0]!;
    }
  }

  private checkCollision(cx: number, cy: number): boolean {
    if (DEBUG_DISABLE_COLLISIONS) return false;

    // Player box — lookup table based on current angle + vehicle type
    const playerTable = this.getVehicleTable(this.puzzle.playerVehicle ?? 'sedan');
    const playerBox = this.getRotatedBox(playerTable, this.carAngle);
    const playerRect = new Phaser.Geom.Rectangle(
      cx - playerBox.w / 2,
      cy - playerBox.h / 2,
      playerBox.w,
      playerBox.h,
    );

    for (const obs of this.puzzle.obstacles) {
      // 'pillar' is visual-only — no collision footprint
      if (obs.type === 'pillar') continue;

      // Use pixel x,y if available (from convertGridToPixel), fall back to grid
      const ox = obs.x ?? (obs.col + CONTAINER_OFFSET_X) * UNIT_PX;
      const oy = obs.y ?? (obs.row + CONTAINER_OFFSET_Y) * UNIT_PX;

      // Per-obstacle table selection — each obstacle's type determines its box
      const obsTable = this.getVehicleTable(obs.type);
      const obsBox = this.getRotatedBox(obsTable, obs.angle);
      const obsRect = new Phaser.Geom.Rectangle(
        ox - obsBox.w / 2,
        oy - obsBox.h / 2,
        obsBox.w,
        obsBox.h,
      );
      if (Phaser.Geom.Rectangle.Overlaps(playerRect, obsRect)) {
        return true;
      }
    }
    return false;
  }

  private checkExitReached(cx: number, cy: number): boolean {
    const carRect = new Phaser.Geom.Rectangle(
      cx - this.activeCarW / 2,
      cy - this.activeCarH / 2,
      this.activeCarW,
      this.activeCarH,
    );
    const ez = this.puzzle.exitZone;
    const baySize = this.puzzle.parkingType ? 48 : 96;
    const halfBay = baySize / 2;
    const exitPixelX = (ez.col + CONTAINER_OFFSET_X) * UNIT_PX - halfBay;
    const exitPixelY = (ez.row + CONTAINER_OFFSET_Y) * UNIT_PX - halfBay;
    const exitRect = new Phaser.Geom.Rectangle(exitPixelX, exitPixelY, baySize, baySize);

    if (!Phaser.Geom.Rectangle.Overlaps(carRect, exitRect)) return false;

    // Angle check — applies only to parking-type puzzles
    if (this.puzzle.parkingAngle !== undefined) {
      const diff = Math.abs(Phaser.Math.Angle.WrapDegrees(this.carAngle - this.puzzle.parkingAngle));
      if (diff > 10) return false;
    }

    return true;
  }

  // ──────────────────────────────────────────────────────────
  //  Collision Debris — particle burst at impact point
  // ──────────────────────────────────────────────────────────

  /** Generates a white square particle texture and creates the burst emitter. */
  private initCollisionParticles(): void {
    // Generate a small white square texture for debris particles
    const canvas = this.textures.createCanvas('debris-particle', 8, 8);
    if (canvas) {
      const ctx = canvas.getContext();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 8, 8);
      canvas.refresh();
    }

    this.collisionEmitter = this.add.particles(0, 0, 'debris-particle', {
      speed: { min: 80, max: 300 },
      angle: { min: 0, max: 360 },
      lifespan: 600,
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xe8320a, 0xff6b35, 0xffdd57, 0xffffff],
      emitting: false,
      maxAliveParticles: 100,
      gravityY: 120,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.collisionEmitter.setDepth(999);
  }

  /** Spawns a debris particle burst at the car's current screen position. */
  private triggerCollisionBurst(): void {
    const sceneX = CONTAINER_X + this.carX * SCALE_X;
    const sceneY = CONTAINER_Y + this.carY * SCALE_Y;
    this.collisionEmitter.explode(20, sceneX, sceneY);
  }

  /** Play crunch sound with 300ms cooldown guard — shared by static-obstacle and train hits */
  private tryPlayTrainHitSound(): void {
    if (this.time.now >= this.collisionCooldownUntil) {
      try { this.sound.play('crunch'); } catch { /* audio locked */ }
      this.collisionCooldownUntil = this.time.now + 300;
    }
  }

  // ──────────────────────────────────────────────────────────
  //  Truck trailer overlay — rotated rectangle behind car
  // ──────────────────────────────────────────────────────────

  /** Draw the truck trailer as a filled rotated rectangle behind the player car */
  private updateTruckTrailer(): void {
    const gfx = this.truckTrailerGfx;
    if (!gfx) return;

    const rad = Phaser.Math.DegToRad(this.carAngle);
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const hw = LARGE_CAR_W / 2;
    const trailerLen = 40;
    // Trailer starts at car's rear bumper (LARGE_CAR_H/2 from center, backward direction)
    const y0 = LARGE_CAR_H / 2;
    const y1 = y0 + trailerLen;

    // 4 corners in car-local coords (car facing up = 0°)
    const corners = [
      { x: -hw, y: y0 },
      { x:  hw, y: y0 },
      { x:  hw, y: y1 },
      { x: -hw, y: y1 },
    ];

    // Rotate and translate to world position
    const pts = corners.map((c) => ({
      x: this.carX + c.x * cosA - c.y * sinA,
      y: this.carY + c.x * sinA + c.y * cosA,
    }));

    gfx.clear();
    // Trailer body fill
    gfx.fillStyle(0x4a5568, 0.9);
    gfx.beginPath();
    gfx.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < pts.length; i++) {
      gfx.lineTo(pts[i]!.x, pts[i]!.y);
    }
    gfx.closePath();
    gfx.fillPath();

    // Trailer outline
    gfx.lineStyle(1, 0x374151, 1.0);
    gfx.beginPath();
    gfx.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < pts.length; i++) {
      gfx.lineTo(pts[i]!.x, pts[i]!.y);
    }
    gfx.closePath();
    gfx.strokePath();

    // Small hitch line connecting car to trailer
    gfx.lineStyle(2, 0x6b7280, 0.7);
    const hitchY0 = LARGE_CAR_H / 2 - 2;
    const hitchY1 = LARGE_CAR_H / 2 + 2;
    const h0 = {
      x: this.carX + 0 * cosA - hitchY0 * sinA,
      y: this.carY + 0 * sinA + hitchY0 * cosA,
    };
    const h1 = {
      x: this.carX + 0 * cosA - hitchY1 * sinA,
      y: this.carY + 0 * sinA + hitchY1 * cosA,
    };
    gfx.beginPath();
    gfx.moveTo(h0.x, h0.y);
    gfx.lineTo(h1.x, h1.y);
    gfx.strokePath();
  }

  // ──────────────────────────────────────────────────────────
  //  Bonus Level — Dual-Train Scissor Trap
  // ──────────────────────────────────────────────────────────

  private loadBonusLevel(): void {
    this.ready = false;
    // Destroy old parking container if exists
    if (this.parkingContainer) {
      this.parkingContainer.destroy(true);
    }

    this.isBonusLevel = true;
    this.puzzle = getBonusPuzzle();
    this.trainConfigs = this.puzzle.trains ?? [];
    this.trainOffsets = this.trainConfigs.map(() => 0);

    // Set initial offsets so gaps are misaligned at start (scissor effect)
    // Track 1 (row 3, → right): gap starts at col 0
    // Track 2 (row 4, ← left):  gap starts at col 2 (offset = 2 * UNIT_PX)
    if (this.trainOffsets.length >= 2) {
      this.trainOffsets[1] = 2 * UNIT_PX;
    }

    // Reset truck-specific state for fresh puzzle load
    this.truckTrailerGfx = null;

    // Reuse normal rendering pipeline with bonus puzzle data
    this.renderEnvironment();
    this.renderHUD();
    this.renderObjective();
    this.renderControls();
    this.renderParkingScene();

    this.startElapsedTimer();
    this.ready = true;

    // Start looping train movement sound (only for train-based bonus levels)
    if (this.puzzle.trains && this.puzzle.trains.length > 0) {
      try {
        this.sound.play('train', { loop: true, volume: 0.4 });
      } catch { /* audio locked — will play on first pointerdown */ }
    }
  }

  /** Create train track Graphics layers inside the parking container */
  private renderTrainTracks(): void {
    // Destroy any previous train sprites
    for (const trackSprites of this.trainSprites) {
      for (const gfx of trackSprites) {
        gfx.destroy();
      }
    }
    this.trainSprites = [];

    // 1 Graphics per column × 6 columns per track
    for (let t = 0; t < this.trainConfigs.length; t++) {
      const trackSprites: Phaser.GameObjects.Graphics[] = [];
      for (let c = 0; c < 6; c++) {
        const gfx = this.add.graphics();
        gfx.setDepth(7); // Between static obstacles (6) and player (50)
        this.parkingContainer.add(gfx);
        trackSprites.push(gfx);
      }
      this.trainSprites.push(trackSprites);
    }

    // Create gap indicator graphics layer
    if (this.gapIndicatorGfx) {
      this.gapIndicatorGfx.destroy();
    }
    // Kill any lingering tween on the old graphics object
    if (this.gapIndicatorTween) {
      this.gapIndicatorTween.stop();
      this.gapIndicatorTween.remove();
      this.gapIndicatorTween = null;
    }
    this.gapIndicatorActive = false;
    const indicatorGfx = this.add.graphics();
    indicatorGfx.setDepth(8); // Between trains (7) and player (50)
    this.parkingContainer.add(indicatorGfx);
    this.gapIndicatorGfx = indicatorGfx;
  }

  /** Advance train positions by dt, draw train segments, and check collision */
  private updateTrains(dt: number): void {
    for (let t = 0; t < this.trainConfigs.length; t++) {
      const cfg = this.trainConfigs[t];
      if (!cfg) continue;
      if (t >= this.trainOffsets.length) continue;
      const trackSprites = this.trainSprites[t];
      if (!trackSprites) continue;

      const dir = cfg.direction === 'right' ? 1 : -1;
      this.trainOffsets[t]! += cfg.speed * dt * dir;

      const row = cfg.row;
      const offset = this.trainOffsets[t] ?? 0;
      const cy = getTrainRowY(row);
      const rectY = cy - TRAIN_H / 2;

      // Compute which column the gap starts at (always 0–5)
      const rawGapCol = Math.floor(offset / UNIT_PX);
      const gapStartCol = ((rawGapCol % 6) + 6) % 6;

      // Build a set of gap columns for quick lookup
      const isGap = new Array(6).fill(false) as boolean[];
      for (let g = 0; g < cfg.gapUnits; g++) {
        isGap[(gapStartCol + g) % 6] = true;
      }

      for (let c = 0; c < 6; c++) {
        const gfx = trackSprites[c];
        if (!gfx) continue;

        gfx.clear();

        if (isGap[c]) continue;

        const rectX = c * UNIT_PX + (UNIT_PX - TRAIN_W) / 2;
        gfx.fillStyle(TRAIN_COLOR, 1.0);
        gfx.fillRect(rectX, rectY, TRAIN_W, TRAIN_H);
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  //  Shared helper: returns which columns (0-5) have a gap on
  //  the given track for the current frame's offset.
  //  Replaces 3+ inline duplicates of the same formula.
  // ──────────────────────────────────────────────────────────

  private getGapCols(trackIndex: number): boolean[] {
    const offset = this.trainOffsets[trackIndex];
    if (offset === undefined) return new Array(6).fill(false);
    const tc = this.trainConfigs[trackIndex];
    if (!tc) return new Array(6).fill(false);
    const rawGapCol = Math.floor(offset / UNIT_PX);
    const gapStartCol = ((rawGapCol % 6) + 6) % 6;
    const isGap = new Array(6).fill(false);
    for (let g = 0; g < tc.gapUnits; g++) {
      isGap[(gapStartCol + g) % 6] = true;
    }
    return isGap;
  }

  // ──────────────────────────────────────────────────────────
  //  Gap Indicator — green rect over safe crossing columns
  //  Bonus level only. Pure additive rendering layer.
  // ──────────────────────────────────────────────────────────

  private renderGapIndicator(): void {
    const gfx = this.gapIndicatorGfx;
    if (!gfx) return;

    gfx.clear();

    const gap0 = this.getGapCols(0);
    const gap1 = this.getGapCols(1);

    let firstSafe = -1;
    let lastSafe = -1;
    let overlapCount = 0;
    for (let c = 0; c < 6; c++) {
      if (gap0[c] && gap1[c]) {
        if (firstSafe === -1) firstSafe = c;
        lastSafe = c;
        overlapCount++;
      }
    }

    const gapOpen = overlapCount * UNIT_PX >= CAR_W;

    if (gapOpen) {
      // Gap just opened — start pulsing tween (matching exit zone pattern)
      if (!this.gapIndicatorActive) {
        this.gapIndicatorActive = true;
        gfx.setAlpha(0.30);
        this.gapIndicatorTween = this.tweens.add({
          targets: gfx,
          alpha: { from: 0.30, to: 0.50 },
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      const topY = getTrainRowY(3) - TRAIN_H / 2;
      const bottomY = getTrainRowY(4) + TRAIN_H / 2;
      gfx.fillStyle(0x4ade80, 1.0);
      gfx.fillRect(
        firstSafe * UNIT_PX,
        topY,
        overlapCount * UNIT_PX,
        bottomY - topY,
      );
    } else if (this.gapIndicatorActive) {
      // Gap just closed — stop tween and reset alpha
      this.gapIndicatorActive = false;
      if (this.gapIndicatorTween) {
        this.gapIndicatorTween.stop();
        this.gapIndicatorTween.remove();
        this.gapIndicatorTween = null;
      }
      gfx.setAlpha(1.0);
    }
  }

  /**
   * Always-active train collision check — NOT gated by moveDir.
   * Called every frame in update() for the bonus level only.
   * Player can be hit while stationary (waiting for gap alignment).
   */
  private checkTrainCollision(): boolean {
    if (DEBUG_DISABLE_COLLISIONS) return false;

    // ── Cell-bounds guard: skip if player is fully within a safe cell ──
    // CURRENT values (Bug #4 fix): narrowed from 240/144 to reduce visual/collision gap.
    // Confirmed zero false-positives at rest: sweep Y=252-259 showed 0/424 per Y;
    // rest position Y=264 guard-skipped. Sweep overestimates risk (missing
    // TRACK_RENDER_OFFSET — real game overlap stops at carY=249, not 251).
    const ROW5_LO = 252;
    const ROW5_HI = (5 + CONTAINER_OFFSET_Y) * UNIT_PX + UNIT_PX / 2; // 288
    const ROW2_LO = (2 + CONTAINER_OFFSET_Y) * UNIT_PX - UNIT_PX / 2; // 96
    const ROW2_HI = 132;
    if (this.carY >= ROW5_LO && this.carY <= ROW5_HI) return false;
    if (this.carY >= ROW2_LO && this.carY <= ROW2_HI) return false;

    const playerRect = new Phaser.Geom.Rectangle(
      this.carX - this.activeCarW / 2,
      this.carY - this.activeCarH / 2,
      this.activeCarW,
      this.activeCarH,
    );

    const TRAIN_COLLISION_H = 32;

    for (let t = 0; t < this.trainConfigs.length; t++) {
      const cfg = this.trainConfigs[t];
      if (!cfg) continue;
      const offset = this.trainOffsets[t];
      if (offset === undefined) continue;
      const row = cfg.row;
      const gapUnits = cfg.gapUnits;

      const rawGapCol = Math.floor(offset / UNIT_PX);
      const gapStartCol = ((rawGapCol % 6) + 6) % 6;

      const gapCols: number[] = [];
      for (let g = 0; g < gapUnits; g++) {
        gapCols.push((gapStartCol + g) % 6);
      }

      for (let c = 0; c < 6; c++) {
        if (gapCols.includes(c)) continue;

        const ox = (c + CONTAINER_OFFSET_X) * UNIT_PX;
        const oy = getTrainRowY(row);
        const trainRect = new Phaser.Geom.Rectangle(
          ox - TRAIN_W / 2,
          oy - TRAIN_COLLISION_H / 2,
          TRAIN_W,
          TRAIN_COLLISION_H,
        );
        if (Phaser.Geom.Rectangle.Overlaps(playerRect, trainRect)) {
          return true;
        }
      }
    }
    return false;
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

    // Hide graphics trailer overlay — it would otherwise linger at the crash position
    if (this.truckTrailerGfx) this.truckTrailerGfx.clear();

    // Crash feedback: overlay + camera shake + movement pause
    this.crashPausedUntil = this.time.now + 500;

    // Camera shake — 200ms, subtle intensity
    this.cameras.main.shake(200, 0.005);

    // "CRASH!" text overlay — fades out over 500ms, then destroys
    const crashText = this.add
      .text(195, 420, 'CRASH!', {
        fontSize: '32px',
        color: '#E8320A',
        stroke: '#000000',
        strokeThickness: 4,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(1000);

    this.tweens.add({
      targets: crashText,
      alpha: 0,
      duration: 500,
      onComplete: () => { crashText.destroy(); },
    });
  }
}
