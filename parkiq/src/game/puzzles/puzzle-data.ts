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
    backgroundImage: 'puzzle1-bg.webp',
obstacles: [
  { type: 'sedan', x: 76, y: 72, angle: 315 },
  { type: 'sedan', x: 212, y: 76, angle: 45 },
  { type: 'tree-sm', x: 33, y: 61, angle: 0 },
  { type: 'tree-sm', x: 260, y: 93, angle: 0 },
  { type: 'sedan', x: 71, y: 140, angle: 315 },
  { type: 'tree-sm', x: 257, y: 245, angle: 0 },
  { type: 'tree-sm', x: 22, y: 231, angle: 0 },
  { type: 'tree-sm', x: 17, y: 121, angle: 0 },
],
playerCar: { x: 143, y: 249, angle: 0 },
exitZone: { x: 216, y: 146, angle: 45, parkingType: 'angled' },
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
    backgroundImage: 'puzzle2-bg.webp',
  obstacles: [
  { type: 'sedan', x: 220, y: 215, angle: 90 },
  { type: 'sedan', x: 71, y: 215, angle: 270 },
  { type: 'suv', x: 72, y: 143, angle: 270 },
  { type: 'suv', x: 218, y: 144, angle: 90 },
  { type: 'tree-sm', x: 253, y: 180, angle: 0 },
  { type: 'tree-sm', x: 255, y: 109, angle: 0 },
  { type: 'tree-sm', x: 23, y: 178, angle: 0 },
  { type: 'tree-sm', x: 20, y: 104, angle: 0 },
],
playerCar: { x: 146, y: 256, angle: 0 },
exitZone: { x: 74, y: 72, angle: 270, parkingType: 'perpendicular' },
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
    backgroundImage: 'puzzle3-bg.webp',
    obstacles: [
  { type: 'sedan', x: 48, y: 138, angle: 0 },
  { type: 'tree-sm', x: 39, y: 240, angle: 0 },
  { type: 'tree-sm', x: 245, y: 236, angle: 0 },
  { type: 'tree-sm', x: 245, y: 61, angle: 0 },
  { type: 'sedan', x: 178, y: 185, angle: 0 },
  { type: 'tree-sm', x: 33, y: 58, angle: 0 },
  { type: 'sedan', x: 236, y: 142, angle: 0 },
],
playerCar: { x: 124, y: 228, angle: 180 },
exitZone: { x: 106, y: 95, angle: 0, parkingType: 'parallel' },
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
    backgroundImage: 'puzzle4-bg.webp',
   obstacles: [
  { type: 'wall', x: 270, y: 130, angle: 0 },
  { type: 'wall', x: 270, y: 63, angle: 0 },
  { type: 'wall', x: 270, y: 207, angle: 0 },
  { type: 'suv', x: 203, y: 81, angle: 45 },
  { type: 'suv', x: 128, y: 123, angle: 0 },
],
playerCar: { x: 69, y: 122, angle: 0 },
exitZone: { x: 218, y: 208, angle: 45, parkingType: 'parallel' },
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
    backgroundImage: 'puzzle5-bg.webp',
   obstacles: [
  { type: 'wall', x: 246, y: 103, angle: 0 },
  { type: 'wall', x: 246, y: 151, angle: 0 },
  { type: 'wall', x: 246, y: 204, angle: 0 },
  { type: 'tree-sm', x: 29, y: 177, angle: 0 },
  { type: 'tree-sm', x: 28, y: 126, angle: 0 },
  { type: 'tree-sm', x: 246, y: 124, angle: 0 },
  { type: 'tree-sm', x: 245, y: 176, angle: 0 },
  { type: 'sedan', x: 88, y: 106, angle: 270 },
  { type: 'cone', x: 81, y: 149, angle: 0 },
],
playerCar: { x: 80, y: 204, angle: 0 },
exitZone: { x: 181, y: 152, angle: 90, parkingType: 'parallel' },
    parkingType: 'parallel',
    parkingAngle: 0,
    escapeSteps: [
      { step: 1, description: 'Pass between the two parked cars — stay centered in the gap.' },
      { step: 2, description: 'Turn hard left toward the exit bay at the far left edge.' },
      { step: 3, description: 'Straighten out and park in the bay.' },
    ],
    expertTip: 'Pass between both cars, then steer sharply left — you have room to straighten out in the exit bay. The angle check is forgiving, but you must be pointed forward when you stop.',
  },

  // ── TIER 2: INTERMEDIATE (6–10) ────────────────────────────────────────────

  {
    id: 6,
    type: 'garage',
    theme: 'garage',
    difficulty: 2,
    question: 'Drive out without hitting another car.',
    environment: 'garage',
    backgroundImage: 'puzzle6-bg.webp',
   obstacles: [
  { type: 'tree-sm', x: 265, y: 149, angle: 0 },
  { type: 'sedan', x: 50, y: 76, angle: 0 },
  { type: 'sedan', x: 235, y: 232, angle: 0 },
],
playerCar: { x: 235, y: 61, angle: 0 },
exitZone: { x: 52, y: 234, angle: 0, parkingType: 'parallel' },
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
    backgroundImage: 'puzzle7-bg.webp',
    obstacles: [
  { type: 'sedan', x: 110, y: 64, angle: 315 },
  { type: 'tree-sm', x: 82, y: 154, angle: 0 },
  { type: 'tree-sm', x: 212, y: 162, angle: 0 },
  { type: 'tree-sm', x: 82, y: 90, angle: 0 },
],
playerCar: { x: 178, y: 71, angle: 210 },
exitZone: { x: 117, y: 215, angle: 315, parkingType: 'parallel' },
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
    backgroundImage: 'puzzle8-bg.webp',
    obstacles: [
  { type: 'tree-sm', x: 33, y: 113, angle: 0 },
  { type: 'tree-sm', x: 32, y: 176, angle: 0 },
  { type: 'tree-sm', x: 24, y: 249, angle: 0 },
  { type: 'tree-sm', x: 260, y: 246, angle: 0 },
  { type: 'tree-sm', x: 264, y: 174, angle: 0 },
  { type: 'tree-sm', x: 261, y: 108, angle: 0 },
  { type: 'suv', x: 71, y: 73, angle: 45 },
  { type: 'sedan', x: 221, y: 218, angle: 315 },
],
playerCar: { x: 72, y: 214, angle: 45 },
exitZone: { x: 214, y: 72, angle: 135, parkingType: 'angled' },
    escapeSteps: [
      { step: 1, description: 'Turn to face forward.' },
      { step: 2, description: 'Ease forward while drifting slightly left toward the center of the gap.' },
      { step: 3, description: 'Hold that line precisely as you pass between the two cars.' },
      { step: 4, description: 'Continue straight to the exit.' },
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
    backgroundImage: 'puzzle9-bg.webp',
   obstacles: [
  { type: 'tree-sm', x: 242, y: 203, angle: 0 },
  { type: 'tree-sm', x: 235, y: 83, angle: 0 },
  { type: 'sedan', x: 218, y: 111, angle: 135 },
  { type: 'suv', x: 218, y: 178, angle: 45 },
  { type: 'sedan', x: 72, y: 110, angle: 60 },
  { type: 'tree-sm', x: 64, y: 60, angle: 0 },
],
playerCar: { x: 61, y: 183, angle: 45 },
exitZone: { x: 148, y: 112, angle: 135, parkingType: 'angled' },
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
    backgroundImage: 'puzzle10-bg.webp',
   obstacles: [
  { type: 'wall', x: 29, y: 156, angle: 0 },
  { type: 'wall', x: 29, y: 237, angle: 0 },
  { type: 'suv', x: 61, y: 163, angle: 0 },
  { type: 'shrub-1', x: 228, y: 85, angle: 0 },
  { type: 'shrub-1', x: 248, y: 202, angle: 0 },
  { type: 'shrub-1', x: 251, y: 137, angle: 0 },
],
playerCar: { x: 94, y: 242, angle: 270 },
exitZone: { x: 63, y: 72, angle: 0, parkingType: 'perpendicular' },
    escapeSteps: [
      { step: 1, description: 'Turn to face forward first.' },
      { step: 2, description: 'Ease forward while drifting slightly right toward the center of the gap.' },
      { step: 3, description: 'Hold that line precisely as you pass between the two cars.' },
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
    backgroundImage: 'puzzle11-bg.webp',
    obstacles: [
  { type: 'sedan', x: 68, y: 209, angle: 0 },
  { type: 'sedan', x: 217, y: 68, angle: 180 },
  { type: 'suv', x: 139, y: 66, angle: 0 },
  { type: 'tree-sm', x: 257, y: 71, angle: 0 },
  { type: 'tree-sm', x: 21, y: 71, angle: 0 },
  { type: 'tree-sm', x: 21, y: 206, angle: 0 },
  { type: 'tree-sm', x: 264, y: 206, angle: 0 },
],
playerCar: { x: 67, y: 66, angle: 180 },
exitZone: { x: 215, y: 200, angle: 180, parkingType: 'perpendicular' },
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
    backgroundImage: 'puzzle12-bg.webp',
   obstacles: [
  { type: 'shrub-1', x: 37, y: 232, angle: 0 },
  { type: 'shrub-1', x: 241, y: 240, angle: 0 },
  { type: 'sedan', x: 188, y: 193, angle: 90 },
  { type: 'tree-sm', x: 253, y: 58, angle: 0 },
  { type: 'barricade', x: 34, y: 65, angle: 0 },
  { type: 'cone', x: 189, y: 61, angle: 0 },
],
playerCar: { x: 124, y: 256, angle: 0 },
exitZone: { x: 198, y: 134, angle: 90, parkingType: 'parallel' },
    escapeSteps: [
      { step: 1, description: 'Reverse while drifting slightly left toward the center of the gap.' },
      { step: 2, description: 'Hold that line precisely as you reverse between the two cars.' },
      { step: 3, description: 'Continue straight back to the exit.' },
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
    backgroundImage: 'puzzle13-bg.webp',
   obstacles: [
  { type: 'tree-sm', x: 88, y: 58, angle: 45 },
  { type: 'tree-sm', x: 164, y: 57, angle: 45 },
  { type: 'sedan', x: 140, y: 91, angle: 315 },
  { type: 'barricade', x: 170, y: 184, angle: 0 },
  { type: 'tree-sm', x: 24, y: 137, angle: 0 },
  { type: 'tree-sm', x: 262, y: 255, angle: 0 },
  { type: 'suv', x: 71, y: 91, angle: 315 },
],
playerCar: { x: 39, y: 242, angle: 45 },
exitZone: { x: 227, y: 100, angle: 315, parkingType: 'angled' },
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
    backgroundImage: 'puzzle14-bg.webp',
   obstacles: [
  { type: 'wall', x: 52, y: 54, angle: 0 },
  { type: 'wall', x: 52, y: 129, angle: 0 },
  { type: 'wall', x: 52, y: 200, angle: 0 },
  { type: 'tree-sm', x: 24, y: 159, angle: 0 },
  { type: 'tree-sm', x: 24, y: 79, angle: 0 },
  { type: 'tree-sm', x: 24, y: 251, angle: 0 },
  { type: 'tree-sm', x: 166, y: 132, angle: 0 },
  { type: 'tree-sm', x: 280, y: 46, angle: 0 },
  { type: 'tree-sm', x: 263, y: 262, angle: 0 },
],
playerCar: { x: 119, y: 78, angle: 315 },
exitZone: { x: 123, y: 223, angle: 315, parkingType: 'angled' },
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
    backgroundImage: 'puzzle15-bg.webp',
   obstacles: [
  { type: 'tree', x: 40, y: 68, angle: 0 },
  { type: 'shrub-1', x: 39, y: 154, angle: 0 },
  { type: 'barricade-1', x: 80, y: 197, angle: 0 },
  { type: 'suv', x: 146, y: 158, angle: 0 },
  { type: 'tree-sm', x: 264, y: 59, angle: 0 },
  { type: 'tree-sm', x: 254, y: 255, angle: 0 },
  { type: 'cone', x: 179, y: 160, angle: 0 },
  { type: 'cone', x: 273, y: 111, angle: 0 },
],
playerCar: { x: 49, y: 249, angle: 90 },
exitZone: { x: 144, y: 67, angle: 0, parkingType: 'parallel' },
    escapeSteps: [
      { step: 1, description: 'Reverse and steer right, threading the tight gap near the top.' },
      { step: 2, description: 'Then turn right and drive forward to the side exit.' },
    ],
    expertTip: 'Final capstone — combines the hardest squeeze with the side-exit turn.',
  },
];

// ── BONUS PUZZLE (Truck — "Impossible Escape" S-Curve) ────────────────────
//
// Outside the 15-puzzle daily rotation. Player drives a longer vehicle
// (36×96 collision, 1.5× visual height) through an S-curve around two parked
// sedans. No reverse required per the solvability proof — but the longer body
// and tighter clearances make the multi-point steering genuinely different
// from existing puzzles. Proven solvable via walkthrough in Phase 1 audit.
// ────────────────────────────────────────────────────────────────────────────

export const bonusPuzzle: Puzzle = {
  id: 16,
  type: 'parallel',
  theme: 'underground',
  difficulty: 5,
  question: 'Thread the truck through the alley!',
  environment: 'garage',
  playerCar: { col: 2, row: 5, angle: 0 },
  playerVehicle: 'semitruck',
  obstacles: [
    { type: 'sedan', col: 2, row: 2, angle: 0 },
    { type: 'sedan', col: 1, row: 3, angle: 0 },
  ],
  exitZone: { col: 2, row: 0, direction: 'top' },
  escapeSteps: [
    { step: 1, description: 'Drive up to just below the first sedan.' },
    { step: 2, description: 'Steer right and go around the parked cars on the open right side.' },
    { step: 3, description: 'Head back toward the center and drive straight to the exit.' },
  ],
  expertTip: 'The truck is longer — be patient with the turn. You have room on the right side of both sedans.',
};

/**
 * Returns the puzzle for a given sequential ID (1-based).
 * Returns undefined if the ID is out of range (1–15).
 */
export function getPuzzleById(id: number): Puzzle | undefined {
  return puzzles.find((p) => p.id === id);
}
