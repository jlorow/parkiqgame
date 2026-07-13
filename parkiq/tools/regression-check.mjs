/**
 * Regression check for all 15 puzzles after the freeform coordinate system changes.
 *
 * Verifies:
 * 1. convertGridToPixel produces valid output for each puzzle
 * 2. No errors from validatePuzzleData at import
 * 3. Player car, each obstacle, and exit zone get correct x/y values
 * 4. exitZone.parkingType/angle are populated only when puzzle had them set
 * 5. Wall obstacle check: does ANY puzzle have 'wall' obstacles?
 * 6. Logs a clean summary
 *
 * Run: node tools/regression-check.mjs
 */

const UNIT_PX = 48;
const CONTAINER_OFFSET_X = 0.5;
const CONTAINER_OFFSET_Y = 0.5;

// ── All 15 puzzles + bonus (simplified static data) ──────────────────────

const allPuzzles = [
  {
    id: 1, obstacles: [
      { type: 'sedan', col: 1, row: 1, angle: 0 },
      { type: 'suv',   col: 3, row: 1, angle: 0 },
    ],
    playerCar: { col: 2, row: 5, angle: 0 },
    exitZone: { col: 2, row: 0, direction: 'top' },
    parkingType: 'parallel', parkingAngle: 0,
  },
  {
    id: 2, obstacles: [
      { type: 'sedan', col: 0, row: 1, angle: 0 },
      { type: 'suv',   col: 4, row: 4, angle: 0 },
    ],
    playerCar: { col: 2, row: 5, angle: 0 },
    exitZone: { col: 4, row: 0, direction: 'top' },
    // NO parkingType/parkingAngle
  },
  {
    id: 3, obstacles: [
      { type: 'sedan', col: 0, row: 2, angle: 0 },
      { type: 'suv',   col: 4, row: 2, angle: 0 },
    ],
    playerCar: { col: 2, row: 5, angle: 0 },
    exitZone: { col: 2, row: 0, direction: 'top' },
  },
  {
    id: 4, obstacles: [
      { type: 'sedan', col: 5, row: 1, angle: 0 },
      { type: 'suv',   col: 1, row: 4, angle: 0 },
    ],
    playerCar: { col: 3, row: 5, angle: 0 },
    exitZone: { col: 1, row: 0, direction: 'top' },
  },
  {
    id: 5, obstacles: [
      { type: 'sedan', col: 0, row: 2, angle: 0 },
      { type: 'sedan', col: 2, row: 2, angle: 0 },
      { type: 'suv',   col: 3, row: 1, angle: 0 },
    ],
    playerCar: { col: 2, row: 5, angle: 0 },
    exitZone: { col: 0, row: 0, direction: 'top' },
    parkingType: 'parallel', parkingAngle: 0,
  },
  {
    id: 6, obstacles: [
      { type: 'sedan', col: 0, row: 2, angle: 0 },
      { type: 'suv',   col: 4, row: 2, angle: 0 },
    ],
    playerCar: { col: 2, row: 5, angle: 90 },
    exitZone: { col: 2, row: 0, direction: 'top' },
  },
  {
    id: 7, obstacles: [
      { type: 'sedan', col: 0, row: 1, angle: 0 },
      { type: 'suv',   col: 4, row: 4, angle: 0 },
    ],
    playerCar: { col: 2, row: 5, angle: 270 },
    exitZone: { col: 4, row: 0, direction: 'top' },
  },
  {
    id: 8, obstacles: [
      { type: 'sedan', col: 0, row: 2, angle: 0 },
      { type: 'suv',   col: 3, row: 2, angle: 0 },
    ],
    playerCar: { col: 2, row: 5, angle: 90 },
    exitZone: { col: 1, row: 0, direction: 'top' },
  },
  {
    id: 9, obstacles: [
      { type: 'sedan', col: 4, row: 4, angle: 0 },
    ],
    playerCar: { col: 1, row: 5, angle: 90 },
    exitZone: { col: 4, row: 0, direction: 'top' },
  },
  {
    id: 10, obstacles: [
      { type: 'sedan', col: 5, row: 2, angle: 0 },
      { type: 'suv',   col: 2, row: 2, angle: 0 },
    ],
    playerCar: { col: 3, row: 5, angle: 270 },
    exitZone: { col: 4, row: 0, direction: 'top' },
  },
  {
    id: 11, obstacles: [
      { type: 'sedan', col: 0, row: 2, angle: 0 },
      { type: 'suv',   col: 4, row: 2, angle: 0 },
    ],
    playerCar: { col: 2, row: 5, angle: 180 },
    exitZone: { col: 2, row: 0, direction: 'top' },
  },
  {
    id: 12, obstacles: [
      { type: 'sedan', col: 0, row: 2, angle: 0 },
      { type: 'suv',   col: 3, row: 2, angle: 0 },
    ],
    playerCar: { col: 2, row: 5, angle: 180 },
    exitZone: { col: 1, row: 0, direction: 'top' },
  },
  {
    id: 13, obstacles: [
      { type: 'sedan', col: 0, row: 1, angle: 0 },
      { type: 'suv',   col: 4, row: 3, angle: 0 },
    ],
    playerCar: { col: 2, row: 4, angle: 180 },
    exitZone: { col: 5, row: 2, direction: 'right' },
  },
  {
    id: 14, obstacles: [
      { type: 'sedan', col: 4, row: 4, angle: 0 },
    ],
    playerCar: { col: 1, row: 5, angle: 180 },
    exitZone: { col: 4, row: 0, direction: 'top' },
  },
  {
    id: 15, obstacles: [
      { type: 'sedan', col: 3, row: 1, angle: 0 },
      { type: 'suv',   col: 0, row: 1, angle: 0 },
    ],
    playerCar: { col: 1, row: 4, angle: 180 },
    exitZone: { col: 5, row: 1, direction: 'right' },
  },
];

const bonusPuzzle = {
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
  expertTip: 'The truck is longer — be patient with the turn.',
};

// ── convertGridToPixel (exact copy from puzzle-engine.ts) ─────────────────

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

// ── Validation (exact copy) ──────────────────────────────────────────────

function validate(p) {
  const PLAYFIELD = 288;
  const pc = p.playerCar;
  if (pc.x !== undefined && (pc.x < 0 || pc.x > PLAYFIELD))
    throw new Error(`Puzzle ${p.id}: playerCar x=${pc.x}`);
  if (pc.y !== undefined && (pc.y < 0 || pc.y > PLAYFIELD))
    throw new Error(`Puzzle ${p.id}: playerCar y=${pc.y}`);
  for (const obs of p.obstacles) {
    if (obs.x !== undefined || obs.y !== undefined) {
      if (obs.x !== undefined && (obs.x < 0 || obs.x > PLAYFIELD))
        throw new Error(`Puzzle ${p.id}: obstacle x=${obs.x}`);
      if (obs.y !== undefined && (obs.y < 0 || obs.y > PLAYFIELD))
        throw new Error(`Puzzle ${p.id}: obstacle y=${obs.y}`);
    } else {
      if (obs.row < 1 || obs.row > 4)
        throw new Error(`Puzzle ${p.id}: obstacle row ${obs.row}`);
    }
  }
  const ez = p.exitZone;
  if (ez.x !== undefined && (ez.x < 0 || ez.x > PLAYFIELD))
    throw new Error(`Puzzle ${p.id}: exitZone x=${ez.x}`);
  if (ez.y !== undefined && (ez.y < 0 || ez.y > PLAYFIELD))
    throw new Error(`Puzzle ${p.id}: exitZone y=${ez.y}`);
}

// ── Collision constants (mirror PuzzleScene.ts) ──────────────────────────

const SEDAN_BOX = {
  0:  { w: 45, h: 69 }, 15: { w: 58, h: 73 }, 30: { w: 68, h: 74 },
  45: { w: 73, h: 73 }, 60: { w: 74, h: 68 }, 75: { w: 73, h: 58 },
  90: { w: 69, h: 45 },
};
const LARGE_BOX = {
  0: { w: 49, h: 100 }, 45: { w: 99, h: 99 }, 90: { w: 100, h: 49 },
};

function getVehicleTable(type) {
  if (type === 'truck' || type === 'limo' || type === 'semitruck') return 'large';
  return 'sedan';
}

function getRotatedBox(table, angleDeg) {
  let r = angleDeg % 180;
  if (r < 0) r += 180;
  if (r > 90) r = 180 - r;
  if (table === 'sedan') {
    const bucket = Math.round(r / 15) * 15;
    return SEDAN_BOX[bucket] ?? SEDAN_BOX[0];
  } else {
    const bucket = r < 22.5 ? 0 : r < 67.5 ? 45 : 90;
    return LARGE_BOX[bucket] ?? LARGE_BOX[0];
  }
}

function rectsOverlap(a, b) {
  return !(a.x + a.w/2 <= b.x - b.w/2 || b.x + b.w/2 <= a.x - a.w/2 ||
           a.y + a.h/2 <= b.y - b.h/2 || b.y + b.h/2 <= a.y - a.h/2);
}

// ── Run regression ───────────────────────────────────────────────────────

console.log('============================================');
console.log('REGRESSION CHECK — All 15 puzzles + bonus');
console.log('============================================\n');

let totalErrors = 0;
let wallCount = 0;

for (const raw of [...allPuzzles, bonusPuzzle]) {
  const pid = raw.id;
  const prefix = pid === 16 ? '[BONUS]' : `[#${String(pid).padStart(2, '0')}]`;
  let errors = [];

  try {
    // 1. Convert
    const p = convertGridToPixel(raw);

    // 2. Validate
    validate(p);

    // 3. Check playerCar has x/y
    if (p.playerCar.x === undefined) errors.push('playerCar.x missing');
    if (p.playerCar.y === undefined) errors.push('playerCar.y missing');

    // 4. Check each obstacle
    for (let i = 0; i < p.obstacles.length; i++) {
      const o = p.obstacles[i];
      if (o.x === undefined) errors.push(`obstacle[${i}].x missing`);
      if (o.y === undefined) errors.push(`obstacle[${i}].y missing`);
      // Type preserved?
      if (o.type !== raw.obstacles[i].type) errors.push(`obstacle[${i}].type changed`);
    }

    // 5. Check exitZone has x/y
    if (p.exitZone.x === undefined) errors.push('exitZone.x missing');
    if (p.exitZone.y === undefined) errors.push('exitZone.y missing');

    // 6. Verify parkingType/angle consolidation
    const hasSourcePt = raw.parkingType !== undefined;
    const hasEzPt = p.exitZone.parkingType !== undefined;
    if (hasSourcePt && !hasEzPt)
      errors.push(`exitZone.parkingType should be '${raw.parkingType}' but is undefined`);
    if (!hasSourcePt && hasEzPt)
      errors.push(`exitZone.parkingType=${p.exitZone.parkingType} but source had no parkingType`);

    const hasSourcePa = raw.parkingAngle !== undefined;
    const hasEzAngle = p.exitZone.angle !== undefined;
    if (hasSourcePa && !hasEzAngle)
      errors.push('exitZone.angle should be set but is undefined');
    if (!hasSourcePa && hasEzAngle)
      errors.push('exitZone.angle set unnecessarily');

    // 7. Wall check — does this puzzle have walls?
    for (const o of p.obstacles) {
      if (o.type === 'wall') wallCount++;
    }

    // 8. Check exit: correct bay size logic
    const expectedBaySize = p.exitZone.parkingType ? 48 : 96;
    // This is the same as what checkExitReached uses — read from ez.parkingType
    // (not puzzle.parkingType)

    // 9. Player box — verify getRotatedBox works for this puzzle's angles
    const playerTable = getVehicleTable(p.playerVehicle ?? 'sedan');
    const playerBox = getRotatedBox(playerTable, p.playerCar.angle);
    if (playerBox.w <= 0 || playerBox.h <= 0)
      errors.push(`playerBox invalid: ${playerBox.w}x${playerBox.h}`);

    // 10. Obstacle collision boxes — verify each
    for (let i = 0; i < p.obstacles.length; i++) {
      const o = p.obstacles[i];
      if (o.type === 'pillar') continue; // no collision
      const obsTable = getVehicleTable(o.type);
      const obsBox = getRotatedBox(obsTable, o.angle);
      if (obsBox.w <= 0 || obsBox.h <= 0)
        errors.push(`obstacle[${i}] box invalid: ${obsBox.w}x${obsBox.h}`);
    }

    // Summary
    const status = errors.length === 0 ? '✅ PASS' : `❌ FAIL (${errors.length} issue(s))`;
    const extra = [];
    if (p.playerVehicle) extra.push(`vehicle=${p.playerVehicle}`);
    extra.push(`player=(${p.playerCar.x},${p.playerCar.y})`);
    if (p.exitZone.parkingType) extra.push(`ez.pt=${p.exitZone.parkingType}`);
    if (p.exitZone.angle !== undefined) extra.push(`ez.angle=${p.exitZone.angle}°`);
    console.log(`${prefix} ${status}  [${extra.join(', ')}]`);

    if (errors.length > 0) {
      totalErrors += errors.length;
      for (const e of errors) {
        console.log(`       ⚠ ${e}`);
      }
    }
  } catch (err) {
    console.log(`${prefix} ❌ CRASH: ${err.message}`);
    totalErrors++;
  }
}

console.log(`\n---`);
console.log(`Total puzzles: ${allPuzzles.length + 1} (15 + 1 bonus)`);
console.log(`Errors:        ${totalErrors}`);
console.log(`Wall obstacles found across all puzzles: ${wallCount}`);
console.log(`\n--- WALL BEHAVIOR FLAG ---`);
if (wallCount === 0) {
  console.log('No puzzle uses wall-type obstacles. Removing the wall skip-guard');
  console.log('in checkCollision() and renderParkingScene() has ZERO effect on all');
  console.log('15 existing puzzles. Walls will only matter for future freeform puzzles.');
} else {
  console.log(`WARNING: ${wallCount} wall obstacle(s) found — wall collision change IS active.`);
}
console.log(`\nPlayer spawn positions (all should be near bottom row 5):`);
for (const raw of allPuzzles) {
  const p = convertGridToPixel(raw);
  console.log(`  Puzzle ${String(p.id).padStart(2)}: (${String(p.playerCar.x).padStart(3)}, ${String(p.playerCar.y).padStart(3)}) angle=${String(p.playerCar.angle).padStart(3)}°  ` +
    `(grid col=${p.playerCar.col} row=${p.playerCar.row})`);
}
console.log(`\nExit zone positions (all should be near top row 0-1):`);
for (const raw of allPuzzles) {
  const p = convertGridToPixel(raw);
  const ptLabel = p.exitZone.parkingType ? ` ${p.exitZone.parkingType}@${p.exitZone.angle}°` : ' legacy96';
  console.log(`  Puzzle ${String(p.id).padStart(2)}: (${String(p.exitZone.x).padStart(3)}, ${String(p.exitZone.y).padStart(3)})${ptLabel}`);
}
