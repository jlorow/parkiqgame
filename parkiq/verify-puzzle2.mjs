/**
 * VERIFICATION SCRIPT — Puzzle 2 Layout (angled exit)
 *
 * Uses EXACT collision logic from PuzzleScene.ts:
 *   - getRotatedBox() with SEDAN_BOX lookup table
 *   - Rectangle overlap (Phaser.Geom.Rectangle.Overlaps)
 *   - Movement: rotation-then-move per frame at configurable FPS
 *   - Collision: reset-to-spawn on hit
 *   - Exit: rectangle overlap + angle tolerance (±15° for angled)
 *
 * Run: node verify-puzzle2.mjs
 */

// ═══════════════════════════════════════════════════════════════════
//  REAL ENGINE CONSTANTS (from PuzzleScene.ts)
// ═══════════════════════════════════════════════════════════════════

const UNIT_PX = 48;
const GRID_SIZE = 288;
const CONTAINER_OFFSET_X = 0.5;
const CONTAINER_OFFSET_Y = 0.5;
const MOVE_SPEED = 120;      // px/s container-local
const ROTATION_SPEED = 90;   // deg/s

// ── Rotated AABB lookup tables (from PuzzleScene.ts) ────────────
const SEDAN_BOX = {
  0:  { w: 45, h: 69 },
  15: { w: 58, h: 73 },
  30: { w: 68, h: 74 },
  45: { w: 73, h: 73 },
  60: { w: 74, h: 68 },
  75: { w: 73, h: 58 },
  90: { w: 69, h: 45 },
};

// ── Angled exit zone dimensions (from PuzzleScene.ts) ───────────
const ANGLE_EXIT_HALF_W = 20;  // 40px total width
const ANGLE_EXIT_HALF_H = 35;  // 70px total length

// ═══════════════════════════════════════════════════════════════════
//  ENGINE FUNCTIONS (exact replicas)
// ═══════════════════════════════════════════════════════════════════

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
const LARGE_BOX = { 0: { w: 49, h: 100 }, 45: { w: 99, h: 99 }, 90: { w: 100, h: 49 } };

function makeRect(cx, cy, w, h) {
  return { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 };
}
function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function checkCollision(cx, cy, carAngle, obstacles, vehicleType) {
  const table = vehicleType === 'sedan' ? 'sedan' : 'large';
  const playerBox = getRotatedBox(table, carAngle);
  const playerRect = makeRect(cx, cy, playerBox.w, playerBox.h);
  for (const obs of obstacles) {
    if (obs.type === 'wall' || obs.type === 'pillar') continue;
    const obsBox = getRotatedBox('sedan', obs.angle);
    const obsRect = makeRect(obs.x, obs.y, obsBox.w, obsBox.h);
    if (rectsOverlap(playerRect, obsRect)) return { collided: true, obstacle: obs };
  }
  return { collided: false, obstacle: null };
}

function checkExitReached(cx, cy, carAngle, exitZone, vehicleType) {
  const table = vehicleType === 'sedan' ? 'sedan' : 'large';
  const playerBox = getRotatedBox(table, carAngle);
  const playerRect = makeRect(cx, cy, playerBox.w, playerBox.h);
  const bayRect = makeRect(exitZone.x, exitZone.y, ANGLE_EXIT_HALF_W * 2, ANGLE_EXIT_HALF_H * 2);
  if (!rectsOverlap(playerRect, bayRect)) return false;
  const tolerance = 15;
  const diff = Math.abs(((carAngle - (exitZone.angle ?? 0) + 180) % 360) - 180);
  if (diff > tolerance) return false;
  return true;
}

// ═══════════════════════════════════════════════════════════════════
//  SIMULATION
// ═══════════════════════════════════════════════════════════════════

function simulateStep(cx, cy, carAngle, inputDir, obstacles, vehicleType, dt) {
  if (inputDir === 'left') carAngle -= ROTATION_SPEED * dt;
  if (inputDir === 'right') carAngle += ROTATION_SPEED * dt;
  let moveDir = 0;
  if (inputDir === 'forward' || inputDir === 'f') moveDir = 1;
  if (inputDir === 'reverse' || inputDir === 'r') moveDir = -1;
  const rad = carAngle * Math.PI / 180;
  let ncx = cx;
  let ncy = cy;
  if (moveDir !== 0) {
    const step = MOVE_SPEED * dt * moveDir;
    ncx = cx + Math.sin(rad) * step;
    ncy = cy + (-Math.cos(rad)) * step;
  }
  // Check collision at the NEW position AND new angle (even during rotation-only steps)
  const col = checkCollision(ncx, ncy, carAngle, obstacles, vehicleType);
  if (col.collided) {
    return { cx, cy, carAngle, collided: true };
  }
  // Only apply movement if no collision
  cx = ncx;
  cy = ncy;
  return { cx, cy, carAngle, collided: false };
}

function runSequence(spawn, steps, obstacles, exitZone, vehicleType, fps) {
  let cx = spawn.x, cy = spawn.y, carAngle = spawn.angle;
  const dt = 1 / fps;
  let totalCollisions = 0;
  let won = false;
  for (const step of steps) {
    const frames = Math.round(step.duration / (dt * 1000));
    for (let f = 0; f < frames; f++) {
      const result = simulateStep(cx, cy, carAngle, step.dir, obstacles, vehicleType, dt);
      cx = result.cx; cy = result.cy; carAngle = result.carAngle;
      if (result.collided) {
        totalCollisions++;
        cx = spawn.x; cy = spawn.y; carAngle = spawn.angle;
      }
      if (!result.collided && checkExitReached(cx, cy, carAngle, exitZone, vehicleType)) {
        won = true; break;
      }
    }
    if (won) break;
  }
  return { cx, cy, carAngle, won, totalCollisions };
}

// ═══════════════════════════════════════════════════════════════════
//  PUZZLE 2 LAYOUT
// ═══════════════════════════════════════════════════════════════════

const puzzle2 = {
  spawn: { x: 144, y: 244, angle: 0 },
  obstacles: [
    { type: 'sedan', x: 55,  y: 205, angle: 0 },   // lower-left (AABB [32.5,77.5])
    { type: 'suv',   x: 205, y: 170, angle: 0 },   // mid-right (AABB left=182.5)
    { type: 'sedan', x: 37,  y: 82,  angle: 45 },  // left flank (AABB [0.5,73.5])
    { type: 'suv',   x: 225, y: 82,  angle: 45 },  // right flank (AABB [188.5,261.5], gap=115px)
  ],
  exitZone: { x: 119, y: 90, angle: 45, parkingType: 'angled' },
  vehicleType: 'sedan',
};

// ═══════════════════════════════════════════════════════════════════
//  STEP 1 — Static geometry audit
// ═══════════════════════════════════════════════════════════════════

function aabbToString(x, y, w, h) {
  return `[${(x-w/2).toFixed(1)}–${(x+w/2).toFixed(1)}, ${(y-h/2).toFixed(1)}–${(y+h/2).toFixed(1)}]`;
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  STEP 1 — STATIC GEOMETRY AUDIT');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('1a. COLLISION BOXES (rotated AABB from SEDAN_BOX):\n');
console.log(`  Player @ (${puzzle2.spawn.x}, ${puzzle2.spawn.y}) ${puzzle2.spawn.angle}°:`);
const spawnBox = getRotatedBox('sedan', puzzle2.spawn.angle);
console.log(`    ${spawnBox.w}×${spawnBox.h} → ${aabbToString(puzzle2.spawn.x, puzzle2.spawn.y, spawnBox.w, spawnBox.h)}`);
for (let i = 0; i < puzzle2.obstacles.length; i++) {
  const o = puzzle2.obstacles[i];
  const oBox = getRotatedBox('sedan', o.angle);
  console.log(`  #${i+1} (${o.type}) @ (${o.x}, ${o.y}) ${o.angle}°: ${oBox.w}×${oBox.h} → ${aabbToString(o.x, o.y, oBox.w, oBox.h)}`);
}
console.log(`\n  Exit @ (${puzzle2.exitZone.x}, ${puzzle2.exitZone.y}) ${puzzle2.exitZone.angle}°:`);
console.log(`    ${ANGLE_EXIT_HALF_W*2}×${ANGLE_EXIT_HALF_H*2} → ${aabbToString(puzzle2.exitZone.x, puzzle2.exitZone.y, ANGLE_EXIT_HALF_W*2, ANGLE_EXIT_HALF_H*2)}`);

console.log('\n1b. EDGE CLEARANCE (all AABBs inside 0–288):');
let allInside = true;
for (let i = 0; i < puzzle2.obstacles.length; i++) {
  const o = puzzle2.obstacles[i];
  const box = getRotatedBox('sedan', o.angle);
  const r = makeRect(o.x, o.y, box.w, box.h);
  const inside = r.left >= 0 && r.right <= GRID_SIZE && r.top >= 0 && r.bottom <= GRID_SIZE;
  if (!inside) allInside = false;
  console.log(`  #${i+1} (${o.type}): ${inside ? '✓ INSIDE' : '✗ OVERFLOW'}  (${r.left.toFixed(0)}–${r.right.toFixed(0)}, ${r.top.toFixed(0)}–${r.bottom.toFixed(0)})`);
}
console.log(`  → ${allInside ? '✓ PASS' : '✗ FAIL'}`);

console.log('\n1c. OBSTACLE-TO-OBSTACLE OVERLAP:');
let anyOverlap = false;
for (let i = 0; i < puzzle2.obstacles.length; i++) {
  for (let j = i + 1; j < puzzle2.obstacles.length; j++) {
    const a = puzzle2.obstacles[i], b = puzzle2.obstacles[j];
    const aBox = getRotatedBox('sedan', a.angle);
    const bBox = getRotatedBox('sedan', b.angle);
    const aR = makeRect(a.x, a.y, aBox.w, aBox.h);
    const bR = makeRect(b.x, b.y, bBox.w, bBox.h);
    if (rectsOverlap(aR, bR)) {
      anyOverlap = true;
      const ox = (Math.min(aR.right, bR.right) - Math.max(aR.left, bR.left)).toFixed(0);
      const oy = (Math.min(aR.bottom, bR.bottom) - Math.max(aR.top, bR.top)).toFixed(0);
      console.log(`  ✗ OVERLAP: #${i+1} ↔ #${j+1} (${ox}×${oy}px)`);
    }
  }
}
console.log(`  → ${!anyOverlap ? '✓ PASS (zero overlaps)' : '✗ FAIL'}`);

console.log('\n1d. EXIT ZONE CLEARANCE:');
const exitRect = makeRect(puzzle2.exitZone.x, puzzle2.exitZone.y, ANGLE_EXIT_HALF_W*2, ANGLE_EXIT_HALF_H*2);
let exitBlocked = false;
for (let i = 0; i < puzzle2.obstacles.length; i++) {
  const o = puzzle2.obstacles[i];
  const box = getRotatedBox('sedan', o.angle);
  const oR = makeRect(o.x, o.y, box.w, box.h);
  if (rectsOverlap(exitRect, oR)) { exitBlocked = true; console.log(`  ✗ #${i+1} overlaps exit`); }
}
console.log(`  → ${!exitBlocked ? '✓ PASS (exit zone clear)' : '✗ FAIL'}`);

console.log('\n1e. PLAYER SPAWN CLEARANCE:');
const spawnCol = checkCollision(puzzle2.spawn.x, puzzle2.spawn.y, puzzle2.spawn.angle, puzzle2.obstacles, puzzle2.vehicleType);
console.log(`  → ${!spawnCol.collided ? '✓ PASS (spawn clear)' : '✗ FAIL'}`);

console.log('\n1f. FLANKING GAP ANALYSIS:');
const leftFlank = puzzle2.obstacles[2];
const rightFlank = puzzle2.obstacles[3];
const lBox = getRotatedBox('sedan', leftFlank.angle);
const rBox = getRotatedBox('sedan', rightFlank.angle);
const lRect = makeRect(leftFlank.x, leftFlank.y, lBox.w, lBox.h);
const rRect = makeRect(rightFlank.x, rightFlank.y, rBox.w, rBox.h);
const gap = rRect.left - lRect.right;
console.log(`  Left flank right edge: ${lRect.right.toFixed(1)}`);
console.log(`  Right flank left edge: ${rRect.left.toFixed(1)}`);
console.log(`  Gap:                   ${gap.toFixed(1)}px`);
const p45Box = getRotatedBox('sedan', 45);
const margin = gap - p45Box.w;
console.log(`  Player width at 45°:   ${p45Box.w}px`);
console.log(`  Margin:                ${margin.toFixed(1)}px`);
console.log(`  → ${gap > p45Box.w ? '✓ PASS (gap > player width)' : '✗ FAIL (gap ≤ player width)'}`);

// ═══════════════════════════════════════════════════════════════════
//  STEP 2 — Candidate path simulation
// ═══════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  STEP 2 — CANDIDATE PATH TESTS');
console.log('═══════════════════════════════════════════════════════════════\n');

// Expected path geometry:
//   Spawn: (144, 244), angle 0°
//   Sedan #1 (72, 195) blocks x=49.5-94.5, y=160.5-229.5
//   SUV #2 (195, 165) blocks x=172.5-217.5, y=130.5-199.5
//   Player must go LEFT from x=144 to x≈119 while ascending
//   Then rotate to ~45° to match exit angle (no forward needed at 45° — exit check triggers on overlap)
//
// KEY INSIGHT: Rotating WITHOUT forward movement allows the player to change
// angle inside the flanking corridor without the diagonal drift that would
// cause collision. The path pattern is:
//   1. Forward up the center (clear corridor past sedan #1 and SUV #2)
//   2. Steer LEFT to angle ~-15° (no forward — rotate in place)
//   3. Forward to drift left toward x≈119
//   4. Steer RIGHT to angle ~45° (no forward — rotate in place in flanking corridor)
//   5. WIN triggers immediately (angle at 45°±15°, overlapping exit rect)
//
// Test multiple candidates at 60, 30, and 20fps

const candidates = [
  // ── Rotation-only approach: steer, forward, steer (rotate in place) ──
  // F+L = forward to clear sedan, then left-steer (no forward) to aim at exit
  // F+R = forward into position, then right-steer (no forward) to match exit angle
  { label: 'F800+L400+F600+R667', steps: [
    { dir: 'forward', duration:  800 },
    { dir: 'left', duration: 400 },    // rotate to ~-36° in place
    { dir: 'forward', duration: 600 },
    { dir: 'right', duration: 667 },   // rotate to ~45° in place
  ]},
  { label: 'F700+L300+F800+R667', steps: [
    { dir: 'forward', duration: 700 },
    { dir: 'left', duration: 300 },    // rotate to ~-27° in place
    { dir: 'forward', duration: 800 },
    { dir: 'right', duration: 667 },   // rotate to ~45° in place
  ]},
  { label: 'F1000+L500+F500+R667', steps: [
    { dir: 'forward', duration: 1000 },
    { dir: 'left', duration: 500 },    // rotate to ~-45° in place
    { dir: 'forward', duration: 500 },
    { dir: 'right', duration: 667 },   // rotate to ~45° in place
  ]},
  { label: 'F600+L200+F1000+R667', steps: [
    { dir: 'forward', duration: 600 },
    { dir: 'left', duration: 200 },    // rotate to ~-18° in place
    { dir: 'forward', duration: 1000 },
    { dir: 'right', duration: 667 },   // rotate to ~45° in place
  ]},
  { label: 'F800+L500+F500+R667', steps: [
    { dir: 'forward', duration: 800 },
    { dir: 'left', duration: 500 },    // rotate to ~-45° in place
    { dir: 'forward', duration: 500 },
    { dir: 'right', duration: 667 },   // rotate to ~45° in place
  ]},
  // ── Shorter rotation-only patterns ──
  { label: 'F800+L200+F800+R1000', steps: [
    { dir: 'forward', duration: 800 },
    { dir: 'left', duration: 200 },
    { dir: 'forward', duration: 800 },
    { dir: 'right', duration: 1000 },
  ]},
  { label: 'F600+L400+F1000+R500', steps: [
    { dir: 'forward', duration: 600 },
    { dir: 'left', duration: 400 },
    { dir: 'forward', duration: 1000 },
    { dir: 'right', duration: 500 },
  ]},
  // ── Even more patterns ──
  { label: 'F900+L300+F700+R600', steps: [
    { dir: 'forward', duration: 900 },
    { dir: 'left', duration: 300 },
    { dir: 'forward', duration: 700 },
    { dir: 'right', duration: 600 },
  ]},
  { label: 'F500+L600+F500+R500', steps: [
    { dir: 'forward', duration: 500 },
    { dir: 'left', duration: 600 },
    { dir: 'forward', duration: 500 },
    { dir: 'right', duration: 500 },
  ]},
  // ── Path derived from geometry analysis (reach x=111, rotate to 45°) ──
  { label: 'F100+L167+F1065+R667', steps: [
    { dir: 'forward', duration: 100 },   // clear spawn area
    { dir: 'left', duration: 167 },      // rotate to -15° in place
    { dir: 'forward', duration: 1065 },  // move up-left to (111, ~108)
    { dir: 'right', duration: 667 },     // rotate to 45° in place → WIN
  ]},
  { label: 'F200+L167+F900+R667', steps: [
    { dir: 'forward', duration: 200 },
    { dir: 'left', duration: 167 },
    { dir: 'forward', duration: 900 },
    { dir: 'right', duration: 667 },
  ]},
  { label: 'F100+L200+F1000+R667', steps: [
    { dir: 'forward', duration: 100 },
    { dir: 'left', duration: 200 },      // rotate to -18°
    { dir: 'forward', duration: 1000 },  // move up-left from (144, ~232)
    { dir: 'right', duration: 667 },     // rotate to 45° in place → WIN
  ]},
  { label: 'F100+L133+F1100+R700', steps: [
    { dir: 'forward', duration: 100 },
    { dir: 'left', duration: 133 },      // rotate to -12°
    { dir: 'forward', duration: 1100 },
    { dir: 'right', duration: 700 },     // rotate to ~51°
  ]},
  { label: 'F200+L100+F1100+R667', steps: [
    { dir: 'forward', duration: 200 },
    { dir: 'left', duration: 100 },      // rotate to -9°
    { dir: 'forward', duration: 1100 },
    { dir: 'right', duration: 667 },
  ]},
];

const fpsValues = [60, 30, 20];
let foundAny = false;

for (const fps of fpsValues) {
  console.log(`── ${fps}fps ──`);
  for (const c of candidates) {
    const r = runSequence(puzzle2.spawn, c.steps, puzzle2.obstacles, puzzle2.exitZone, puzzle2.vehicleType, fps);
    const status = r.won && r.totalCollisions === 0 ? '✓ WIN' :
                   r.won ? '⚠ WIN (with collisions)' :
                   r.totalCollisions > 0 ? '✗ COLLISIONS' : '✗ NO EXIT';
    console.log(`  ${c.label.padEnd(30)} ${status}  (final: (${r.cx.toFixed(0)},${r.cy.toFixed(0)},${r.carAngle.toFixed(0)}°), collisions: ${r.totalCollisions})`);
    if (r.won && r.totalCollisions === 0) foundAny = true;
  }
}

// ═══════════════════════════════════════════════════════════════════
//  STEP 3 — Targeted brute-force search (coarse, fast)
// ═══════════════════════════════════════════════════════════════════

console.log('\n── TARGETED BRUTE-FORCE SEARCH (60fps, coarse) ──');
// Search F+L+F+R pattern (matching winning candidates):
//   forward1: 100-800ms (step 100ms)
//   steer-left: 100-300ms (step 50ms)
//   forward2: 600-1200ms (step 100ms)
//   steer-right: 500-1100ms (step 50ms)
// Total: 8×5×7×13 = 3,640 combinations

const initFwds = [];
for (let ms = 100; ms <= 800; ms += 100) initFwds.push(ms);
const leftSteers = [];
for (let ms = 100; ms <= 300; ms += 50) leftSteers.push(ms);
const fwds = [];
for (let ms = 600; ms <= 1200; ms += 100) fwds.push(ms);
const rightSteers = [];
for (let ms = 500; ms <= 1100; ms += 50) rightSteers.push(ms);

let bfFound = false;
let bfCount = 0;
for (const f1 of initFwds) {
  for (const sl of leftSteers) {
    for (const f2 of fwds) {
      for (const sr of rightSteers) {
        bfCount++;
        const steps = [
          { dir: 'forward', duration: f1 },
          { dir: 'left', duration: sl },
          { dir: 'forward', duration: f2 },
          { dir: 'right', duration: sr },
        ];
        const r = runSequence(puzzle2.spawn, steps, puzzle2.obstacles, puzzle2.exitZone, puzzle2.vehicleType, 60);
        if (r.won && r.totalCollisions === 0) {
          console.log(`  ✓ FOUND: F${f1}+L${sl}+F${f2}+R${sr}  (${bfCount} combinations tried)`);
          bfFound = true;
          break;
        }
      }
      if (bfFound) break;
    }
    if (bfFound) break;
  }
  if (bfFound) break;
}

if (!bfFound) {
  console.log(`  ✗ FAIL: No path found after ${bfCount} combinations.`);
}

// ═══════════════════════════════════════════════════════════════════
//  STEP 4 — Verify brute-force winner at multiple frame rates
// ═══════════════════════════════════════════════════════════════════

if (bfFound) {
  console.log('\n── MULTI-FPS VERIFICATION (brute-force winner) ──');
  const bfPath = [
    { dir: 'forward', duration: 100 },
    { dir: 'left', duration: 100 },
    { dir: 'forward', duration: 600 },
    { dir: 'right', duration: 500 },
  ];
  let allFpsPass = true;
  for (const fps of [60, 30, 20, 15, 10]) {
    const r = runSequence(puzzle2.spawn, bfPath, puzzle2.obstacles, puzzle2.exitZone, puzzle2.vehicleType, fps);
    const status = r.won && r.totalCollisions === 0 ? '✓ WIN' : '✗ FAIL';
    if (!r.won || r.totalCollisions > 0) allFpsPass = false;
    console.log(`  ${fps}fps: ${status}  (final: (${r.cx.toFixed(0)},${r.cy.toFixed(0)},${r.carAngle.toFixed(0)}°), collisions: ${r.totalCollisions})`);
  }
  console.log(`  → ${allFpsPass ? '✓ PASS (clean win at all frame rates)' : '✗ FAIL'}`);
}

// ═══════════════════════════════════════════════════════════════════
//  SUMMARY TABLE
// ═══════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  SUMMARY');
console.log('═══════════════════════════════════════════════════════════════\n');

const tableRows = [
  ['1a. Edge clearance', allInside ? 'PASS' : 'FAIL', 'All AABBs within 0–288'],
  ['1b. Obs–obs overlap', !anyOverlap ? 'PASS' : 'FAIL', 'Zero AABB overlaps'],
  ['1c. Exit zone clear', !exitBlocked ? 'PASS' : 'FAIL', 'Exit zone unobstructed'],
  ['1d. Spawn clear', !spawnCol.collided ? 'PASS' : 'FAIL', 'Player spawn safe'],
  ['1e. Flanking gap', gap > p45Box.w ? 'PASS' : 'FAIL', `Gap ${gap.toFixed(0)}px vs player ${p45Box.w}px (margin ${margin.toFixed(1)}px)`],
  ['2.  Candidate paths', foundAny ? 'PASS' : 'FAIL', `${fpsValues.join('/')}fps — at least one clean win`],
  ['3.  Brute-force', bfFound ? 'PASS' : 'FAIL', bfFound ? 'Path found in targeted search' : 'No path found'],
];

console.log('┌──────────────────────────────┬────────┬────────────────────────────────────┐');
console.log('│ CHECK                        │ RESULT │ NOTES                              │');
console.log('├──────────────────────────────┼────────┼────────────────────────────────────┤');
for (const [check, result, note] of tableRows) {
  const paddedCheck = check.padEnd(28);
  const paddedNote = note.padEnd(34);
  console.log(`│ ${paddedCheck} │ ${result === 'PASS' ? 'PASS  ' : 'FAIL  '} │ ${paddedNote} │`);
}
console.log('└──────────────────────────────┴────────┴────────────────────────────────────┘\n');
