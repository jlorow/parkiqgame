import Phaser from 'phaser';
import type { Puzzle } from '../puzzles/puzzle-types';
import { puzzles } from '../puzzles/puzzle-data';
import { createParkingGrid } from '../components/ParkingGrid';
import { createCarSprite } from '../components/CarSprite';
import { createObstacleCar } from '../components/ObstacleCar';

/** Grid unit constant from knowledge.md */
const UNIT_PX = 48;

/** Grid origin in scene coordinates (top-left of the 288×288 diagram card) */
const GRID_X = 51;
const GRID_Y = 120;

/**
 * Car centre formula (user-specified):
 *   pixel_x = GRID_X + (col * 48) + 48
 *   pixel_y = GRID_Y + (row * 48) + 96
 *
 * CarSprite internally does config.{x,y} * UNIT_PX, so we compute:
 *   config.x = (GRID_X + col*48 + 48) / UNIT_PX = col + GRID_X/48 + 1
 *   config.y = (GRID_Y + row*48 + 96) / UNIT_PX = row + GRID_Y/48 + 2
 */
const GRID_OFFSET_X = GRID_X / UNIT_PX + 1;
const GRID_OFFSET_Y = GRID_Y / UNIT_PX + 2;

/** Layout constants */
const TOP_BAR_Y = 24;
const PUZZLE_NUM_Y = 54;
const GRID_WH = 288;
const QUESTION_Y = 424;
const TIMER_Y = 488;
const BUTTON_START_Y = 536;
const BUTTON_SPACING = 56;

export class PuzzleScene extends Phaser.Scene {
  /** The active puzzle being rendered */
  private puzzle!: Puzzle;

  /** Timer display text object */
  private timerText!: Phaser.GameObjects.Text;

  /** Remaining seconds on the countdown */
  private secondsRemaining = 60;

  /** Whether an answer has already been submitted (prevents double-taps) */
  private answered = false;

  /** Timer event reference for cleanup */
  private timerEvent!: Phaser.Time.TimerEvent;

  constructor() {
    super('PuzzleScene');
  }

  preload(): void {
    this.load.svg('car', 'assets/sprites/car-top-down.svg', {
      width: 72,
      height: 144,
    });
  }

  create(): void {
    // Reset state for this play-through
    this.answered = false;
    this.secondsRemaining = 60;

    // Receive puzzle from scene data, or default to puzzle 1
    const data = this.scene.settings.data as Partial<{ puzzle: Puzzle }> | undefined;
    this.puzzle = data?.puzzle ?? puzzles[0]!;

    this.renderTopBar();
    this.renderParkingGrid();
    this.renderQuestion();
    this.renderTimer();
    this.renderAnswerButtons();
  }

  // ──────────────────────────────────────────────────────────
  //  Top Bar
  // ──────────────────────────────────────────────────────────

  private renderTopBar(): void {
    // "PARKIQ" — left-aligned
    this.add
      .text(20, TOP_BAR_Y, 'PARKIQ', {
        fontSize: '20px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setDepth(10);

    // "PUZZLE #N" — centered
    this.add
      .text(195, PUZZLE_NUM_Y, `PUZZLE #${this.puzzle.id}`, {
        fontSize: '14px',
        color: '#6B7280',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
  }

  // ──────────────────────────────────────────────────────────
  //  Parking Diagram (Grid + Car Sprites)
  // ──────────────────────────────────────────────────────────

  private renderParkingGrid(): void {
    // Create the background grid card
    createParkingGrid(this, {
      x: GRID_X,
      y: GRID_Y,
      width: GRID_WH,
      height: GRID_WH,
      environment: this.puzzle.environment,
    });

    // Place the player car
    const pc = this.puzzle.playerCar;
    const playerCar = createCarSprite(this, {
      x: pc.x + GRID_OFFSET_X,
      y: pc.y + GRID_OFFSET_Y,
      angle: pc.angle,
      type: 'player',
    });
    playerCar.setDepth(1);

    // Place obstacle cars (sedan, suv, pillar, wall)
    for (const obs of this.puzzle.obstacles) {
      if (obs.type === 'pillar' || obs.type === 'wall') {
        // Pillars and walls are structural — rendered by ParkingGrid.
        // Skip them here to avoid double-rendering.
        continue;
      }
      const car = createObstacleCar(this, obs.x + GRID_OFFSET_X, obs.y + GRID_OFFSET_Y, obs.angle);
      car.setDepth(1);
    }
  }

  // ──────────────────────────────────────────────────────────
  //  Question Text
  // ──────────────────────────────────────────────────────────

  private renderQuestion(): void {
    this.add
      .text(195, QUESTION_Y, this.puzzle.question, {
        fontSize: '16px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        wordWrap: { width: 300 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
  }

  // ──────────────────────────────────────────────────────────
  //  Timer
  // ──────────────────────────────────────────────────────────

  private renderTimer(): void {
    this.timerText = this.add
      .text(195, TIMER_Y, this.formatTime(this.secondsRemaining), {
        fontSize: '24px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    // Tick every second
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      loop: true,
    });
  }

  private onTimerTick(): void {
    if (this.answered) return;

    this.secondsRemaining -= 1;

    if (this.secondsRemaining <= 0) {
      // Timer expired — treat as wrong answer
      this.secondsRemaining = 0;
      this.timerText.setText('0:00');
      this.handleAnswer('E');
      return;
    }

    this.timerText.setText(this.formatTime(this.secondsRemaining));

    // Turn racing red at 10 seconds remaining
    if (this.secondsRemaining <= 10) {
      this.timerText.setColor('#E8320A');
    }
  }

  private formatTime(seconds: number): string {
    const secs = Math.max(0, seconds);
    return `0:${secs.toString().padStart(2, '0')}`;
  }

  // ──────────────────────────────────────────────────────────
  //  Answer Buttons (plain interactive text — NO containers)
  // ──────────────────────────────────────────────────────────

  private renderAnswerButtons(): void {
    const letters = ['A', 'B', 'C', 'D'] as const;
    const options = this.puzzle.options;

    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i]!;
      const optionText = options[letter];
      const y = BUTTON_START_Y + i * BUTTON_SPACING;

      const label = `${letter}: ${optionText}`;

      const btn = this.add
        .text(195, y, label, {
          fontSize: '15px',
          color: '#FFFFFF',
          backgroundColor: '#2A2A2A',
          padding: { x: 20, y: 15 },
          wordWrap: { width: 280 },
        })
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(10);

      btn.on('pointerdown', () => {
        if (this.answered) return;
        this.handleAnswer(letter);
      });

      // Hover effect
      btn.on('pointerover', () => {
        if (!this.answered) {
          btn.setStyle({ backgroundColor: '#3A3A3A' });
        }
      });

      btn.on('pointerout', () => {
        btn.setStyle({ backgroundColor: '#2A2A2A' });
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  //  Answer Handling
  // ──────────────────────────────────────────────────────────

  private handleAnswer(answer: string): void {
    if (this.answered) return;
    this.answered = true;

    // Stop the timer
    this.timerEvent.destroy();

    // Calculate time taken (60 - remaining = actual seconds used)
    const timeTaken = 60 - this.secondsRemaining;

    // Determine if the answer is correct
    const isCorrect = answer === this.puzzle.correctAnswer;

    if (isCorrect) {
      void this.scene.start('CorrectScene', {
        timeTaken,
        puzzle: this.puzzle,
      });
    } else {
      void this.scene.start('WrongAnswerScene', {
        answer,
        puzzle: this.puzzle,
      });
    }
  }

  override update(): void {
    // No per-frame logic needed
  }
}
