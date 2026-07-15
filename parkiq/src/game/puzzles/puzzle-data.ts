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
    question: 'Park in the green zone without hitting anything.',
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'street',
    backgroundImage: 'puzzle2-bg.webp',
obstacles: [
  { type: 'tree-sm', x: 36, y: 176, angle: 0 },
  { type: 'tree-sm', x: 38, y: 106, angle: 0 },
  { type: 'tree-sm', x: 250, y: 176, angle: 0 },
  { type: 'suv', x: 212, y: 144, angle: 90 },
  { type: 'suv', x: 77, y: 142, angle: 270 },
  { type: 'suv', x: 77, y: 214, angle: 270 },
],
playerCar: { x: 155, y: 252, angle: 45 },
exitZone: { x: 208, y: 77, angle: 90, parkingType: 'angled' },
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'street',
    backgroundImage: 'puzzle3-bg.webp',
obstacles: [
  { type: 'suv', x: 105, y: 98, angle: 0 },
  { type: 'sedan', x: 157, y: 62, angle: 0 },
  { type: 'tree-sm', x: 59, y: 83, angle: 0 },
  { type: 'tree-sm', x: 124, y: 47, angle: 0 },
  { type: 'tree-sm', x: 25, y: 260, angle: 0 },
  { type: 'tree-sm', x: 177, y: 257, angle: 0 },
],
playerCar: { x: 81, y: 207, angle: 180 },
exitZone: { x: 235, y: 146, angle: 0, parkingType: 'angled' },
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'street',
    backgroundImage: 'puzzle4-bg.webp',
obstacles: [
  { type: 'tree-sm', x: 260, y: 160, angle: 0 },
  { type: 'tree-sm', x: 263, y: 88, angle: 0 },
  { type: 'suv', x: 206, y: 79, angle: 45 },
  { type: 'sedan', x: 206, y: 152, angle: 45 },
  { type: 'suv', x: 127, y: 124, angle: 0 },
  { type: 'shrub-1', x: 27, y: 55, angle: 135 },
],
playerCar: { x: 70, y: 123, angle: 0 },
exitZone: { x: 201, y: 222, angle: 45, parkingType: 'angled' },
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'street',
    backgroundImage: 'puzzle5-bg.webp',
obstacles: [
  { type: 'sedan', x: 92, y: 203, angle: 270 },
  { type: 'suv', x: 94, y: 107, angle: 270 },
  { type: 'sedan', x: 179, y: 203, angle: 270 },
  { type: 'wall', x: 50, y: 55, angle: 0 },
  { type: 'wall', x: 98, y: 55, angle: 0 },
  { type: 'tree-sm', x: 32, y: 257, angle: 0 },
  { type: 'tree-sm', x: 27, y: 145, angle: 0 },
],
playerCar: { x: 255, y: 256, angle: 0 },
exitZone: { x: 175, y: 108, angle: 270, parkingType: 'angled' },
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'garage',
    backgroundImage: 'puzzle6-bg.webp',
  obstacles: [
  { type: 'sedan', x: 236, y: 165, angle: 180 },
  { type: 'suv', x: 236, y: 82, angle: 180 },
  { type: 'suv', x: 50, y: 240, angle: 180 },
  { type: 'tree-sm', x: 48, y: 165, angle: 0 },
],
playerCar: { x: 52, y: 76, angle: 180 },
exitZone: { x: 237, y: 246, angle: 180, parkingType: 'parallel' },
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'garage',
    backgroundImage: 'puzzle7-bg.webp',
 obstacles: [
  { type: 'suv', x: 118, y: 147, angle: 330 },
  { type: 'sedan', x: 115, y: 220, angle: 315 },
  { type: 'tree-sm', x: 69, y: 162, angle: 0 },
  { type: 'tree-sm', x: 72, y: 82, angle: 0 },
  { type: 'tree-sm', x: 56, y: 252, angle: 0 },
],
playerCar: { x: 233, y: 251, angle: 45 },
exitZone: { x: 177, y: 74, angle: 45, parkingType: 'angled' },
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'garage',
    backgroundImage: 'puzzle8-bg.webp',
    obstacles: [
  { type: 'sedan', x: 223, y: 82, angle: 315 },
  { type: 'sedan', x: 223, y: 219, angle: 300 },
  { type: 'tree-sm', x: 263, y: 124, angle: 0 },
  { type: 'tree-sm', x: 261, y: 190, angle: 0 },
  { type: 'sedan', x: 60, y: 223, angle: 45 },
],
playerCar: { x: 136, y: 263, angle: 0 },
exitZone: { x: 63, y: 153, angle: 45, parkingType: 'angled' },
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'garage',
    backgroundImage: 'puzzle9-bg.webp',
  obstacles: [
  { type: 'tree-sm', x: 50, y: 141, angle: 0 },
  { type: 'tree-sm', x: 264, y: 143, angle: 0 },
  { type: 'sedan', x: 214, y: 178, angle: 45 },
  { type: 'suv', x: 215, y: 108, angle: 120 },
  { type: 'shrub-1', x: 13, y: 270, angle: 0 },
],
playerCar: { x: 261, y: 269, angle: 315 },
exitZone: { x: 132, y: 182, angle: 45, parkingType: 'angled' },
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'garage',
    backgroundImage: 'puzzle10-bg.webp',
   obstacles: [
  { type: 'wall', x: 23, y: 81, angle: 0 },
  { type: 'wall', x: 23, y: 157, angle: 0 },
  { type: 'shrub-1', x: 164, y: 130, angle: 0 },
  { type: 'sedan', x: 64, y: 70, angle: 0 },
  { type: 'sedan', x: 64, y: 165, angle: 0 },
  { type: 'sedan', x: 91, y: 239, angle: 270 },
],
playerCar: { x: 256, y: 60, angle: 225 },
exitZone: { x: 179, y: 242, angle: 270, parkingType: 'angled' },
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'open_lot',
    backgroundImage: 'puzzle11-bg.webp',
   obstacles: [
  { type: 'tree-sm', x: 73, y: 149, angle: 0 },
  { type: 'tree-sm', x: 141, y: 151, angle: 0 },
  { type: 'tree-sm', x: 216, y: 150, angle: 0 },
  { type: 'sedan', x: 70, y: 88, angle: 180 },
  { type: 'sedan', x: 138, y: 87, angle: 180 },
  { type: 'sedan', x: 218, y: 88, angle: 180 },
  { type: 'cone', x: 104, y: 198, angle: 0 },
],
playerCar: { x: 36, y: 257, angle: 45 },
exitZone: { x: 217, y: 209, angle: 0, parkingType: 'parallel' },
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'open_lot',
    backgroundImage: 'puzzle12-bg.webp',
  obstacles: [
  { type: 'wall', x: 256, y: 79, angle: 0 },
  { type: 'wall', x: 256, y: 130, angle: 0 },
  { type: 'wall', x: 256, y: 182, angle: 0 },
  { type: 'shrub-1', x: 16, y: 52, angle: 0 },
  { type: 'shrub-1', x: 18, y: 263, angle: 0 },
  { type: 'tree-sm', x: 256, y: 267, angle: 0 },
  { type: 'suv', x: 194, y: 185, angle: 90 },
],
playerCar: { x: 37, y: 191, angle: 0 },
exitZone: { x: 193, y: 79, angle: 90, parkingType: 'angled' },
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'open_lot',
    backgroundImage: 'puzzle13-bg.webp',
 obstacles: [
  { type: 'tree-sm', x: 85, y: 49, angle: 0 },
  { type: 'tree-sm', x: 164, y: 49, angle: 0 },
  { type: 'sedan', x: 73, y: 92, angle: 315 },
  { type: 'shrub-1', x: 17, y: 248, angle: 0 },
  { type: 'tree-sm', x: 11, y: 46, angle: 0 },
  { type: 'tree-sm', x: 281, y: 43, angle: 0 },
],
playerCar: { x: 222, y: 242, angle: 180 },
exitZone: { x: 159, y: 101, angle: 315, parkingType: 'angled' },
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'open_lot',
    backgroundImage: 'puzzle14-bg.webp',
  obstacles: [
  { type: 'sedan', x: 115, y: 144, angle: 300 },
  { type: 'tree-sm', x: 66, y: 167, angle: 0 },
  { type: 'suv', x: 115, y: 217, angle: 330 },
  { type: 'shrub-2', x: 24, y: 237, angle: 90 },
],
playerCar: { x: 214, y: 255, angle: 240 },
exitZone: { x: 124, y: 77, angle: 315, parkingType: 'angled' },
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
    question: 'Park in the green zone without hitting anything.',
    environment: 'open_lot',
    backgroundImage: 'puzzle15-bg.webp',
 obstacles: [
  { type: 'sedan', x: 144, y: 165, angle: 0 },
  { type: 'suv', x: 145, y: 85, angle: 0 },
  { type: 'tree-sm', x: 29, y: 253, angle: 0 },
  { type: 'tree-sm', x: 259, y: 250, angle: 0 },
  { type: 'tree-sm', x: 255, y: 165, angle: 0 },
  { type: 'tree-sm', x: 257, y: 84, angle: 0 },
],
playerCar: { x: 49, y: 66, angle: 90 },
exitZone: { x: 144, y: 245, angle: 0, parkingType: 'parallel' },
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
