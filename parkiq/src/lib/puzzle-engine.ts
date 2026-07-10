import type { Puzzle } from '../game/puzzles/puzzle-types';
import { puzzles } from '../game/puzzles/puzzle-data';

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
    return puzzles[0]!;
  }

  const daysElapsed = Math.floor(msSinceLaunch / (1000 * 60 * 60 * 24));
  const index = daysElapsed % puzzles.length;

  return puzzles[index]!;
}

export function getPuzzleByIndex(index: number): Puzzle {
  const clamped = index < 1 ? 1 : ((index - 1) % 15) + 1;
  const puzzle = puzzles.find((p) => p.id === clamped);
  if (!puzzle) throw new Error(`No puzzle found for id ${clamped}`);
  return puzzle;
}
