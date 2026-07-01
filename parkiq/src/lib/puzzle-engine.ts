import type { Puzzle } from '../game/puzzles/puzzle-types';
import { puzzles } from '../game/puzzles/puzzle-data';

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
