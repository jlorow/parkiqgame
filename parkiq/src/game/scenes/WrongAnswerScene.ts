import Phaser from 'phaser';
import type { Puzzle, Obstacle } from '../puzzles/puzzle-types';
import { createParkingGrid } from '../components/ParkingGrid';
import { createCarSprite } from '../components/CarSprite';
import { createObstacleCar } from '../components/ObstacleCar';

/** Grid constants — must match PuzzleScene exactly */
const UNIT_PX = 48;
const GRID_X = 51;
const GRID_Y = 120;
const GRID_OFFSET_X = GRID_X / UNIT_PX + 1; // 2.0625
const GRID_OFFSET_Y = GRID_Y / UNIT_PX + 2; // 4.5
const GRID_WH = 288;

/** Valid answer keys for indexing into puzzle.options */
const VALID_ANSWERS = ['A', 'B', 'C', 'D'] as const;

// ──────────────────────────────────────────────────────────
//  Obstacle Resolution
// ──────────────────────────────────────────────────────────

/**
 * Find the obstacle that the wrong answer's description refers to.
 * Extracts the obstacle type keyword from the description and
 * disambiguates multiple matches with directional heuristics.
 */
function findTargetObstacle(
  description: string,
  obstacles: Obstacle[],
): Obstacle | null {
  const typeMatch = description.match(/\b(sedan|suv|pillar|wall)\b/i);
  if (!typeMatch) return null;

  const targetType = typeMatch[1]!.toLowerCase() as Obstacle['type'];
  const candidates = obstacles.filter(
    (o) => o.type.toLowerCase() === targetType,
  );

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0]!;

  // Multiple of the same type — use directional keywords
  const isFront = /\b(front|ahead)\b/i.test(description);
  const isRear = /\b(rear|behind|back)\b/i.test(description);

  if (isFront) {
    // Assume "front" = further along the row (higher column X)
    return candidates.reduce((a, b) => (a.x > b.x ? a : b));
  }
  if (isRear) {
    return candidates.reduce((a, b) => (a.x < b.x ? a : b));
  }

  // Fallback: first match
  return candidates[0]!;
}

// ──────────────────────────────────────────────────────────
//  Scene
// ──────────────────────────────────────────────────────────

export class WrongAnswerScene extends Phaser.Scene {
  /** Reference to the player car sprite for animation */
  private playerCar!: Phaser.GameObjects.Image;

  constructor() {
    super('WrongAnswerScene');
  }

  preload(): void {
    this.load.svg('car', 'assets/sprites/car-top-down.svg', {
      width: 72,
      height: 144,
    });
  }

  create(): void {
    const data = this.scene.settings.data as
      | { answer: string; puzzle: Puzzle }
      | undefined;

    if (!data?.puzzle || !data.answer) {
      this.add
        .text(195, 420, 'No scene data', {
          fontSize: '18px',
          color: '#FFFFFF',
        })
        .setOrigin(0.5)
        .setDepth(10);
      return;
    }

    const { answer, puzzle } = data;
    const isTimeout = answer === 'E';
    const isValidAnswer = VALID_ANSWERS.includes(answer as (typeof VALID_ANSWERS)[number]);
    const optionText = isValidAnswer
      ? puzzle.options[answer as keyof typeof puzzle.options]
      : undefined;

    // ── Render parking diagram ──────────────────────────

    createParkingGrid(this, {
      x: GRID_X,
      y: GRID_Y,
      width: GRID_WH,
      height: GRID_WH,
      environment: puzzle.environment,
    });

    // Place obstacle cars (skip pillars/walls — rendered by ParkingGrid)
    for (const obs of puzzle.obstacles) {
      if (obs.type === 'pillar' || obs.type === 'wall') continue;
      const car = createObstacleCar(
        this,
        obs.x + GRID_OFFSET_X,
        obs.y + GRID_OFFSET_Y,
        obs.angle,
      );
      car.setDepth(1);
    }

    // Place player car
    const pc = puzzle.playerCar;
    this.playerCar = createCarSprite(this, {
      x: pc.x + GRID_OFFSET_X,
      y: pc.y + GRID_OFFSET_Y,
      angle: pc.angle,
      type: 'player',
    });
    this.playerCar.setDepth(2);

    // ── Wrong answer header ─────────────────────────────

    const headerText = isValidAnswer
      ? `${answer}: ${optionText} (Wrong)`
      : isTimeout
        ? 'Time expired! (Wrong)'
        : `${answer}: (Wrong)`;

    this.add
      .text(195, 24, headerText, {
        fontSize: '14px',
        color: '#EF4444',
        fontStyle: 'bold',
        wordWrap: { width: 300 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    // ── Collision animation ─────────────────────────────

    const wrongPathDescription = puzzle.wrongPaths[answer] ?? null;

    if (!isTimeout && wrongPathDescription) {
      const targetObs = findTargetObstacle(wrongPathDescription, puzzle.obstacles);

      if (targetObs) {
        // Pixel positions
        const playerPixelX = (pc.x + GRID_OFFSET_X) * UNIT_PX;
        const playerPixelY = (pc.y + GRID_OFFSET_Y) * UNIT_PX;
        const obstaclePixelX = (targetObs.x + GRID_OFFSET_X) * UNIT_PX;
        const obstaclePixelY = (targetObs.y + GRID_OFFSET_Y) * UNIT_PX;

        // Collision point = midpoint between player car and obstacle
        const collisionX = (playerPixelX + obstaclePixelX) / 2;
        const collisionY = (playerPixelY + obstaclePixelY) / 2;

        // Step 1: Move player car toward obstacle (400ms, ease-in)
        this.tweens.add({
          targets: this.playerCar,
          x: obstaclePixelX,
          y: obstaclePixelY,
          duration: 400,
          ease: 'Power2.easeIn',
          onComplete: () => {
            // Step 2: Impact starburst (200ms)
            this.playImpact(collisionX, collisionY, () => {
              // Step 3: Shake player car (200ms)
              this.playShake(() => {
                // All animation complete — render reveal text
                this.renderReveal(puzzle, wrongPathDescription);
              });
            });
          },
        });
      } else {
        // Could not determine target — skip animation, show reveal
        this.renderReveal(puzzle, wrongPathDescription);
      }
    } else {
      // Timeout or no wrongPath — skip animation, show reveal
      this.renderReveal(puzzle, wrongPathDescription ?? 'Time ran out!');
    }
  }

  // ──────────────────────────────────────────────────────────
  //  Impact Starburst
  // ──────────────────────────────────────────────────────────

  /**
   * Flash a red circle at the collision point.
   * Scale animates: 0 → 1.5 → 0 over 200ms total.
   */
  private playImpact(x: number, y: number, onComplete: () => void): void {
    const impact = this.add.graphics({ x, y });
    impact.fillStyle(0xef4444, 1);
    impact.fillCircle(0, 0, 20);
    impact.setDepth(5);
    impact.setScale(0);

    // Grow to 1.5x over 100ms
    this.tweens.add({
      targets: impact,
      scale: 1.5,
      duration: 100,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // Shrink to 0 over 100ms
        this.tweens.add({
          targets: impact,
          scale: 0,
          duration: 100,
          ease: 'Power2.easeIn',
          onComplete: () => {
            impact.destroy();
            onComplete();
          },
        });
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  //  Shake
  // ──────────────────────────────────────────────────────────

  /**
   * Shake the player car horizontally ±8px for 200ms.
   * 4 cycles (each = yoyo pair of 50ms total → 25ms each leg).
   */
  private playShake(onComplete: () => void): void {
    const startX = this.playerCar.x;

    this.tweens.add({
      targets: this.playerCar,
      x: startX + 8,
      duration: 25,
      yoyo: true,
      repeat: 3, // 4 cycles (initial + 3 repeats)
      ease: 'Quad.easeInOut',
      onComplete: () => {
        // Restore to original position
        this.playerCar.x = startX;
        onComplete();
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  //  Reveal Text
  // ──────────────────────────────────────────────────────────

  /**
   * Render the collision reason, correct answer pill, and
   * "Try Again Tomorrow" text after animation completes.
   */
  private renderReveal(
    puzzle: Puzzle,
    wrongPathDescription: string,
  ): void {
    const correctAnswer = puzzle.correctAnswer;
    const correctText = puzzle.options[correctAnswer];

    // Collision reason
    this.add
      .text(195, 440, wrongPathDescription, {
        fontSize: '14px',
        color: '#FFFFFF',
        wordWrap: { width: 300 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    // Correct answer reveal (green pill)
    this.add
      .text(195, 475, `Correct Answer: ${correctAnswer} ${correctText}`, {
        fontSize: '14px',
        color: '#22C55E',
        fontStyle: 'bold',
        wordWrap: { width: 300 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    // Try Again Tomorrow (muted, not tappable)
    this.add
      .text(195, 520, 'Try Again Tomorrow', {
        fontSize: '13px',
        color: '#6B7280',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
  }

  override update(): void {
    // No per-frame logic needed
  }
}
