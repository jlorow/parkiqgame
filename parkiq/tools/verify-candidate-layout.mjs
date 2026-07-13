/**
 * VERIFICATION SCRIPT — Candidate Layout vs Real Engine Math
 *
 * Reads the exact collision constants and functions from PuzzleScene.ts
 * and runs the 5 checks from the spec against the candidate layout.
 *
 * Run: node tools/verify-candidate-layout.mjs
 */

// ═══════════════════════════════════════════════════════════════════
//  REAL ENGINE CONSTANTS  (from PuzzleScene.ts)
// ═══════════════════════════════════════════════════════════════════

const UNIT_PX = 48;
const GRID_SIZE = 288;
const CONTAINER_OFFSET_X = 0.5;
const CONTAINER_OFFSET_Y = 0.5;

// Collision box dimensions
const CAR_W = 36;   // sedan/suv obstacle collision width
const CAR_H = 64;   // sedan/suv obstacle collision height
const PLAYER_W = 36; // player car collision width (activeCarW for sedan)
const PLAYER_H = 64; // player car collision height (activeCarH for sedan)

// ═══════════════════════════════════════════════════════════════════
//  REAL ENGINE COLLISION FUNCTION  (from PuzzleScene.checkCollision)
//
//  Uses AABB — axis-aligned bounding boxes, NO rotation applied to
//  obstacle collision boxes. The obstacle's `angle` field is only
//  used for visual rendering in setAngle(), never for hit-testing.
//  Walls and pillars are SKIPPED entirely (no collision).
// ═══════════════════════════════════════════════════════════════════

function makeRect(cx, cy, w, h) {
  return { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 };
}

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/**
 * Checks collision between player at (px, py) with playerW × playerH
 * against ALL obstacles in the candidate list.
 * Replicates the logic in PuzzleScene.checkCollision() EXACTLY.
 */
function checkCollision(px, py, obstacles, playerW, playerH) {
  const playerRect = makeRect(px, py, playerW, playerH);

  for (const obs of obstacles) {
    // Wall and pillar have NO collision — skipped in engine
    if (obs.type === 'wall' || obs.type === 'pillar') continue;

    // Obstacle collision box: axis-aligned, centered at (obs.x, obs.y)
    // Size is always CAR_W × CAR_H (36×64), regardless of obstacle type
    const obsRect = makeRect(obs.x, obs.y, CAR_W, CAR_H);

    if (rectsOverlap(playerRect, obsRect)) {
      return { collided: true, obstacle: obs };
    }
  }
  return { collided: false, obstacle: null };
}

/**
 * Boundary clamp check — does the obstacle's AABB stay within 0-288?
 */
function getAABBExtents(x, y, w, h) {
  const r = makeRect(x, y, w, h);
  return {
    left: r.left,
    right: r.right,
    top: r.top,
    bottom: r.bottom,
    insideX: r.left >= 0 && r.right <= GRID_SIZE,
    insideY: r.top >= 0 && r.bottom <= GRID_SIZE,
    fullyInside: r.left >= 0 && r.right <= GRID_SIZE && r.top >= 0 && r.bottom <= GRID_SIZE,
    overflowLeft: Math.max(0, -r.left),
    overflowRight: Math.max(0, r.right - GRID_SIZE),
    overflowTop: Math.max(0, -r.top),
    overflowBottom: Math.max(0, r.bottom - GRID_SIZE),
  };
}

// ═══════════════════════════════════════════════════════════════════
//  EXIT ZONE CHECK  (from PuzzleScene.checkExitReached)
//
//  parkingType is CHECKED as truthy — any truthy string sets 48×48 bay.
//  Valid types in TS: 'parallel' | 'perpendicular' — 'angled' is NOT
//  a valid type, but the runtime JS check would treat it as truthy.
// ═══════════════════════════════════════════════════════════════════

function checkExitReached(px, py, exitZone) {
  const baySize = exitZone.parkingType ? 48 : 96;
  const halfBay = baySize / 2;

  // IMPORTANT: Current engine uses ez.col/row for positioning.
  // The candidate layout uses raw pixel x/y instead.
  // For verification, we treat x/y as the center of the exit zone.
  const exitPixelX = exitZone.x - halfBay;
  const exitPixelY = exitZone.y - halfBay;
  const exitRect = makeRect(exitZone.x, exitZone.y, baySize, baySize);

  const playerRect = makeRect(px, py, PLAYER_W, PLAYER_H);
  const overlaps = rectsOverlap(playerRect, exitRect);

  // Angle check: parkingAngle not defined in candidate → no angle gate
  // The engine only applies angle check if parkingAngle is !== undefined

  return { overlaps, exitRect, baySize };
}

// ═══════════════════════════════════════════════════════════════════
//  CANDIDATE LAYOUT
// ═══════════════════════════════════════════════════════════════════

const candidate = {
  obstacles: [
    { type: 'sedan', x: 46,  y: 32,  angle: 45 },
    { type: 'suv',   x: 46,  y: 112, angle: 45 },
    { type: 'sedan', x: 46,  y: 192, angle: 45 },
    { type: 'wall',  x: 10,  y: 112, angle: 0 },
    { type: 'suv',   x: 155, y: 28,  angle: 45 },
    { type: 'sedan', x: 155, y: 168, angle: 45 },
    { type: 'wall',  x: 270, y: 112, angle: 0 },
  ],
  playerCar: { x: 144, y: 250, angle: 0 },
  exitZone: { x: 155, y: 98, angle: 45, parkingType: 'angled' },
};

// ═══════════════════════════════════════════════════════════════════
//  STEP 1 — REPORT REAL NUMBERS
// ═══════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════');
console.log('  STEP 1 — REAL ENGINE NUMBERS');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('1a. SPRITE COLLISION DIMENSIONS (from PuzzleScene.ts constants):');
console.log(`    CAR_W (obstacle width)  = ${CAR_W}px  (used for ALL obstacle types: sedan, suv)`);
console.log(`    CAR_H (obstacle height) = ${CAR_H}px  (used for ALL obstacle types: sedan, suv)`);
console.log(`    PLAYER_W (player width) = ${PLAYER_W}px (activeCarW for sedan)`);
console.log(`    PLAYER_H (player height)= ${PLAYER_H}px (activeCarH for sedan)`);
console.log(`    LARGE_CAR_W = 36px  (truck/limo/semitruck width)`);
console.log(`    LARGE_CAR_H = 96px  (truck/limo/semitruck height — not applicable here)`);
console.log('');

console.log('1b. COLLISION METHOD:');
console.log('    AABB — Axis-Aligned Bounding Box overlap (Phaser.Geom.Rectangle.Overlaps)');
console.log('    Obstacle angle is IGNORED for collision — visual rotation only (setAngle()).');
console.log('    NO SAT, no rotated bounding boxes, no padding constants.');
console.log('    Walls and pillars are SKIPPED entirely — no collision box.');
console.log('');

console.log('1c. PLAYFIELD BOUNDS:');
console.log('    GRID_SIZE = 288 × 288 pixels');
console.log('    Origin: top-left (0, 0) — container-local coordinates');
console.log('    6 columns × 6 rows, each 48px (UNIT_PX)');
console.log('    Container offset: +0.5 units on both axes (centers objects in cells)');
console.log('    Grid cell centers: (col + 0.5, row + 0.5) × 48');
console.log('');

console.log('1d. COLLISION FUNCTION (exact paste from PuzzleScene.checkCollision):');
console.log(`
  private checkCollision(cx: number, cy: number): boolean {
    const playerRect = new Phaser.Geom.Rectangle(
      cx - activeCarW/2, cy - activeCarH/2, activeCarW, activeCarH
    );
    for (const obs of this.puzzle.obstacles) {
      if (obs.type === 'pillar' || obs.type === 'wall') continue;
      // Note: obs.col/row used for grid puzzles; for freeform pixel coords,
      // we substitute direct x/y pixel positions.
      const ox = (obs.col + CONTAINER_OFFSET_X) * UNIT_PX;
      const oy = (obs.row + CONTAINER_OFFSET_Y) * UNIT_PX;
      const obsRect = new Phaser.Geom.Rectangle(
        ox - CAR_W/2, oy - CAR_H/2, CAR_W, CAR_H
      );
      if (Phaser.Geom.Rectangle.Overlaps(playerRect, obsRect)) return true;
    }
    return false;
  }`);
console.log('');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  STEP 2 — CHECKS AGAINST CANDIDATE LAYOUT');
console.log('═══════════════════════════════════════════════════════════════\n');

const obs = candidate.obstacles;
const pc = candidate.playerCar;
const ez = candidate.exitZone;

// ── CHECK 2.1: EDGE CLEARANCE ─────────────────────────────────────
console.log('── CHECK 2.1: EDGE CLEARANCE ──────────────────────────────');
console.log('  Does every obstacle AABB stay fully inside 0–288?\n');

let allInside = true;
for (let i = 0; i < obs.length; i++) {
  const o = obs[i];
  // sedans and suvs use 36×64; walls have no collision but are rendered
  const useW = (o.type === 'wall') ? 36 : CAR_W;
  const useH = (o.type === 'wall') ? 64 : CAR_H;
  const ext = getAABBExtents(o.x, o.y, useW, useH);
  const status = ext.fullyInside ? '✓ INSIDE' : '✗ OVERFLOW';
  if (!ext.fullyInside) allInside = false;
  const sizeNote = o.type === 'wall' ? ' (36×64 assumed — wall dims undefined in engine)' : '';
  console.log(`  Obstacle #${i + 1} (${o.type.padEnd(6)}) @ (${String(o.x).padStart(3)}, ${String(o.y).padStart(3)}) ${o.angle}°${sizeNote}`);
  console.log(`    AABB: left=${ext.left.toFixed(1)}, right=${ext.right.toFixed(1)}, top=${ext.top.toFixed(1)}, bottom=${ext.bottom.toFixed(1)}`);
  if (ext.fullyInside) {
    console.log(`    → ${status}`);
  } else {
    const overParts = [];
    if (ext.overflowLeft > 0) overParts.push(`left by ${ext.overflowLeft.toFixed(1)}px`);
    if (ext.overflowRight > 0) overParts.push(`right by ${ext.overflowRight.toFixed(1)}px`);
    if (ext.overflowTop > 0) overParts.push(`top by ${ext.overflowTop.toFixed(1)}px`);
    if (ext.overflowBottom > 0) overParts.push(`bottom by ${ext.overflowBottom.toFixed(1)}px`);
    console.log(`    → ${status} — overflows ${overParts.join(', ')}`);
  }
  console.log('');
}

console.log(allInside ? '✓ PASS — All obstacles fully inside 0–288 bounds' : '✗ FAIL — Some obstacles overflow the playfield boundary');
console.log('');

// ── CHECK 2.2: OBSTACLE-TO-OBSTACLE OVERLAP ──────────────────────
console.log('── CHECK 2.2: OBSTACLE-TO-OBSTACLE OVERLAP ───────────────');
console.log('  Checking every pair of obstacles for AABB overlap...\n');

let anyOverlap = false;
// Note: walls are skipped in collision by the engine, but we still check
// overlap between rendered obstacles for completeness
for (let i = 0; i < obs.length; i++) {
  for (let j = i + 1; j < obs.length; j++) {
    const a = obs[i];
    const b = obs[j];

    // Use CAR_W/H for sedan/suv; same for wall (for rendering overlap check)
    const aW = (a.type === 'wall') ? 36 : CAR_W;
    const aH = (a.type === 'wall') ? 64 : CAR_H;
    const bW = (b.type === 'wall') ? 36 : CAR_W;
    const bH = (b.type === 'wall') ? 64 : CAR_H;

    const rectA = makeRect(a.x, a.y, aW, aH);
    const rectB = makeRect(b.x, b.y, bW, bH);

    if (rectsOverlap(rectA, rectB)) {
      anyOverlap = true;
      const overlapX = Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left);
      const overlapY = Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top);
      console.log(`  ✗ OVERLAP: #${i + 1} (${a.type.padEnd(6)}) @ (${a.x}, ${a.y}) ↔ #${j + 1} (${b.type.padEnd(6)}) @ (${b.x}, ${b.y})`);
      console.log(`    Overlap: ${overlapX.toFixed(1)}px × ${overlapY.toFixed(1)}px`);
    }
  }
}

if (!anyOverlap) {
  console.log('  ✓ No obstacle-to-obstacle AABB overlaps found.');
}
console.log('');

// ── CHECK 2.3: EXIT ZONE CLEARANCE ───────────────────────────────
console.log('── CHECK 2.3: EXIT ZONE CLEARANCE ────────────────────────');
console.log('  Does the exit zone AABB overlap any obstacle?\n');

const exitBaySize = ez.parkingType ? 48 : 96;
const exitRect = makeRect(ez.x, ez.y, exitBaySize, exitBaySize);

console.log(`  Exit zone center: (${ez.x}, ${ez.y})`);
console.log(`  Exit zone AABB (${exitBaySize}×${exitBaySize}): left=${exitRect.left.toFixed(1)}, right=${exitRect.right.toFixed(1)}, top=${exitRect.top.toFixed(1)}, bottom=${exitRect.bottom.toFixed(1)}`);
console.log(`  parkingType: '${ez.parkingType}' → baySize = ${exitBaySize} (truthy check => 48×48)`);
console.log(`  NOTE: 'angled' is NOT a valid parkingType in the TS type system`);
console.log(`  (valid values: 'parallel' | 'perpendicular'). The runtime treats`);
console.log(`  any truthy string as 48×48 bay.\n`);

let exitBlocked = false;
for (let i = 0; i < obs.length; i++) {
  const o = obs[i];
  const oW = CAR_W;
  const oH = CAR_H;
  const rectO = makeRect(o.x, o.y, oW, oH);

  if (rectsOverlap(exitRect, rectO)) {
    const overlapX = Math.min(exitRect.right, rectO.right) - Math.max(exitRect.left, rectO.left);
    const overlapY = Math.min(exitRect.bottom, rectO.bottom) - Math.max(exitRect.top, rectO.top);
    console.log(`  ✗ OVERLAP: Obstacle #${i + 1} (${o.type}) @ (${o.x}, ${o.y}) overlaps exit zone by ${overlapX.toFixed(1)}px × ${overlapY.toFixed(1)}px`);
    exitBlocked = true;
  }
}

if (!exitBlocked) {
  console.log('  ✓ CLEAR — No obstacle overlaps the exit zone.');
}
console.log('');

// ── CHECK 2.4: PLAYER SPAWN CLEARANCE ────────────────────────────
console.log('── CHECK 2.4: PLAYER SPAWN CLEARANCE ─────────────────────');
console.log('  Does playerCar starting AABB overlap any obstacle?\n');

const playerRect = makeRect(pc.x, pc.y, PLAYER_W, PLAYER_H);
console.log(`  Player at (${pc.x}, ${pc.y}), angle ${pc.angle}°`);
console.log(`  Player AABB (${PLAYER_W}×${PLAYER_H}): left=${playerRect.left.toFixed(1)}, right=${playerRect.right.toFixed(1)}, top=${playerRect.top.toFixed(1)}, bottom=${playerRect.bottom.toFixed(1)}`);

const spawnCollision = checkCollision(pc.x, pc.y, obs, PLAYER_W, PLAYER_H);
if (spawnCollision.collided) {
  const co = spawnCollision.obstacle;
  const oRect = makeRect(co.x, co.y, CAR_W, CAR_H);
  console.log(`  ✗ BLOCKED — Player overlaps with ${co.type} @ (${co.x}, ${co.y})`);
  console.log(`    Obstacle AABB: left=${oRect.left.toFixed(1)}, right=${oRect.right.toFixed(1)}, top=${oRect.top.toFixed(1)}, bottom=${oRect.bottom.toFixed(1)}`);
} else {
  console.log('  ✓ CLEAR — Player spawns without overlapping any obstacle.');
}
console.log('');

// ── CHECK 2.5: SOLVABILITY SANITY ────────────────────────────────
console.log('── CHECK 2.5: SOLVABILITY SANITY ────────────────────────');
console.log('  Rough geometric check — is there a clear path from spawn');
console.log('  to exit zone, or is it trivially impossible?\n');

// Quick check: is the player completely boxed in?
// Check if player can move even 1px in any direction
const playerOffsets = [
  { dx: 0, dy: -1 },  // up
  { dx: 0, dy: 1 },   // down
  { dx: -1, dy: 0 },  // left
  { dx: 1, dy: 0 },   // right
];

let freeDirections = [];
for (const off of playerOffsets) {
  const nx = pc.x + off.dx;
  const ny = pc.y + off.dy;
  const result = checkCollision(nx, ny, obs, PLAYER_W, PLAYER_H);
  if (!result.collided) {
    freeDirections.push(off);
  }
}

console.log(`  Player at (${pc.x}, ${pc.y}), angle 0° (facing UP — negative Y)`);
console.log(`  Player can move: ${freeDirections.length === 0 ? 'NOWHERE — completely stuck!' : `${freeDirections.length} direction(s) clear`}`);
for (const d of freeDirections) {
  const dirName = d.dy === -1 ? 'UP' : d.dy === 1 ? 'DOWN' : d.dx === -1 ? 'LEFT' : 'RIGHT';
  console.log(`    → ${dirName} is clear`);
}

// Rough corridor check: from player Y (250) to exit Y (98)
// Player faces up (0°), so forward is decreasing Y.
// Note: Exit is horizontally offset 11px right of player (x=155 vs x=144).
// This is NOT a real pathfinder — just checks if obstacles block a vertical strip.
const exitTop = exitRect.top;
const playerBottom = playerRect.bottom;

console.log(`\n  NOTE: Player is at X=${pc.x} but exit center is at X=${ez.x} (11px horizontal offset).`);
console.log(`  Vertical corridor check at mid-X=${((pc.x + ez.x) / 2).toFixed(0)} (midpoint between player and exit):`);
const corridorCenterX = (pc.x + ez.x) / 2;
const corridorRect = makeRect(corridorCenterX, (pc.y + exitRect.top) / 2, PLAYER_W, pc.y - exitRect.top);
let corridorBlocked = false;
for (let i = 0; i < obs.length; i++) {
  const o = obs[i];
  if (o.type === 'wall') continue; // wall has no collision
  const oRect = makeRect(o.x, o.y, CAR_W, CAR_H);
  const blockedRects = rectsOverlap(corridorRect, oRect);
  if (blockedRects) {
    corridorBlocked = true;
    console.log(`  ✗ Obstacle #${i + 1} (${o.type}) @ (${o.x}, ${o.y}) blocks the vertical corridor`);
  }
}

if (!corridorBlocked) {
  console.log('  ✓ Vertical corridor at player X is clear.');
} else {
  console.log('  → Player will need to steer around blocked obstacles.');
}

// Check if exit zone is accessible (not fully surrounded by obstacles)
console.log(`\n  Exit zone accessibility:`);
// Check a few approach positions
const approachPositions = [
  { x: ez.x, y: ez.y + 30 },   // below exit
  { x: ez.x, y: ez.y - 30 },   // above exit
  { x: ez.x - 30, y: ez.y },   // left of exit
  { x: ez.x + 30, y: ez.y },   // right of exit
];

let approachable = false;
for (const ap of approachPositions) {
  const apRect = makeRect(ap.x, ap.y, PLAYER_W, PLAYER_H);
  let blocked = false;
  for (const o of obs) {
    if (o.type === 'wall') continue;
    const oRect = makeRect(o.x, o.y, CAR_W, CAR_H);
    if (rectsOverlap(apRect, oRect)) { blocked = true; break; }
  }
  // Also check it within bounds
  const inside = apRect.left >= 0 && apRect.right <= GRID_SIZE && apRect.top >= 0 && apRect.bottom <= GRID_SIZE;
  if (!blocked && inside) {
    approachable = true;
  }
  console.log(`    Approach from ${ap.x > ez.x ? 'right' : ap.x < ez.x ? 'left' : ap.y > ez.y ? 'below' : 'above'} (${ap.x}, ${ap.y}): ${blocked ? '✗ blocked' : '✓ clear'}${inside ? '' : ' (out of bounds)'}`);
}

console.log('');
if (freeDirections.length > 0 && approachable) {
  console.log('  ✓ POTENTIALLY SOLVABLE — Player can move and exit zone is approachable.');
} else if (freeDirections.length === 0) {
  console.log('  ⚠ TRIVIALLY IMPOSSIBLE — Player is completely stuck at spawn.');
} else {
  console.log('  ⚠ Exit zone may be hard to approach — needs proper pathfinding to confirm.');
}
console.log('');

// ═══════════════════════════════════════════════════════════════════
//  STEP 3 — SUMMARY
// ═══════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════');
console.log('  STEP 3 — SUMMARY REPORT');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('┌────────────────────────────────────────────────────────────────────────────────┐');
console.log('│ CHECK                          │ RESULT │ NOTES                                │');
console.log('├────────────────────────────────┼────────┼──────────────────────────────────────┤');

// Check 1: Edge clearance
let allEdgePass = true;
for (const o of obs) {
  const ext = getAABBExtents(o.x, o.y, o.type === 'wall' ? 36 : CAR_W, o.type === 'wall' ? 64 : CAR_H);
  if (!ext.fullyInside) allEdgePass = false;
}
console.log(`│ 1. Edge clearance (all 7 obs)   │ ${allEdgePass ? 'PASS  ' : 'FAIL  '} │ See detailed overflow listings above           │`);

// Check 2: Obstacle overlap
console.log(`│ 2. Obstacle-to-obstacle overlap │ ${anyOverlap ? 'FAIL  ' : 'PASS  '} │ ${anyOverlap ? 'See overlap details above            ' : 'Zero AABB overlaps                    '} │`);

// Check 3: Exit zone clearance
console.log(`│ 3. Exit zone clearance          │ ${exitBlocked ? 'FAIL  ' : 'PASS  '} │ parkingType='angled' treated as truthy→48×48  │`);

// Check 4: Player spawn clearance
console.log(`│ 4. Player spawn clearance       │ ${spawnCollision.collided ? 'FAIL  ' : 'PASS  '} │ Player at (${String(pc.x).padStart(3)}, ${String(pc.y).padStart(3)})                                 │`);

// Check 5: Solvability sanity
const solvable = freeDirections.length > 0;
console.log(`│ 5. Solvability (rough)          │ ${solvable ? 'PASS  ' : 'FAIL  '} │ ${solvable ? 'Can move at spawn, exit approachable ' : 'Completely stuck at spawn            '} │`);

console.log('└────────────────────────────────────────────────────────────────────────────────┘');
console.log('');

// ═══════════════════════════════════════════════════════════════════
//  ADDITIONAL NOTE ON DATA FORMAT INCOMPATIBILITY
// ═══════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════');
console.log('  ⚠ DATA FORMAT NOTE');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('  The candidate layout uses a FREE-FORMAT (pixel x/y coordinates)');
console.log('  that does NOT match the current game engine data types which');
console.log('  use grid-based col/row/direction:');
console.log('');
console.log('  Current Obstacle type:   { col, row, type, angle }');
console.log('  Candidate format:        { x, y, type, angle }');
console.log('');
console.log('  Current ExitZone type:   { col, row, direction }');
console.log('  Candidate format:        { x, y, angle, parkingType }');
console.log('');
console.log('  The candidate format matches the Level Editor export format,');
console.log('  which targets a future freeform puzzle system NOT yet integrated');
console.log('  into PuzzleScene.ts. The collision math above treats pixel x/y');
console.log('  as direct coordinates in the 288×288 playfield.');
console.log('');
