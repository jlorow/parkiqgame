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
 *   The grid-based puzzles that never had parkingType remain undefined on
 *   exitZone.parkingType, preserving their legacy 96×96 exit zone behavior.
 * - Freeform-authored puzzles (with x/y/angle already set) pass through unchanged.
 *
 * Returns a new Puzzle object — original static data is never mutated.
 */
export function convertGridToPixel(puzzle: Puzzle): Puzzle {
  // --- Player car ---
  const playerCar = {
    ...puzzle.playerCar,
    x: puzzle.playerCar.x ?? ((puzzle.playerCar.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX,
    y: puzzle.playerCar.y ?? ((puzzle.playerCar.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX,
  };

  // --- Obstacles ---
  const obstacles = puzzle.obstacles.map((obs) => ({
    ...obs,
    x: obs.x ?? ((obs.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX,
    y: obs.y ?? ((obs.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX,
  }));

  // --- Exit zone (field consolidation: puzzle-level → exit-zone-level) ---
  // Resolve angle/parkingType first so we can conditionally spread only when defined
  const resolvedAngle = puzzle.exitZone.angle ?? puzzle.parkingAngle;
  const resolvedParkingType = puzzle.exitZone.parkingType ?? puzzle.parkingType;

  const exitZone = {
    ...puzzle.exitZone,
    x: puzzle.exitZone.x ?? ((puzzle.exitZone.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX,
    y: puzzle.exitZone.y ?? ((puzzle.exitZone.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX,
    ...(resolvedAngle !== undefined ? { angle: resolvedAngle } : {}),
    ...(resolvedParkingType !== undefined ? { parkingType: resolvedParkingType } : {}),
  };

  return { ...puzzle, playerCar, obstacles, exitZone };
}

// ── Puzzle validation — fires once at import ────────────────────────────
// Handles both legacy grid-based (col/row) and new freeform pixel-based (x/y) puzzles.
// Grid validation: rows 1–4 for obstacles.
// Freeform validation: x,y in 0–288 playfield bounds.
function validatePuzzleData(): void {
  const PLAYFIELD = 288;

  for (const p of puzzles) {
    // ── Player car ────────────────────────────────────────────────────
    const pc = p.playerCar;
    if (pc.x !== undefined || pc.y !== undefined) {
      if (pc.x !== undefined && (pc.x < 0 || pc.x > PLAYFIELD)) {
        throw new Error(
          `Puzzle ${p.id}: playerCar x=${pc.x} — must be 0–${PLAYFIELD}.`,
        );
      }
      if (pc.y !== undefined && (pc.y < 0 || pc.y > PLAYFIELD)) {
        throw new Error(
          `Puzzle ${p.id}: playerCar y=${pc.y} — must be 0–${PLAYFIELD}.`,
        );
      }
    }

    // ── Obstacles ────────────────────────────────────────────────────
    for (const obs of p.obstacles) {
      if (obs.x !== undefined || obs.y !== undefined) {
        // Freeform pixel-based: validate playfield bounds
        if (obs.x !== undefined && (obs.x < 0 || obs.x > PLAYFIELD)) {
          throw new Error(
            `Puzzle ${p.id}: obstacle x=${obs.x} — must be 0–${PLAYFIELD}.`,
          );
        }
        if (obs.y !== undefined && (obs.y < 0 || obs.y > PLAYFIELD)) {
          throw new Error(
            `Puzzle ${p.id}: obstacle y=${obs.y} — must be 0–${PLAYFIELD}.`,
          );
        }
      } else {
        // Legacy grid-based: validate row range
        if ((obs.row ?? 0) < 1 || (obs.row ?? 0) > 4) {
          throw new Error(
            `Puzzle ${p.id}: obstacle at col ${obs.col ?? 0} row ${obs.row ?? 0} — ` +
            'obstacle rows must be in 1–4 (row 0 reserved for exit, row 5 reserved for player spawn).',
          );
        }
      }
    }

    // ── Exit zone ────────────────────────────────────────────────────
    const ez = p.exitZone;
    if (ez.x !== undefined || ez.y !== undefined) {
      if (ez.x !== undefined && (ez.x < 0 || ez.x > PLAYFIELD)) {
        throw new Error(
          `Puzzle ${p.id}: exitZone x=${ez.x} — must be 0–${PLAYFIELD}.`,
        );
      }
      if (ez.y !== undefined && (ez.y < 0 || ez.y > PLAYFIELD)) {
        throw new Error(
          `Puzzle ${p.id}: exitZone y=${ez.y} — must be 0–${PLAYFIELD}.`,
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
 *   index = floor((serverDate - LAUNCH_DATE) / 1 day) % puzzles.length
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
  const clamped = index < 1 ? 1 : ((index - 1) % puzzles.length) + 1;
  const puzzle = puzzles.find((p) => p.id === clamped);
  if (!puzzle) throw new Error(`No puzzle found for id ${clamped}`);
  return convertGridToPixel(puzzle);
}

/**
 * Returns the bonus Dual-Train Scissor Trap puzzle (ID 16).
 * This puzzle is OUTSIDE the normal daily rotation and does NOT
 * affect getPuzzleByIndex or any existing rotation logic.
 */
export function getBonusPuzzle(): Puzzle {
  return convertGridToPixel(bonusPuzzle);
}
