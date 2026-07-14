import Phaser from 'phaser';
import type { Puzzle, TrainConfig } from '../puzzles/puzzle-types';
import { createCarSprite } from '../components/CarSprite';
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
const DEBUG_FORCE_PUZZLE: number | null = 2;  // Force-load specific puzzle (null = use daily rotation)

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

// ── Prop visual scale factors (per-type, so rendered size matches collision box) ──
// Each SVG is loaded at 200px width (matching car convention).
// Scale = viewBox_w / 200 so the rendered visual matches the collision-box width.
// Example: cone at 18×18 → 18/200 = 0.09 gives 18px visual width.
const PROP_VISUAL_SCALE: Record<string, number> = {
  'cone':        18 / 200,  // 0.09
  'barricade':   48 / 200,  // 0.24
  'barricade-1': 52 / 200,  // 0.26
  'shrub-1':    103 / 200,  // 0.515
  'shrub-2':    118 / 200,  // 0.59
  'tree':        88 / 200,  // 0.44
  'tree-sm':     41 / 200,  // 0.205
  // Wall: loaded at 33×191 native, scaled to match collision width (48px)
  // scale = 48 / loadWidth(200) = 0.24 → renders 48px wide
  'wall':       48 / 200,  // 0.24
};

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

// ── Prop collision box lookup (raw SVG viewBox dimensions, no margin) ────
// Non-angle-bucketed for symmetric props (cone, shrubs, tree).
// Two-entry (0°/90°) simple swap for rectangular barricades.
const PROP_BOX: Record<string, { w: number; h: number }> = {
  'barricade-1': { w: 52, h: 16 },
  'barricade':   { w: 48, h: 16 },
  'cone':        { w: 18, h: 18 },
  'shrub-1':     { w: 103, h: 60 },
  'shrub-2':     { w: 118, h: 69 },
  'tree':        { w: 88, h: 89 },
  'tree-sm':     { w: 41, h: 42 },
};

// ── Wall collision box — 1 grid cell (48×48), rotation-invariant (square) ─
const WALL_BOX: { w: number; h: number } = { w: 48, h: 48 };

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

// ── Angled exit zone dimensions (asymmetric to match car proportions) ──
// These are the VISUAL rendering AND collision-check dimensions for
// parkingType='angled' exit zones. 40px wide × 70px long, roughly
// matching a sedan's rotated AABB (36×64 base) plus margin.
// Defined once at module level to prevent visual/collision drift.
const ANGLE_EXIT_HALF_W = 20;  // 40px total width
const ANGLE_EXIT_HALF_H = 35;  // 70px total length

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
  /** Tracks whether the first load progress event has fired (for loading screen handoff) */
  private tloadLogged = false;


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
      if (!this.tloadLogged) {
        this.tloadLogged = true;
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

    // ── Prop SVGs (6 new obstacle types) ────────────────────────────
    this.load.svg('prop-cone',        'assets/sprites/props/Prop-cone.svg',        { width: 200, height: 200 });
    this.load.svg('prop-barricade',   'assets/sprites/props/Prop-Barricade.svg',   { width: 200, height: 67 });
    this.load.svg('prop-barricade-1', 'assets/sprites/props/Prop-Barricade-1.svg', { width: 200, height: 62 });
    this.load.svg('prop-shrub-1',     'assets/sprites/props/Prop-Shrub-1.svg',     { width: 200, height: 117 });
    this.load.svg('prop-shrub-2',     'assets/sprites/props/Prop-Shrub-2.svg',     { width: 200, height: 117 });
    this.load.svg('prop-tree',        'assets/sprites/props/Prop-Tree.svg',         { width: 200, height: 202 });
    this.load.svg('prop-tree-sm',     'assets/sprites/props/Prop-Tree-sm.svg',     { width: 200, height: 205 });

    // ── Wall SVG ───────────────────────────────────────────────────
    this.load.svg('prop-wall', 'assets/sprites/props/Wall.svg', { width: 200 });

    // ── Background images (per-puzzle lot surfaces) ───────────────
    this.load.svg('bg_1', 'assets/sprites/backgrounds/puzzle1-bg.svg', { width: 288, height: 288 });

    this.load.audio('train', 'assets/sounds/train.mp3');

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

    if (DEBUG_FORCE_PUZZLE !== null) {
      puzzleIndex = DEBUG_FORCE_PUZZLE;
    }

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



  // ──────────────────────────────────────────────────────────
  //  Parking Scene — Container with grid + obstacles + player car
  // ──────────────────────────────────────────────────────────

  private renderParkingScene(): void {
    const pc = this.puzzle.playerCar;

    this.spawnX = pc.x ?? ((pc.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX;
    this.spawnY = pc.y ?? ((pc.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX;
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

    // ── Background surface (lot surface) ──────────────────────────
    // Static per-puzzle image (PNG/SVG loaded per-key) or solid-gray fallback.
    if (this.puzzle.backgroundImage) {
      const bgKey = `bg_${this.puzzle.id}`;
      if (this.textures.exists(bgKey)) {
        const bgImg = this.add.image(0, 0, bgKey);
        bgImg.setOrigin(0, 0);
        bgImg.setDisplaySize(GRID_SIZE, GRID_SIZE);
        container.add(bgImg);
      } else {
        console.warn(`[bg] backgroundImage set for puzzle ${this.puzzle.id} but texture "${bgKey}" not found — using gray fallback`);
        const bgGfx = this.add.graphics();
        bgGfx.fillStyle(0x2a2a2a, 1);
        bgGfx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);
        container.add(bgGfx);
      }
    } else {
      const bgGfx = this.add.graphics();
      bgGfx.fillStyle(0x2a2a2a, 1);
      bgGfx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);
      container.add(bgGfx);
    }

    // ── Step 3: Exit zone visual ────────────────────────────────────
    const ez = this.puzzle.exitZone;
    const baySize = ez.parkingType ? 48 : 96;
    const halfBay = baySize / 2;
    const bayCenterX = ez.x ?? ((ez.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX;
    const bayCenterY = ez.y ?? ((ez.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX;
    const exitPixelX = bayCenterX - halfBay;
    const exitPixelY = bayCenterY - halfBay;
    const exitZoneCenterX = exitPixelX + halfBay;
    const exitZoneCenterY = exitPixelY + halfBay;

    // Compute dynamic bay size from the player's real rotated AABB at the exit angle.
    // Used by parallel/perpendicular visual rendering only — angled has its own
    // constants (ANGLE_EXIT_HALF_W/H), and the exit collision check uses
    // center-proximity (±8px) which is dimension-independent.
    // For non-parking-type (legacy) zones, falls back to 96×96.
    let bayW: number;
    let bayH: number;
    if (ez.parkingType && ez.parkingType !== 'angled') {
      const veh = this.puzzle.playerVehicle ?? 'sedan';
      const tbl = this.getVehicleTable(veh);
      const exitBox = this.getRotatedBox(tbl, ez.angle ?? 0);
      bayW = exitBox.w;
      bayH = exitBox.h;
    } else if (ez.parkingType === 'angled') {
      bayW = ANGLE_EXIT_HALF_W * 2;  // 40
      bayH = ANGLE_EXIT_HALF_H * 2;  // 70
    } else {
      bayW = 96;
      bayH = 96;
    }
    const exitGfx = this.add.graphics();

    if (ez.parkingType) {
      const inset = 3;
      const tickLen = 8;
      const lineColor = 0xffffff;

      if (ez.parkingType === 'parallel') {
        // ── Rotated parallel marking ────────────────────────────────────────
        // Dimensions computed from player's real rotated AABB at exit angle
        // (getRotatedBox) so the visual matches whatever car is driving.
        const rad = Phaser.Math.DegToRad(ez.angle ?? 0);
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);

        const rp = (bx: number, by: number) => ({
          x: bayCenterX + (bx - bayCenterX) * cosA - (by - bayCenterY) * sinA,
          y: bayCenterY + (bx - bayCenterX) * sinA + (by - bayCenterY) * cosA,
        });

        const localX = bayCenterX - bayW / 2;
        const localY = bayCenterY - bayH / 2;

        // Green-tinted fill — rotated rectangle sized to player's AABB
        const fillCorners = [
          rp(localX, localY),
          rp(localX + bayW, localY),
          rp(localX + bayW, localY + bayH),
          rp(localX, localY + bayH),
        ];
        exitGfx.fillStyle(THEME_FLAT_COLORS.exitZoneColor, 0.40);
        exitGfx.beginPath();
        exitGfx.moveTo(fillCorners[0]!.x, fillCorners[0]!.y);
        for (let i = 1; i < fillCorners.length; i++) {
          exitGfx.lineTo(fillCorners[i]!.x, fillCorners[i]!.y);
        }
        exitGfx.closePath();
        exitGfx.fillPath();

        // Two horizontal curb lines
        const topLineStart = rp(localX + inset, localY + inset);
        const topLineEnd   = rp(localX + bayW - inset, localY + inset);
        const botLineStart = rp(localX + inset, localY + bayH - inset);
        const botLineEnd   = rp(localX + bayW - inset, localY + bayH - inset);

        exitGfx.lineStyle(2, lineColor, 0.90);
        exitGfx.beginPath();
        exitGfx.moveTo(topLineStart.x, topLineStart.y);
        exitGfx.lineTo(topLineEnd.x, topLineEnd.y);
        exitGfx.moveTo(botLineStart.x, botLineStart.y);
        exitGfx.lineTo(botLineEnd.x, botLineEnd.y);
        exitGfx.strokePath();

        // Corner ticks
        exitGfx.lineStyle(2, lineColor, 0.75);
        exitGfx.beginPath();
        for (const corner of [
          { x: localX + inset, y: localY + inset },
          { x: localX + bayW - inset, y: localY + inset },
          { x: localX + inset, y: localY + bayH - inset },
          { x: localX + bayW - inset, y: localY + bayH - inset },
        ]) {
          const base = rp(corner.x, corner.y);
          const tip  = rp(corner.x, corner.y + (corner.y < bayCenterY ? tickLen : -tickLen));
          exitGfx.moveTo(base.x, base.y);
          exitGfx.lineTo(tip.x, tip.y);
        }
        exitGfx.strokePath();
      } else if (ez.parkingType === 'perpendicular') {
        // ── Rotated perpendicular marking ────────────────────────────────────
        // Dimensions from player's real rotated AABB at exit angle.
        const rad = Phaser.Math.DegToRad(ez.angle ?? 0);
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);

        const rp = (bx: number, by: number) => ({
          x: bayCenterX + (bx - bayCenterX) * cosA - (by - bayCenterY) * sinA,
          y: bayCenterY + (bx - bayCenterX) * sinA + (by - bayCenterY) * cosA,
        });

        const localX = bayCenterX - bayW / 2;
        const localY = bayCenterY - bayH / 2;

        // Green-tinted fill — rotated rectangle sized to player's AABB
        const fillCorners = [
          rp(localX, localY),
          rp(localX + bayW, localY),
          rp(localX + bayW, localY + bayH),
          rp(localX, localY + bayH),
        ];
        exitGfx.fillStyle(THEME_FLAT_COLORS.exitZoneColor, 0.40);
        exitGfx.beginPath();
        exitGfx.moveTo(fillCorners[0]!.x, fillCorners[0]!.y);
        for (let i = 1; i < fillCorners.length; i++) {
          exitGfx.lineTo(fillCorners[i]!.x, fillCorners[i]!.y);
        }
        exitGfx.closePath();
        exitGfx.fillPath();

        // Two vertical stall divider lines + back line (all rotated)
        const leftLineStart  = rp(localX + inset, localY + inset);
        const leftLineEnd    = rp(localX + inset, localY + bayH - inset);
        const rightLineStart = rp(localX + bayW - inset, localY + inset);
        const rightLineEnd   = rp(localX + bayW - inset, localY + bayH - inset);
        const backLineStart  = rp(localX + inset, localY + bayH - inset);
        const backLineEnd    = rp(localX + bayW - inset, localY + bayH - inset);

        exitGfx.lineStyle(2, lineColor, 0.90);
        exitGfx.beginPath();
        exitGfx.moveTo(leftLineStart.x, leftLineStart.y);
        exitGfx.lineTo(leftLineEnd.x, leftLineEnd.y);
        exitGfx.moveTo(rightLineStart.x, rightLineStart.y);
        exitGfx.lineTo(rightLineEnd.x, rightLineEnd.y);
        exitGfx.moveTo(backLineStart.x, backLineStart.y);
        exitGfx.lineTo(backLineEnd.x, backLineEnd.y);
        exitGfx.strokePath();

        // Top ticks (going inward along bay's local X axis)
        const tlBase = rp(localX + inset, localY + inset);
        const tlTip  = rp(localX + inset + tickLen, localY + inset);
        const trBase = rp(localX + bayW - inset, localY + inset);
        const trTip  = rp(localX + bayW - inset - tickLen, localY + inset);

        exitGfx.lineStyle(2, lineColor, 0.75);
        exitGfx.beginPath();
        exitGfx.moveTo(tlBase.x, tlBase.y);
        exitGfx.lineTo(tlTip.x, tlTip.y);
        exitGfx.moveTo(trBase.x, trBase.y);
        exitGfx.lineTo(trTip.x, trTip.y);
        exitGfx.strokePath();
      } else {
        // 'angled' — rotated car-shaped rectangle matching exitZone.angle
        // Uses asymmetric dimensions (40×70) to match car proportions,
        // using the same cosA/sinA corner-rotation pattern as updateTruckTrailer().
        // Shared constants ANGLE_EXIT_HALF_W / ANGLE_EXIT_HALF_H keep the
        // visual and collision shapes in sync.
        console.log(`[ANGLE_EXIT] angle=${ez.angle}° halfW=${ANGLE_EXIT_HALF_W} halfH=${ANGLE_EXIT_HALF_H} center=(${bayCenterX.toFixed(1)},${bayCenterY.toFixed(1)})`);
        const rad = Phaser.Math.DegToRad(ez.angle ?? 0);
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);

        // 4 corners of the unrotated 40×70 rectangle centered at origin
        const localCorners = [
          { x: -ANGLE_EXIT_HALF_W, y: -ANGLE_EXIT_HALF_H },
          { x:  ANGLE_EXIT_HALF_W, y: -ANGLE_EXIT_HALF_H },
          { x:  ANGLE_EXIT_HALF_W, y:  ANGLE_EXIT_HALF_H },
          { x: -ANGLE_EXIT_HALF_W, y:  ANGLE_EXIT_HALF_H },
        ];

        // Rotate each corner and translate to bay center
        const worldCorners = localCorners.map(c => ({
          x: bayCenterX + c.x * cosA - c.y * sinA,
          y: bayCenterY + c.x * sinA + c.y * cosA,
        }));

        // Filled rotated rectangle — dark green fill (consistent with other parking-type markings)
        exitGfx.fillStyle(THEME_FLAT_COLORS.exitZoneColor, 0.40);
        exitGfx.beginPath();
        exitGfx.moveTo(worldCorners[0]!.x, worldCorners[0]!.y);
        for (let i = 1; i < worldCorners.length; i++) {
          exitGfx.lineTo(worldCorners[i]!.x, worldCorners[i]!.y);
        }
        exitGfx.closePath();
        exitGfx.fillPath();

        // Brighter green border stroke
        exitGfx.lineStyle(2, 0x8fcf90, 0.85);
        exitGfx.beginPath();
        exitGfx.moveTo(worldCorners[0]!.x, worldCorners[0]!.y);
        for (let i = 1; i < worldCorners.length; i++) {
          exitGfx.lineTo(worldCorners[i]!.x, worldCorners[i]!.y);
        }
        exitGfx.closePath();
        exitGfx.strokePath();
      }

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
    if (ez.parkingType === 'angled') {
      this.tweens.add({
        targets: exitGfx,
        alpha: { from: 0.65, to: 0.95 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (!ez.parkingType) {
      this.tweens.add({
        targets: exitGfx,
        alpha: { from: 0.3, to: 0.5 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    for (const obs of this.puzzle.obstacles) {
      // 'pillar' is visual-only — walls now render (collision changed in Step 3)
      if (obs.type === 'pillar') continue;

      const ox = obs.x ?? ((obs.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX;
      const oy = obs.y ?? ((obs.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX;

      if (obs.type === 'wall') {
        // Wall: SVG image (replaces old Graphics-drawn placeholder)
        const scale = PROP_VISUAL_SCALE['wall'] ?? 0.24;
        const img = this.add.image(ox, oy, 'prop-wall');
        img.setAngle(obs.angle);
        img.setDepth(6);
        img.setScale(scale, scale * COUNTER_SCALE_Y);
        container.add(img);
      } else if (obs.type === 'barricade-1' || obs.type === 'barricade' ||
                 obs.type === 'cone' || obs.type === 'shrub-1' ||
                 obs.type === 'shrub-2' || obs.type === 'tree' || obs.type === 'tree-sm') {
        // Prop: load correct SVG texture, scale to match collision box
        const scale = PROP_VISUAL_SCALE[obs.type] ?? 0.20;
        const img = this.add.image(ox, oy, `prop-${obs.type}`);
        img.setAngle(obs.angle);
        img.setDepth(6);
        img.setScale(scale, scale * COUNTER_SCALE_Y);
        container.add(img);
      } else {
        // Car obstacles (sedan/suv): existing random-roll car sprite
        const obsImg = createObstacleCar(this, ox, oy, obs.angle);
        obsImg.setDepth(6);
        obsImg.setScale(CAR_VISUAL_SCALE, CAR_VISUAL_SCALE * COUNTER_SCALE_Y);
        container.add(obsImg);
      }
    }

    const vehicle = this.puzzle.playerVehicle ?? 'sedan';
    const playerCar = createCarSprite(this, {
      x: pc.x ?? ((pc.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX,
      y: pc.y ?? ((pc.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX,
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
        return { puzzleIndex: this.puzzle.id >= 16 ? 1 : this.puzzle.id + 1 };
      });
      nextIndex = result.puzzleIndex;
    }

    // 3. If last rotation puzzle cleared — celebrate then load bonus level
    if (this.puzzle.id === 16) {
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
   * Returns the collision box for any obstacle type (car, wall, prop).
   * Routes to the correct lookup table:
   *   - sedan/suv → SEDAN_BOX via getVehicleTable+getRotatedBox
   *   - truck/limo/semitruck → LARGE_BOX via getVehicleTable+getRotatedBox
   *   - wall → WALL_BOX (48×48, rotation-invariant)
   *   - props → PROP_BOX (barricades swap w/h at 90°; others are fixed)
   */
  private getObstacleBox(type: string, angleDeg: number): { w: number; h: number } {
    // Car types — route through existing table system
    if (type === 'sedan' || type === 'suv' || type === 'truck' || type === 'limo' || type === 'semitruck') {
      const table = this.getVehicleTable(type);
      return this.getRotatedBox(table, angleDeg);
    }

    // Wall — fixed 48×48 square (rotation doesn't matter)
    if (type === 'wall') {
      return WALL_BOX;
    }

    // Props — PROP_BOX lookup; barricades swap w/h at 90°
    const base = PROP_BOX[type];
    if (!base) {
      // Unknown type fallback (shouldn't happen if type system is exhaustive)
      console.warn(`[collision] unknown obstacle type "${type}" — falling back to sedan box`);
      return this.getRotatedBox('sedan', angleDeg);
    }

    // Barricades: snap to 0° (original) or 90° (swapped)
    if (type === 'barricade-1' || type === 'barricade') {
      let r = angleDeg % 180;
      if (r < 0) r += 180;
      if (r > 90) r = 180 - r;
      if (r >= 45) {
        return { w: base.h, h: base.w };
      }
      return base;
    }

    // All other props: fixed box, no angle adjustment
    return base;
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
      const ox = obs.x ?? ((obs.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX;
      const oy = obs.y ?? ((obs.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX;

      // Per-obstacle box — routes through getObstacleBox() which handles
      // sedan/suv (SEDAN_BOX), truck/limo/semitruck (LARGE_BOX),
      // wall (WALL_BOX), and all 6 prop types (PROP_BOX).
      const obsBox = this.getObstacleBox(obs.type, obs.angle);
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
    const ez = this.puzzle.exitZone;

    // Player box — same getRotatedBox() as checkCollision() (Step 3/4 consistency)
    const playerTable = this.getVehicleTable(this.puzzle.playerVehicle ?? 'sedan');
    const playerBox = this.getRotatedBox(playerTable, this.carAngle);

    if (ez.parkingType) {
      // ── Parking-type exit: position + angle check ─────────────────────
      // Angle tolerance: ±10° for parallel/perpendicular, ±15° for angled.
      const bayX = ez.x ?? ((ez.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX;
      const bayY = ez.y ?? ((ez.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX;
      const bayAngle = ez.angle ?? 0;

      if (ez.parkingType === 'angled') {
        // Angled zones: position proximity check — car center must be near bay center.
        // At 45° the player AABB (73×73) is larger than the bay (40×70),
        // so pure rectangle overlap triggers when any corner barely touches.
        // Instead require the car center to land within a fixed tolerance
        // of the bay center, ensuring the car looks visually parked inside.
        const POS_TOLERANCE = 8; // px — car center within ±8px of bay center on each axis
        if (Math.abs(cx - bayX) > POS_TOLERANCE) return false;
        if (Math.abs(cy - bayY) > POS_TOLERANCE) return false;
      } else {
        // Parallel / perpendicular: center-proximity check (same as angled).
        // Replace loose rectangle-overlap with tight center-tolerance so the
        // car visually centers itself inside the marking before winning, just
        // like the angled branch already does.
        const POS_TOLERANCE = 8; // px — car center within ±8px of bay center on each axis
        if (Math.abs(cx - bayX) > POS_TOLERANCE) return false;
        if (Math.abs(cy - bayY) > POS_TOLERANCE) return false;
      }

      // 2. Angle tolerance check
      const tolerance = ez.parkingType === 'angled' ? 15 : 10;
      const diff = Math.abs(Phaser.Math.Angle.WrapDegrees(this.carAngle - bayAngle));
      if (diff > tolerance) return false;

      return true;
    } else {
      // ── Legacy touch-only exit (96×96, no angle requirement) ───────────
      const halfBay = 48; // 96×96 bay

      const bayX = ez.x ?? ((ez.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX;
      const bayY = ez.y ?? ((ez.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX;

      const playerRect = new Phaser.Geom.Rectangle(
        cx - playerBox.w / 2,
        cy - playerBox.h / 2,
        playerBox.w,
        playerBox.h,
      );
      const exitRect = new Phaser.Geom.Rectangle(
        bayX - halfBay,
        bayY - halfBay,
        96,
        96,
      );

      return Phaser.Geom.Rectangle.Overlaps(playerRect, exitRect);
    }
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
    let overlapCount = 0;
    for (let c = 0; c < 6; c++) {
      if (gap0[c] && gap1[c]) {
        if (firstSafe === -1) firstSafe = c;
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
