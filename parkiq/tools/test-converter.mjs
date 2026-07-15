/**
 * Quick verification script for convertGridToPixel().
 * Run with: node tools/test-converter.mjs
 * (Uses the pre-built static JSON since actual TypeScript import needs the build pipeline.)
 */
import { readFileSync } from 'fs';

// Simulate convertGridToPixel logic exactly as written
const UNIT_PX = 48;
const CONTAINER_OFFSET_X = 0.5;
const CONTAINER_OFFSET_Y = 0.5;

function convertGridToPixel(puzzle) {
  const playerCar = {
    ...puzzle.playerCar,
    x: puzzle.playerCar.x ?? (puzzle.playerCar.col + CONTAINER_OFFSET_X) * UNIT_PX,
    y: puzzle.playerCar.y ?? (puzzle.playerCar.row + CONTAINER_OFFSET_Y) * UNIT_PX,
  };

  const obstacles = puzzle.obstacles.map((obs) => ({
    ...obs,
    x: obs.x ?? (obs.col + CONTAINER_OFFSET_X) * UNIT_PX,
    y: obs.y ?? (obs.row + CONTAINER_OFFSET_Y) * UNIT_PX,
  }));

  const exitZone = {
    ...puzzle.exitZone,
    x: puzzle.exitZone.x ?? (puzzle.exitZone.col + CONTAINER_OFFSET_X) * UNIT_PX,
    y: puzzle.exitZone.y ?? (puzzle.exitZone.row + CONTAINER_OFFSET_Y) * UNIT_PX,
    angle: puzzle.exitZone.angle ?? puzzle.parkingAngle,
    parkingType: puzzle.exitZone.parkingType ?? puzzle.parkingType,
  };

  return { ...puzzle, playerCar, obstacles, exitZone };
}

// Puzzle 1 static data
const puzzle1 = {
  id: 1,
  type: 'parallel',
  theme: 'street',
  difficulty: 1,
  question: 'Drive out without hitting another car.',
  environment: 'street',
  playerCar: { col: 2, row: 5, angle: 0 },
  obstacles: [
    { type: 'sedan', col: 1, row: 1, angle: 0 },
    { type: 'suv',   col: 3, row: 1, angle: 0 },
  ],
  exitZone: { col: 2, row: 0, direction: 'top' },
  parkingType: 'parallel',
  parkingAngle: 0,
  escapeSteps: [
    { step: 1, description: 'Hold forward — lane is clear.' },
  ],
  expertTip: 'Pure control intro. No decision required.',
};

// Puzzle 2 static data (NO parkingType)
const puzzle2 = {
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
};

// Bonus puzzle (no parkingType)
const bonus = {
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

console.log('========== PUZZLE 1 (has parkingType + parkingAngle) ==========');
const c1 = convertGridToPixel(puzzle1);
console.log('playerCar:', JSON.stringify(c1.playerCar));
console.log('obstacles:', JSON.stringify(c1.obstacles));
console.log('exitZone:',  JSON.stringify(c1.exitZone));

console.log('\n========== PUZZLE 2 (NO parkingType) ==========');
const c2 = convertGridToPixel(puzzle2);
console.log('playerCar:', JSON.stringify(c2.playerCar));
console.log('obstacles:', JSON.stringify(c2.obstacles));
console.log('exitZone:',  JSON.stringify(c2.exitZone));

console.log('\n========== BONUS (NO parkingType) ==========');
const cb = convertGridToPixel(bonus);
console.log('playerCar:', JSON.stringify(cb.playerCar));
console.log('obstacles:', JSON.stringify(cb.obstacles));
console.log('exitZone:',  JSON.stringify(cb.exitZone));
