import type { Puzzle } from './puzzle-types';

/**
 * All 15 launch puzzles for ParkIQ.
 * Geometry (col/row/angle/exitZone) matches puzzle-design-doc-v2.md exactly.
 *
 * Tier 1 — Puzzles  1–5:  parallel,    street theme,      angle 0°
 * Tier 2 — Puzzles  6–10: garage,      garage/underground, angle 90°/270°
 * Tier 3 — Puzzles 11–15: reverse_bay, rooftop theme,     angle 180°
 */
export const puzzles: Puzzle[] = [
  // ── TIER 1: BEGINNER (1–5) ─────────────────────────────────────────────────

  {
    id: 1,
    type: 'parallel',
    theme: 'street',
    difficulty: 1,
    question: 'Drive out without hitting another car.',
    environment: 'street',
    playerCar: { col: 2, row: 5, angle: 0 },
    obstacles: [
      { type: 'sedan', col: 0, row: 5, angle: 0 },
      { type: 'suv',   col: 4, row: 5, angle: 0 },
    ],
    exitZone: { col: 2, row: 0, direction: 'top' },
    escapeSteps: [
      { step: 1, description: 'Hold forward — lane is clear.' },
    ],
    expertTip: 'Pure control intro. No decision required.',
  },

  {
    id: 2,
    type: 'parallel',
    theme: 'street',
    difficulty: 2,
    question: 'Drive out without hitting another car.',
    environment: 'street',
    playerCar: { col: 2, row: 5, angle: 0 },
    obstacles: [
      { type: 'sedan', col: 0, row: 1, angle: 0 },
      { type: 'suv',   col: 4, row: 4, angle: 0 },
    ],
    exitZone: { col: 4, row: 0, direction: 'top' },
    escapeSteps: [
      { step: 1, description: 'The left lane (col 0) looks open near the start but is blocked further up.' },
      { step: 2, description: 'The right lane (col 4) has a car close by, but the top is clear — go right.' },
    ],
    expertTip: 'First genuine "which lane is actually safe?" choice.',
  },

  {
    id: 3,
    type: 'parallel',
    theme: 'street',
    difficulty: 2,
    question: 'Drive out without hitting another car.',
    environment: 'street',
    playerCar: { col: 2, row: 5, angle: 0 },
    obstacles: [
      { type: 'sedan', col: 0, row: 2, angle: 0 },
      { type: 'suv',   col: 4, row: 2, angle: 0 },
    ],
    exitZone: { col: 2, row: 0, direction: 'top' },
    escapeSteps: [
      { step: 1, description: 'Drive straight up the middle — the gap between the two cars is wide enough if you stay centered.' },
    ],
    expertTip: 'First "can I fit through that?" moment, but with margin.',
  },

  {
    id: 4,
    type: 'parallel',
    theme: 'street',
    difficulty: 3,
    question: 'Drive out without hitting another car.',
    environment: 'street',
    playerCar: { col: 3, row: 5, angle: 0 },
    obstacles: [
      { type: 'sedan', col: 5, row: 1, angle: 0 },
      { type: 'suv',   col: 1, row: 4, angle: 0 },
    ],
    exitZone: { col: 1, row: 0, direction: 'top' },
    escapeSteps: [
      { step: 1, description: 'Mirror of Puzzle 2 — the right lane looks open but is blocked further up; go left instead.' },
    ],
    expertTip: 'Tests whether the player understood Puzzle 2\'s lesson, not just memorized "go right."',
  },

  {
    id: 5,
    type: 'parallel',
    theme: 'street',
    difficulty: 4,
    question: 'Drive out without hitting another car.',
    environment: 'street',
    playerCar: { col: 2, row: 5, angle: 0 },
    obstacles: [
      { type: 'sedan', col: 0, row: 2, angle: 0 },
      { type: 'suv',   col: 3, row: 2, angle: 0 },
    ],
    exitZone: { col: 1, row: 0, direction: 'top' },
    escapeSteps: [
      { step: 1, description: 'Ease forward and thread precisely between the two cars — there\'s no room for drift either direction.' },
    ],
    expertTip: 'The real "no way that fits" moment. It does, exactly, with zero margin.',
  },

  // ── TIER 2: INTERMEDIATE (6–10) ────────────────────────────────────────────

  {
    id: 6,
    type: 'garage',
    theme: 'garage',
    difficulty: 2,
    question: 'Drive out without hitting another car.',
    environment: 'garage',
    playerCar: { col: 2, row: 5, angle: 90 },
    obstacles: [
      { type: 'sedan', col: 0, row: 2, angle: 0 },
      { type: 'suv',   col: 4, row: 2, angle: 0 },
    ],
    exitZone: { col: 2, row: 0, direction: 'top' },
    escapeSteps: [
      { step: 1, description: 'Turn to face forward, then drive straight through the centered gap.' },
    ],
    expertTip: 'Reintroduces the comfortable squeeze with the added turn step.',
  },

  {
    id: 7,
    type: 'garage',
    theme: 'garage',
    difficulty: 3,
    question: 'Drive out without hitting another car.',
    environment: 'garage',
    playerCar: { col: 2, row: 5, angle: 270 },
    obstacles: [
      { type: 'sedan', col: 0, row: 1, angle: 0 },
      { type: 'suv',   col: 4, row: 4, angle: 0 },
    ],
    exitZone: { col: 4, row: 0, direction: 'top' },
    escapeSteps: [
      { step: 1, description: 'Turn to face forward. The left lane looks safer but dead-ends; go right.' },
    ],
    expertTip: 'Same decision-point shape as Puzzle 2, now with a turn required first.',
  },

  {
    id: 8,
    type: 'garage',
    theme: 'underground',
    difficulty: 4,
    question: 'Drive out without hitting another car.',
    environment: 'garage',
    playerCar: { col: 2, row: 5, angle: 90 },
    obstacles: [
      { type: 'sedan', col: 0, row: 2, angle: 0 },
      { type: 'suv',   col: 3, row: 2, angle: 0 },
    ],
    exitZone: { col: 1, row: 0, direction: 'top' },
    escapeSteps: [
      { step: 1, description: 'Turn to face forward, then thread the gap precisely — same tight fit as Puzzle 5.' },
    ],
    expertTip: 'Combines the turn mechanic with the hardest squeeze so far.',
  },

  {
    id: 9,
    type: 'garage',
    theme: 'underground',
    difficulty: 4,
    question: 'Drive out without hitting another car.',
    environment: 'garage',
    playerCar: { col: 1, row: 5, angle: 90 },
    obstacles: [
      { type: 'sedan', col: 4, row: 4, angle: 0 },
    ],
    exitZone: { col: 4, row: 0, direction: 'top' },
    escapeSteps: [
      { step: 1, description: 'Turn to face forward.' },
      { step: 2, description: "Stay in your starting lane until you're near the top." },
      { step: 3, description: 'Merge right into the lane that opens up close to the exit.' },
    ],
    expertTip: 'Simplified after playtesting found the original two-obstacle version geometrically ambiguous. A single obstacle now creates a clean late-merge decision.',
  },

  {
    id: 10,
    type: 'garage',
    theme: 'underground',
    difficulty: 5,
    question: 'Drive out without hitting another car.',
    environment: 'garage',
    playerCar: { col: 3, row: 5, angle: 270 },
    obstacles: [
      { type: 'sedan', col: 5, row: 2, angle: 0 },
      { type: 'suv',   col: 2, row: 2, angle: 0 },
    ],
    exitZone: { col: 4, row: 0, direction: 'top' },
    escapeSteps: [
      { step: 1, description: 'Turn to face forward, then thread the same tight gap as Puzzle 8, mirrored.' },
    ],
    expertTip: 'Confirms the tight-squeeze skill transfers to the opposite side.',
  },

  // ── TIER 3: ADVANCED (11–15) ───────────────────────────────────────────────

  {
    id: 11,
    type: 'reverse_bay',
    theme: 'rooftop',
    difficulty: 3,
    question: 'Drive out without hitting another car.',
    environment: 'open_lot',
    playerCar: { col: 2, row: 5, angle: 180 },
    obstacles: [
      { type: 'sedan', col: 0, row: 2, angle: 0 },
      { type: 'suv',   col: 4, row: 2, angle: 0 },
    ],
    exitZone: { col: 2, row: 0, direction: 'top' },
    escapeSteps: [
      { step: 1, description: 'Reverse straight back through the centered gap.' },
    ],
    expertTip: 'Reverse version of Puzzle 3 — establishes reversing through a real (if comfortable) gap.',
  },

  {
    id: 12,
    type: 'reverse_bay',
    theme: 'rooftop',
    difficulty: 4,
    question: 'Drive out without hitting another car.',
    environment: 'open_lot',
    playerCar: { col: 2, row: 5, angle: 180 },
    obstacles: [
      { type: 'sedan', col: 0, row: 2, angle: 0 },
      { type: 'suv',   col: 3, row: 2, angle: 0 },
    ],
    exitZone: { col: 1, row: 0, direction: 'top' },
    escapeSteps: [
      { step: 1, description: 'Reverse and thread the gap precisely — no margin, same fit as Puzzle 5/8, now in reverse.' },
    ],
    expertTip: 'Reversing through a zero-margin gap is noticeably harder to judge than driving forward.',
  },

  {
    id: 13,
    type: 'reverse_bay',
    theme: 'rooftop',
    difficulty: 4,
    question: 'Drive out without hitting another car.',
    environment: 'open_lot',
    playerCar: { col: 2, row: 4, angle: 180 },
    obstacles: [
      { type: 'sedan', col: 0, row: 1, angle: 0 },
      { type: 'suv',   col: 4, row: 5, angle: 0 },
    ],
    exitZone: { col: 5, row: 2, direction: 'right' },
    escapeSteps: [
      { step: 1, description: 'Reverse up until clear of the parking row, then turn right and drive forward to the side exit.' },
    ],
    expertTip: 'First side exit combined with reversing — introduces changing direction after the initial reverse.',
  },

  {
    id: 14,
    type: 'reverse_bay',
    theme: 'rooftop',
    difficulty: 5,
    question: 'Drive out without hitting another car.',
    environment: 'open_lot',
    playerCar: { col: 1, row: 5, angle: 180 },
    obstacles: [
      { type: 'sedan', col: 4, row: 4, angle: 0 },
    ],
    exitZone: { col: 4, row: 0, direction: 'top' },
    escapeSteps: [
      { step: 1, description: "Reverse and stay in your starting lane until you're near the top." },
      { step: 2, description: 'Merge right into the lane that opens up close to the exit.' },
    ],
    expertTip: 'Simplified after playtesting found the original two-obstacle version geometrically ambiguous. A single obstacle now creates a clean late-merge decision, done in reverse.',
  },

  {
    id: 15,
    type: 'reverse_bay',
    theme: 'rooftop',
    difficulty: 5,
    question: 'Drive out without hitting another car.',
    environment: 'open_lot',
    playerCar: { col: 1, row: 4, angle: 180 },
    obstacles: [
      { type: 'sedan', col: 3, row: 1, angle: 0 },
      { type: 'suv',   col: 0, row: 1, angle: 0 },
    ],
    exitZone: { col: 5, row: 1, direction: 'right' },
    escapeSteps: [
      { step: 1, description: 'Reverse and steer right, threading the tight gap near the top.' },
      { step: 2, description: 'Then turn right and drive forward to the side exit.' },
    ],
    expertTip: 'Final capstone — combines the hardest squeeze with the side-exit turn.',
  },
];

/**
 * Returns the puzzle for a given sequential ID (1-based).
 * Returns undefined if the ID is out of range (1–15).
 */
export function getPuzzleById(id: number): Puzzle | undefined {
  return puzzles.find((p) => p.id === id);
}
