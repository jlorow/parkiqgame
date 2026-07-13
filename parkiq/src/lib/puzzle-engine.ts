import type { Puzzle } from '../game/puzzles/puzzle-types';
import { puzzles, bonusPuzzle } from '../game/puzzles/puzzle-data';

// ── Grid constants (mirror PuzzleScene.ts values) ──────────────────────
const UNIT_PX = 48;
const CONTAINER_OFFSET_X = 0.5;
const CONTAINER_OFFSET_Y = 0.5;

/**
 * Converts a legacy grid-based puzzle (using col/row) into a normalized
 * pixel-based puzzle (with x/y populated) for in-memory use by the engine.
 *
 * Consolidation logic (per the single-source-of-truth design):
 * - puzzle.parkingType is a LEGACY INPUT field, read only by this converter.
 *   Its value is copied to exitZone.parkingType (the engine's new source of truth).
 * - Same for puzzle.parkingAngle → exitZone.angle.
 * - Puzzle.parkingType/parkingAngle are only copied when explicitly set.
 *   The 13 of 15 puzzles that never had parkingType remain undefined on
 *   exitZone.parkingType, preserving their legacy 96×96 exit zone behavior.
 * - Freeform-authored puzzles (with x/y/angle already set) pass through unchanged.
 *
 * Returns a new Puzzle object — original static data is never mutated.
 */
export function convertGridToPixel(puzzle: Puzzle): Puzzle {
  // --- Player car ---
  const playerCar = {
    ...puzzle.playerCar,
    x: puzzle.playerCar.x ?? (puzzle.playerCar.col + CONTAINER_OFFSET_X) * UNIT_PX,
    y: puzzle.playerCar.y ?? (puzzle.playerCar.row + CONTAINER_OFFSET_Y) * UNIT_PX,
  };

  // --- Obstacles ---
  const obstacles = puzzle.obstacles.map((obs) => ({
    ...obs,
    x: obs.x ?? (obs.col + CONTAINER_OFFSET_X) * UNIT_PX,
    y: obs.y ?? (obs.row + CONTAINER_OFFSET_Y) * UNIT_PX,
  }));

  // --- Exit zone (field consolidation: puzzle-level → exit-zone-level) ---
  const exitZone = {
    ...puzzle.exitZone,
    x: puzzle.exitZone.x ?? (puzzle.exitZone.col + CONTAINER_OFFSET_X) * UNIT_PX,
    y: puzzle.exitZone.y ?? (puzzle.exitZone.row + CONTAINER_OFFSET_Y) * UNIT_PX,
    angle: puzzle.exitZone.angle ?? puzzle.parkingAngle,
    parkingType: puzzle.exitZone.parkingType ?? puzzle.parkingType,
  };

  return { ...puzzle, playerCar, obstacles, exitZone };
}

// ── Puzzle validation — fires once at import, catches row-5 obstacles ─────
function validatePuzzleData(): void {
  for (const p of puzzles) {
    for (const obs of p.obstacles) {
      if (obs.row < 1 || obs.row > 4) {
        throw new Error(
          `Puzzle ${p.id}: obstacle at col ${obs.col} row ${obs.row} — ` +
          'obstacle rows must be in 1–4 (row 0 reserved for exit, row 5 reserved for player spawn).',
        );
      }
    }
  }
}
validatePuzzleData();

/**
 * Launch date for ParkIQ (June 29, 2026).
 * Puzzle index = days since this date modulo 15.
 */
const LAUNCH_DATE = new Date('2026-06-29');

/**
 * Returns the puzzle for a given server-provided date.
 *
 * The puzzle index is derived deterministically:
 *   index = floor((serverDate - LAUNCH_DATE) / 1 day) % 15
 *
 * If the date is before the launch date, puzzle 0 is returned
 * (the first puzzle, acting as a trailer/preview).
 *
 * @param serverDate - The server-side date (not device clock) to avoid spoofing.
 * @returns The Puzzle for the given date.
 */
export function getTodaysPuzzle(serverDate: Date): Puzzle {
  const msSinceLaunch = serverDate.getTime() - LAUNCH_DATE.getTime();

  if (msSinceLaunch < 0) {
    // Date is before launch — return first puzzle as preview
    return convertGridToPixel(puzzles[0]!);
  }

  const daysElapsed = Math.floor(msSinceLaunch / (1000 * 60 * 60 * 24));
  const index = daysElapsed % puzzles.length;

  return convertGridToPixel(puzzles[index]!);
}

export function getPuzzleByIndex(index: number): Puzzle {
  const clamped = index < 1 ? 1 : ((index - 1) % 15) + 1;
  const puzzle = puzzles.find((p) => p.id === clamped);
  if (!puzzle) throw new Error(`No puzzle found for id ${clamped}`);
  return convertGridToPixel(puzzle);
}

/**
 * Returns the bonus Dual-Train Scissor Trap puzzle (ID 16).
 * This puzzle is OUTSIDE the normal 15-puzzle daily rotation and does NOT
 * affect getPuzzleByIndex or any existing rotation logic.
 */
export function getBonusPuzzle(): Puzzle {
  return convertGridToPixel(bonusPuzzle);
}
