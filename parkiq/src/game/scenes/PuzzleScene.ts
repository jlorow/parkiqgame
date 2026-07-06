import Phaser from 'phaser';
import type { Puzzle } from '../puzzles/puzzle-types';
import { createParkingGrid } from '../components/ParkingGrid';
import { createObstacleCar } from '../components/ObstacleCar';
import { DrivingControls } from '../components/DrivingControls';
import type { DrivingInputState } from '../components/DrivingControls';
import { getTodaysPuzzle } from '../../lib/puzzle-engine';
import { puzzleComplete } from '../../lib/devvit-client';

// ──────────────────────────────────────────────────────────
//  Layout Constants
// ──────────────────────────────────────────────────────────/** Grid-unit constant from knowledge.md */
const UNIT_PX = 48;

/** Parking scene container scale */
const CONTAINER_SCALE = 1.35;
/** Container X: centers the scaled 288×288 grid in 390px width */
const CONTAINER_X = 1;
/** Container Y: snug below the HUD */
const CONTAINER_Y = 52;
/** Car offset within container: col + 1, row + 2 */
const CONTAINER_OFFSET_X = 1;
const CONTAINER_OFFSET_Y = 2;

/** HUD */
const HUD_Y = 16;
const PARKIQ_FONT = '20px';
const HUD_MUTED_FONT = '13px';
const TIMER_FONT = '20px';

/** Objective text */
const OBJECTIVE_Y = 458;

/** Parking card behind the grid — edge-to-edge with subtle padding */
const CARD_X = 0;
const CARD_Y = CONTAINER_Y - 6;
const CARD_W = 390;
const CARD_H = 288 * CONTAINER_SCALE + 12;
const CARD_RADIUS = 14;

/** Driving controls */
const CONTROLS_CENTER_X = 195;
const CONTROLS_CENTER_Y = 590;

/** Timer pulse scale during last 10 seconds */
const TIMER_PULSE_SCALE = 1.15;
const TIMER_PULSE_DURATION = 400;

// ──────────────────────────────────────────────────────────
//  Movement & Collision Constants
// ──────────────────────────────────────────────────────────

/** Forward/reverse speed in container-local px/s */
const MOVE_SPEED = 120;
/** Left/right rotation speed in degrees/s */
const ROTATION_SPEED = 90;
/** Visual scale for the player car image */
const PLAYER_CAR_SCALE = 1.35 * 1.08;
/** Base car sprite dimensions (SVG load size) */
const CAR_W = 72;
const CAR_H = 144;

// ──────────────────────────────────────────────────────────
//  Scene
// ──────────────────────────────────────────────────────────

export class PuzzleScene extends Phaser.Scene {
  private puzzle!: Puzzle;
  private timerText!: Phaser.GameObjects.Text;
  private secondsRemaining = 60;
  /** Guard against double-fire of exit-zone win */
  private exited = false;
  /** Guard: timer expired, showing "Time's Up!" — prevents ticks and input */
  private timeUp = false;
  /** Text object for the "Time's Up!" overlay */
  private timeUpText: Phaser.GameObjects.Text | null = null;
  /** Spawn position for resetting the car */
  private spawnX = 0;
  private spawnY = 0;
  private spawnAngle = 0;
  private timerEvent!: Phaser.Time.TimerEvent;
  /** Whether we are currently in the last-10-seconds pulse state */
  private isTimerPulsing = false;

  /** Player car — plain Image inside the parking container (no physics) */
  private playerCarImage!: Phaser.GameObjects.Image;
  /** Logical car position/orientation in container-local space (pixels, degrees) */
  private carX = 0;
  private carY = 0;
  private carAngle = 0;

  /** Driving input pad */
  private drivingControls!: DrivingControls;

  private get webAudio(): Phaser.Sound.WebAudioSoundManager {
    return this.sound as Phaser.Sound.WebAudioSoundManager;
  }

  constructor() {
    super('PuzzleScene');
  }

  preload(): void {
    this.load.svg('car', 'assets/sprites/car-top-down.svg', {
      width: 72,
      height: 144,
    });
    this.load.audio('tick', 'assets/sounds/tick.mp3');
    this.load.audio('crunch', 'assets/sounds/crunch.mp3');
    this.load.audio('success', 'assets/sounds/success.mp3');
  }

  create(): void {
    this.exited = false;
    this.timeUp = false;
    this.timeUpText = null;
    this.secondsRemaining = 60;
    this.isTimerPulsing = false;

    const data = this.scene.settings.data as { puzzle?: Puzzle } | undefined;
    this.puzzle = data?.puzzle ?? getTodaysPuzzle(new Date());

    this.input.once('pointerdown', () => {
      void this.webAudio.context.resume();
    });

    // Construction order (per spec): background → HUD → objective → controls → grid → obstacles → PlayerCar → timer
    // NOTE: Objective + controls are created BEFORE the Container because Phaser 4 WebGL
    // does not render scene objects created after a Container. Depths are set correctly so
    // they render on top visually despite being created earlier.
    this.renderBackground();
    this.renderParkingCard();
    this.renderHUD();
    this.renderObjective();
    this.renderControls();

    this.renderParkingScene();

    // Clean up player car image when scene shuts down
    this.events.once('shutdown', () => {
      this.playerCarImage.destroy();
    });

  }

  // ──────────────────────────────────────────────────────────
  //  Background — subtle vertical gradient + vignette
  // ──────────────────────────────────────────────────────────

  private renderBackground(): void {
    const W = 390;
    const H = 844;
    const steps = 32;
    const stepH = Math.ceil(H / steps);

    const bg = this.add.graphics();
    bg.setDepth(0);

    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      /** Dark at top → slightly lighter at bottom */
      const c = Math.floor(0x0f + (0x1a - 0x0f) * t);
      const color = (c << 16) | (c << 8) | c;
      bg.fillStyle(color, 1);
      bg.fillRect(0, i * stepH, W, stepH);
    }

    // Vignette: semi-transparent black edges
    const vig = this.add.graphics();
    vig.setDepth(1);
    vig.fillStyle(0x000000, 0.25);
    vig.fillRect(0, 0, W, 18);           // top
    vig.fillRect(0, H - 18, W, 18);      // bottom
    vig.fillRect(0, 0, 10, H);           // left
    vig.fillRect(W - 10, 0, 10, H);      // right
  }

  // ──────────────────────────────────────────────────────────
  //  Parking Card — rounded card behind the grid
  // ──────────────────────────────────────────────────────────

  private renderParkingCard(): void {
    const card = this.add.graphics();
    card.setDepth(3);

    // Drop shadow (offset down-right, blurred via lower alpha)
    card.fillStyle(0x000000, 0.2);
    card.fillRoundedRect(CARD_X + 3, CARD_Y + 4, CARD_W, CARD_H, CARD_RADIUS);

    // Card body
    card.fillStyle(0x1c1c1e, 1);
    card.fillRoundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, CARD_RADIUS);

    // Thin border with uiAccent at low opacity
    card.lineStyle(1, 0xe8320a, 0.15);
    card.strokeRoundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, CARD_RADIUS);
  }

  // ──────────────────────────────────────────────────────────
  //  Parking Scene — Container with grid + obstacle cars + player car
  //  ALL game objects are children of the same container so they share
  //  a single coordinate space (container-local pixels).
  // ──────────────────────────────────────────────────────────

  private renderParkingScene(): void {
    const pc = this.puzzle.playerCar;

    // Store initial car state in container-local pixel coords
    this.spawnX = (pc.x + CONTAINER_OFFSET_X) * UNIT_PX;
    this.spawnY = (pc.y + CONTAINER_OFFSET_Y) * UNIT_PX;
    this.spawnAngle = pc.angle;
    this.carX = this.spawnX;
    this.carY = this.spawnY;
    this.carAngle = this.spawnAngle;

    const container = this.add.container(CONTAINER_X, CONTAINER_Y);
    container.setScale(CONTAINER_SCALE);
    container.setDepth(5);

    // Grid (local position 0,0 within container)
    const grid = createParkingGrid(this, {
      x: 0,
      y: 0,
      width: 288,
      height: 288,
      environment: this.puzzle.environment,
    });
    container.add(grid);

    // Obstacle cars (skip pillars/walls — rendered by ParkingGrid)
    for (const obs of this.puzzle.obstacles) {
      if (obs.type === 'pillar' || obs.type === 'wall') continue;
      const obsImg = createObstacleCar(
        this,
        obs.x + CONTAINER_OFFSET_X,
        obs.y + CONTAINER_OFFSET_Y,
        obs.angle,
      );
      obsImg.setDepth(1);
      container.add(obsImg);
    }

    // Player car — plain Image added as a child of the SAME container.
    // Position in container-local pixel coordinates (same space as obstacles).
    const carImg = this.add.image(this.carX, this.carY, 'car');
    carImg.setTint(0xe8320a).setTintMode(Phaser.TintModes.FILL);
    carImg.setAngle(this.carAngle);
    carImg.setOrigin(0.5, 0.5);
    carImg.setScale(PLAYER_CAR_SCALE);
    carImg.setDepth(50);
    container.add(carImg);
    this.playerCarImage = carImg;
  }



  // ──────────────────────────────────────────────────────────
  //  Objective Text
  // ──────────────────────────────────────────────────────────

  private renderObjective(): void {
    this.add
      .text(195, OBJECTIVE_Y, 'Drive out without hitting another car.', {
        fontSize: '14px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
  }

  // ──────────────────────────────────────────────────────────
  //  HUD — PARKIQ (orange), Puzzle #, Timer, Leaderboard
  // ──────────────────────────────────────────────────────────

  private renderHUD(): void {
    // "PARKIQ" — bold orange, left-aligned
    this.add
      .text(20, HUD_Y, 'PARKIQ', {
        fontSize: PARKIQ_FONT,
        color: '#E8320A',
        fontStyle: 'bold',
      })
      .setDepth(10);

    // "PUZZLE #N" — muted grey, centered
    this.add
      .text(195, HUD_Y + 2, `PUZZLE #${this.puzzle.id}`, {
        fontSize: HUD_MUTED_FONT,
        color: '#6B7280',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    // Timer — right-aligned, white (turns orange in last 10s)
    this.timerText = this.add
      .text(370, HUD_Y, this.formatTime(this.secondsRemaining), {
        fontSize: TIMER_FONT,
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setDepth(10);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      loop: true,
    });

    // Leaderboard trophy icon (below timer)
    const trophy = this.add
      .text(370, HUD_Y + 22, '🏆', {
        fontSize: '14px',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

    trophy.on('pointerdown', () => {
      void this.scene.start('LeaderboardScene');
    });

    trophy.on('pointerover', () => {
      trophy.setStyle({ fontSize: '16px' });
    });

    trophy.on('pointerout', () => {
      trophy.setStyle({ fontSize: '14px' });
    });
  }

  // ──────────────────────────────────────────────────────────
  //  Driving Controls
  // ──────────────────────────────────────────────────────────

  private renderControls(): void {
    this.drivingControls = new DrivingControls(
      this,
      CONTROLS_CENTER_X,
      CONTROLS_CENTER_Y,
      'crunch',
    );
  }

  // ──────────────────────────────────────────────────────────
  //  Update — deterministic image-based movement (no physics)
  // ──────────────────────────────────────────────────────────

  override update(_time: number, delta: number): void {
    if (this.exited || this.timeUp) return;

    const input: DrivingInputState = this.drivingControls.getState();
    const dt = delta / 1000; // seconds

    // ── 1. Rotation (LEFT / RIGHT) ────────────────────────
    if (input.left) {
      this.carAngle -= ROTATION_SPEED * dt;
    }
    if (input.right) {
      this.carAngle += ROTATION_SPEED * dt;
    }

    // ── 2. Compute candidate movement (FORWARD / REVERSE) ──
    let moveDir = 0; // -1 = reverse, 0 = none, +1 = forward
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

    // ── 3. Obstacle collision — reject candidate if overlapping any obstacle ──
    const canMove = !this.checkCollision(candidateX, candidateY);

    if (canMove) {
      this.carX = candidateX;
      this.carY = candidateY;
    }

    // ── 4. Apply to image ─────────────────────────────────
    this.playerCarImage.setPosition(this.carX, this.carY);
    this.playerCarImage.setAngle(this.carAngle);

    // ── 5. Exit zone check — win flow ──────────────────────
    if (!this.exited && this.checkExitReached(this.carX, this.carY)) {
      this.exited = true;

      // Play success sound (try/catch, never crash)
      try {
        this.sound.play('success');
      } catch {
        // Audio context may still be locked
      }

      const timeTaken = 60 - this.secondsRemaining;

      void puzzleComplete({
        timeTaken,
        wasCorrect: true,
        shareBlocks: this.puzzle.shareBlocks ?? [],
        puzzleId: this.puzzle.id,
      }).catch((error) => {
        console.error('[exit] puzzleComplete failed:', error);
      });

      this.timerEvent.destroy();
      void this.scene.start('AlreadyPlayedScene');
    }

  }

  // ──────────────────────────────────────────────────────────
  //  Collision Detection (container-local coordinates)
  //  All geometry is in the same coordinate space as grid/obstacles
  //  — no world-to-local conversion needed.
  // ──────────────────────────────────────────────────────────

  /** Check if a rectangle at (cx, cy) overlaps any obstacle car. */
  private checkCollision(cx: number, cy: number): boolean {
    // Player car rect (centered at origin 0.5, 0.5)
    const playerRect = new Phaser.Geom.Rectangle(
      cx - CAR_W / 2,
      cy - CAR_H / 2,
      CAR_W,
      CAR_H,
    );

    for (const obs of this.puzzle.obstacles) {
      if (obs.type === 'pillar' || obs.type === 'wall') continue;
      // Obstacle car position in container-local coords
      const ox = (obs.x + CONTAINER_OFFSET_X) * UNIT_PX;
      const oy = (obs.y + CONTAINER_OFFSET_Y) * UNIT_PX;
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

  /**
   * Check if the car has reached the exit zone.
   * The exit is defined as the bottom-right quadrant of the parking grid.
   */
  private checkExitReached(cx: number, cy: number): boolean {
    // Exit zone: bottom-right area of the 288×288 grid (local coords)
    const EXIT_X = 192;
    const EXIT_Y = 192;
    const EXIT_W = 96;
    const EXIT_H = 96;

    const carRect = new Phaser.Geom.Rectangle(
      cx - CAR_W / 2,
      cy - CAR_H / 2,
      CAR_W,
      CAR_H,
    );
    const exitRect = new Phaser.Geom.Rectangle(EXIT_X, EXIT_Y, EXIT_W, EXIT_H);

    return Phaser.Geom.Rectangle.Overlaps(carRect, exitRect);
  }

  // ──────────────────────────────────────────────────────────
  //  Timer
  // ──────────────────────────────────────────────────────────

  private onTimerTick(): void {
    if (this.exited || this.timeUp) return;

    if (this.secondsRemaining <= 10) {
      this.timerText.setColor('#E8320A');

      // Start pulsing when we first enter the last-10-seconds zone
      if (!this.isTimerPulsing) {
        this.isTimerPulsing = true;
        this.tweens.add({
          targets: this.timerText,
          scale: TIMER_PULSE_SCALE,
          duration: TIMER_PULSE_DURATION,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      // Tick sound
      if (this.webAudio.context.state === 'running') {
        try {
          this.sound.play('tick');
        } catch {
          // silently skip
        }
      }
    }

    this.secondsRemaining -= 1;

    if (this.secondsRemaining <= 0) {
      this.secondsRemaining = 0;
      this.timerText.setText('0:00');
      // Stop pulse tween
      this.tweens.killTweensOf(this.timerText);
      this.timerText.setScale(1);

      // Show "Time's Up! Try again" overlay
      this.timeUp = true;
      this.timeUpText = this.add
        .text(195, 420, "Time's Up!\nTry again", {
          fontSize: '32px',
          color: '#E8320A',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(200);

      // Remove text after 1000ms, then reset car + timer
      this.time.delayedCall(1000, () => {
        if (this.timeUpText) {
          this.timeUpText.destroy();
          this.timeUpText = null;
        }
        this.timeUp = false;
        this.resetToSpawn();
        this.secondsRemaining = 60;
        this.isTimerPulsing = false;
        this.timerText.setText(this.formatTime(60));
        this.timerText.setColor('#FFFFFF');
        this.timerText.setScale(1);
      });

      return;
    }

    this.timerText.setText(this.formatTime(this.secondsRemaining));
  }

  /**
   * Reset the player car to its spawn position.
   */
  private resetToSpawn(): void {
    this.carX = this.spawnX;
    this.carY = this.spawnY;
    this.carAngle = this.spawnAngle;
    this.playerCarImage.setPosition(this.carX, this.carY);
    this.playerCarImage.setAngle(this.carAngle);
  }

  private formatTime(seconds: number): string {
    const secs = Math.max(0, seconds);
    return `0:${secs.toString().padStart(2, '0')}`;
  }


}
