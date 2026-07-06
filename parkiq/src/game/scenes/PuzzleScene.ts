import Phaser from 'phaser';
import type { Puzzle } from '../puzzles/puzzle-types';
import { createParkingGrid } from '../components/ParkingGrid';
import { createObstacleCar } from '../components/ObstacleCar';
import { DrivingControls } from '../components/DrivingControls';
import type { DrivingInputState } from '../components/DrivingControls';
import { getPuzzleByIndex } from '../../lib/puzzle-engine';
import { puzzleComplete, getProgress } from '../../lib/devvit-client';

// ──────────────────────────────────────────────────────────
//  Layout Constants
// ──────────────────────────────────────────────────────────

const UNIT_PX = 48;
const CONTAINER_SCALE = 1.35;
const CONTAINER_X = 1;
const CONTAINER_Y = 52;
const CONTAINER_OFFSET_X = 1;
const CONTAINER_OFFSET_Y = 2;

const HUD_Y = 16;
const PARKIQ_FONT = '20px';
const HUD_MUTED_FONT = '13px';

const OBJECTIVE_Y = 458;

const CARD_X = 0;
const CARD_Y = CONTAINER_Y - 6;
const CARD_W = 390;
const CARD_H = 288 * CONTAINER_SCALE + 12;
const CARD_RADIUS = 14;

const CONTROLS_CENTER_X = 195;
const CONTROLS_CENTER_Y = 590;

// ──────────────────────────────────────────────────────────
//  Movement & Collision Constants
// ──────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────
//  Exit Zone Constants (shared by visual and hitbox)
// ──────────────────────────────────────────────────────────

const EXIT_X = 192;
const EXIT_Y = 192;
const EXIT_W = 96;
const EXIT_H = 96;

const MOVE_SPEED = 120;
const ROTATION_SPEED = 90;
const PLAYER_CAR_SCALE = 1.35 * 1.08;
const CAR_W = 72;
const CAR_H = 144;

// ──────────────────────────────────────────────────────────
//  Scene
// ──────────────────────────────────────────────────────────

export class PuzzleScene extends Phaser.Scene {
  private puzzle!: Puzzle;
  /** Guard against double-fire of exit-zone win */
  private exited = false;
  /** Silent elapsed-time counter — no UI, only used for timeTaken in puzzleComplete() */
  private elapsedSeconds = 0;
  private elapsedEvent!: Phaser.Time.TimerEvent;
  /** Spawn position for resetting the car on collision */
  private spawnX = 0;
  private spawnY = 0;
  private spawnAngle = 0;

  /** Player car — plain Image inside the parking container (no physics) */
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
    this.load.audio('crunch', 'assets/sounds/crunch.mp3');
    this.load.audio('success', 'assets/sounds/success.mp3');
  }

  create(): void {
    this.exited = false;
    this.ready = false;
    this.elapsedSeconds = 0;

    this.input.once('pointerdown', () => {
      void this.webAudio.context.resume();
    });

    this.renderBackground();
    this.renderParkingCard();

    // Puzzle loads asynchronously — render static chrome first, then fetch progress
    void this.loadAndRender();
  }

  // ──────────────────────────────────────────────────────────
  //  Index-based puzzle loading (Step 1)
  // ──────────────────────────────────────────────────────────

  private async loadAndRender(): Promise<void> {
    const { puzzleIndex } = await getProgress();
    this.puzzle = getPuzzleByIndex(puzzleIndex);

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
  //  Background
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
  //  Parking Card
  // ──────────────────────────────────────────────────────────

  private renderParkingCard(): void {
    const card = this.add.graphics();
    card.setDepth(3);
    card.fillStyle(0x000000, 0.2);
    card.fillRoundedRect(CARD_X + 3, CARD_Y + 4, CARD_W, CARD_H, CARD_RADIUS);
    card.fillStyle(0x1c1c1e, 1);
    card.fillRoundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, CARD_RADIUS);
    card.lineStyle(1, 0xe8320a, 0.15);
    card.strokeRoundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, CARD_RADIUS);
  }

  // ──────────────────────────────────────────────────────────
  //  Parking Scene — Container with grid + obstacles + player car
  // ──────────────────────────────────────────────────────────

  private renderParkingScene(): void {
    const pc = this.puzzle.playerCar;

    this.spawnX = (pc.x + CONTAINER_OFFSET_X) * UNIT_PX;
    this.spawnY = (pc.y + CONTAINER_OFFSET_Y) * UNIT_PX;
    this.spawnAngle = pc.angle;
    this.carX = this.spawnX;
    this.carY = this.spawnY;
    this.carAngle = this.spawnAngle;

    const container = this.add.container(CONTAINER_X, CONTAINER_Y);
    container.setScale(CONTAINER_SCALE);
    container.setDepth(5);
    this.parkingContainer = container;

    const grid = createParkingGrid(this, {
      x: 0,
      y: 0,
      width: 288,
      height: 288,
      environment: this.puzzle.environment,
    });
    container.add(grid);

    // Exit zone visual — layer 2 (above grid, below obstacles/player)
    const exitGfx = this.add.graphics();
    exitGfx.fillStyle(0x22c55e, 0.35);
    exitGfx.fillRect(EXIT_X, EXIT_Y, EXIT_W, EXIT_H);
    container.add(exitGfx);
    this.tweens.add({
      targets: exitGfx,
      alpha: { from: 0.3, to: 0.5 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

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
  //  HUD — PARKIQ (orange), Puzzle #, Leaderboard
  //  No timer text rendered (Step 2).
  // ──────────────────────────────────────────────────────────

  private renderHUD(): void {
    this.add
      .text(20, HUD_Y, 'PARKIQ', {
        fontSize: PARKIQ_FONT,
        color: '#E8320A',
        fontStyle: 'bold',
      })
      .setDepth(10);

    this.puzzleNumberText = this.add
      .text(195, HUD_Y + 2, `PUZZLE #${this.puzzle.id}`, {
        fontSize: HUD_MUTED_FONT,
        color: '#6B7280',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    const trophy = this.add
      .text(370, HUD_Y, '🏆', { fontSize: '14px' })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

    trophy.on('pointerdown', () => {
      void this.scene.start('LeaderboardScene');
    });
    trophy.on('pointerover', () => { trophy.setStyle({ fontSize: '16px' }); });
    trophy.on('pointerout', () => { trophy.setStyle({ fontSize: '14px' }); });
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

    // ── 3. Collision — reject candidate if overlapping any obstacle ──
    const canMove = !this.checkCollision(candidateX, candidateY);

    if (canMove) {
      this.carX = candidateX;
      this.carY = candidateY;
    } else if (moveDir !== 0) {
      // Collision: play crunch, reset to spawn (knowledge.md spec)
      try { this.sound.play('crunch'); } catch { /* audio locked */ }
      this.resetToSpawn();
    }

    // ── 4. Apply to image ──────────────────────────────────
    this.playerCarImage.setPosition(this.carX, this.carY);
    this.playerCarImage.setAngle(this.carAngle);

    // ── 5. Exit zone check — win flow (Step 3) ─────────────
    if (!this.exited && this.checkExitReached(this.carX, this.carY)) {
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
      wasCorrect: true,
      shareBlocks: this.puzzle.shareBlocks ?? [],
      puzzleId: this.puzzle.id,
    }).catch((error: unknown) => {
      console.error('[exit] puzzleComplete failed:', error);
      return { streak: 0, score: 0, puzzleIndex: this.puzzle.id >= 15 ? 1 : this.puzzle.id + 1 };
    });

    // 3. If puzzle 15 cleared — show celebration overlay briefly
    if (this.puzzle.id === 15) {
      await this.showClearedOverlay();
    }

    // 4. Load next puzzle in place
    const nextIndex = result.puzzleIndex ?? (this.puzzle.id >= 15 ? 1 : this.puzzle.id + 1);
    this.loadNextPuzzleInPlace(nextIndex);
  }

  private showClearedOverlay(): Promise<void> {
    return new Promise((resolve) => {
      const overlay = this.add
        .text(195, 420, 'You cleared all puzzles!', {
          fontSize: '28px',
          color: '#E8320A',
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
    const playerRect = new Phaser.Geom.Rectangle(
      cx - CAR_W / 2,
      cy - CAR_H / 2,
      CAR_W,
      CAR_H,
    );

    for (const obs of this.puzzle.obstacles) {
      if (obs.type === 'pillar' || obs.type === 'wall') continue;
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

  private checkExitReached(cx: number, cy: number): boolean {
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
  //  Collision reset — unchanged from prior epics
  // ──────────────────────────────────────────────────────────

  private resetToSpawn(): void {
    this.carX = this.spawnX;
    this.carY = this.spawnY;
    this.carAngle = this.spawnAngle;
    this.playerCarImage.setPosition(this.carX, this.carY);
    this.playerCarImage.setAngle(this.carAngle);
  }
}
