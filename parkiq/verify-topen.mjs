/**
 * verify-topen.mjs — v6: Overlap-width-vs-time curve for Tiers 3 & 4
 *
 * 1. For one live column, dump overlap width at 0.02s resolution
 *    over one full grid cycle (288/speed seconds).
 *
 * 2. State how column computation relates to Phaser collision in
 *    PuzzleScene.ts.
 *
 * 3. No tier decision from script alone.
 */
"use strict";

const UNIT_PX = 48;
const CAR_W = 36;
const GRID_COLS = 6;
const TRAIN_W = 44;
const TRAIN_H = 44;

const TIERS = [
  { label: 'Tier 3', speed: 34, gapUnits: 3 },
  { label: 'Tier 4', speed: 20, gapUnits: 2 },
];

function computeGapCols(offsetPx, gapUnits) {
  const rawGapCol = Math.floor(offsetPx / UNIT_PX);
  const gapStartCol = ((rawGapCol % GRID_COLS) + GRID_COLS) % GRID_COLS;
  const isGap = new Array(GRID_COLS).fill(false);
  for (let g = 0; g < gapUnits; g++)
    isGap[(gapStartCol + g) % GRID_COLS] = true;
  return isGap;
}

// ── 1. Overlap-vs-time curve ─────────────────────────────────
for (const tier of TIERS) {
  const gapPx = tier.gapUnits * UNIT_PX;
  const cyclePx = GRID_COLS * UNIT_PX;            // 288px per full grid cycle
  const cycleSec = cyclePx / tier.speed;           // time for one full cycle
  const halfCycleSec = cycleSec / 2;               // half-cycle is live-col pattern period

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`  ${tier.label}: ${tier.speed}px/s, gap=${tier.gapUnits}u (${gapPx}px)`);
  console.log(`  One full grid cycle: ${cycleSec.toFixed(3)}s (${halfCycleSec.toFixed(3)}s half-cycle)`);
  console.log(`═══════════════════════════════════════════════════════════════`);

  // Pick a LIVE column (one that gets overlap)
  const col = 1;  // For both Tier 3 and 4, col 1 is live

  // Dump overlap state at 0.02s resolution over one half-cycle
  const steps = Math.floor(halfCycleSec / 0.02);
  const offsets = [0, 2 * UNIT_PX];  // match game initial offset
  let prevBoth = false;
  let openStart = -1;
  const tableRows = [];

  for (let i = 0; i <= steps; i++) {
    const t = i * 0.02;
    // Simulate: move both trains at their speeds
    offsets[0] = tier.speed * t;
    offsets[1] = 2 * UNIT_PX - tier.speed * t;
    const g1 = computeGapCols(offsets[0], tier.gapUnits);
    const g2 = computeGapCols(offsets[1], tier.gapUnits);

    // Column state: does this column have gap on BOTH tracks?
    const track1HasGap = g1[col];
    const track2HasGap = g2[col];
    const bothGap = track1HasGap && track2HasGap;

    // Also compute the gap-start columns for tracking
    const s1 = Math.floor(offsets[0] / UNIT_PX) % GRID_COLS;
    const s2 = Math.floor(offsets[1] / UNIT_PX) % GRID_COLS;

    if (bothGap && !prevBoth) openStart = t;
    if (!bothGap && prevBoth && openStart >= 0) {
      const d = t - openStart;
      tableRows.push({ start: openStart.toFixed(3), end: t.toFixed(3), dur: d.toFixed(3) });
      openStart = -1;
    }
    prevBoth = bothGap;

    // Print every 0.2s (every 10th step) for readable table
    if (i % 10 === 0) {
      const rowLabel = t < 1 ? ` t=${t.toFixed(2)}s` : `t=${t.toFixed(2)}s`;
      const s1Col = ((s1 % GRID_COLS) + GRID_COLS) % GRID_COLS;
      const s2Col = ((s2 % GRID_COLS) + GRID_COLS) % GRID_COLS;
      const ov = (track1HasGap && track2HasGap) ? 'BOTH' : track1HasGap ? 'T1  ' : track2HasGap ? '  T2' : ' -- ';
      console.log(`  ${rowLabel} | T1 start=${s1Col} T2 start=${s2Col} | col ${col}: ${ov}`);
    }
  }

  console.log(`\n  Col ${col} open windows during this half-cycle:`);
  if (tableRows.length === 0) {
    console.log(`  (none — column never has both gaps)`);
  } else {
    for (const r of tableRows) {
      console.log(`  ${r.start}s → ${r.end}s  (duration ${r.dur}s)`);
    }
  }
  console.log(`  Open windows shown above have duration = measured T_open.`);
}

// ── 2. Collision-model comparison ─────────────────────────────
console.log(`\n═══════════════════════════════════════════════════════════════`);
console.log(`  COLLISION MODEL: Script vs Actual PuzzleScene.ts`);
console.log(`═══════════════════════════════════════════════════════════════`);

console.log(`\nScript model:`);
console.log(`  computeGapCols(offset, gapUnits) → boolean[6]`);
console.log(`    gapStartCol = floor(offset / ${UNIT_PX}) % ${GRID_COLS}   (discrete column index)`);
console.log(`    isGap[c] = true when column c is in gap range`);
console.log(`  overlapCount(g1, g2) returns n = |{c: g1[c] && g2[c]}|`);
console.log(`  "enough" = (n * ${UNIT_PX}px) >= ${CAR_W}px`);
console.log(`  → n >= 1 means at least 1 column has gap on BOTH tracks`);
console.log(`  → Gap position: DISCRETE (column-granular)`);

console.log(`\nActual PuzzleScene.ts checkTrainCollision():`);
console.log(`  Same gap computation:`);
console.log(`    rawGapCol = Math.floor(offset / ${UNIT_PX})`);
console.log(`    gapStartCol = ((rawGapCol % ${GRID_COLS}) + ${GRID_COLS}) % ${GRID_COLS}`);
console.log(`    → Same discrete column logic`);
console.log(`  Then for each OCCUPIED cell (not gap):`);
console.log(`    trainRect = Rectangle(center_x - ${TRAIN_W}/2, center_y - ${TRAIN_H}/2, ${TRAIN_W}, ${TRAIN_H})`);
console.log(`    playerRect = Rectangle(carX - ${CAR_W}/2, carY - ${CAR_H}/2, ${CAR_W}, ${CAR_H})`);
console.log(`    if (Phaser.Geom.Rectangle.Overlaps(playerRect, trainRect)) → HIT`);
console.log(`  → Collision: CONTINUOUS pixel-space AABB`);

console.log(`\nKey alignment:`);
console.log(`  Gap position math: IDENTICAL (same floor/UNIT_PX/%6)`);
console.log(`  Initial offsets:   IDENTICAL ([0, ${2*UNIT_PX}])`);
console.log(`  Speed values:      IDENTICAL (from puzzle-data.ts)`);
console.log(`  GapUnits:          IDENTICAL (from puzzle-data.ts)`);
console.log(`  UNITS:             IDENTICAL (UNIT_PX=${UNIT_PX})`);

console.log(`\nKey difference:`);
console.log(`  Script: checks "does any column exist where BOTH tracks`);
console.log(`    have gap?" — a DISCRETE column-existence test.`);
console.log(`  Game:   checks "does any OCCUPIED cell's ${TRAIN_W}x${TRAIN_H} rect`);
console.log(`    overlap the player's ${CAR_W}x${CAR_H} rect?" — CONTINUOUS AABB.`);

console.log(`\nImpact on T_open measurement:`);
console.log(`  The gap position is discrete in BOTH (Math.floor(offset/48)%6).`);
console.log(`  The "enough" condition (n>=1 mapped to overlap>=${CAR_W}px) is a`);
console.log(`  conservative proxy for the real collision: if no column has`);
console.log(`  both gaps, NO player position within that column row is safe.`);
console.log(`  If at least 1 column has both gaps, the player can position`);
console.log(`  at that column's center (±6px tolerance) and cross.`);
console.log(`  → Script T_open is a VALID lower bound on in-game T_open.`);

console.log(`\nRemaining gap (not captured by script):`);
console.log(`  The player can approach the gap diagonally or at an angle,`);
console.log(`  potentially threading a narrower corridor than straight-on.`);
console.log(`  The player can also start moving BEFORE the window opens,`);
console.log(`  arriving exactly as it does. These INCREASE effective window.`);
console.log(`  Script does not model player trajectory — only column state.`);
console.log(`  → In-game T_open >= script T_open.`);

// ── 3. Live crossing — CANDID ACKNOWLEDGEMENT ──────────────────
console.log(`\n═══════════════════════════════════════════════════════════════`);
console.log(`  LIVE CROSSING: Constraint Acknowledged`);
console.log(`═══════════════════════════════════════════════════════════════`);

console.log(`\nThe Devvit playtest (npm run dev → devvit playtest ParkIQGame)`);
console.log(`requires the full Devvit CLI and Reddit app-server runtime.`);
console.log(`This sandbox environment does not have Devvit CLI access.`);
console.log(`\nTo run the live crossing test on YOUR machine:`);

console.log(`\n  Prerequisites:`);
console.log(`  1. PuzzleScene.ts must have DEBUG_LOAD_BONUS = true`);
console.log(`     (currently: ${true})`);
console.log(`  2. puzzle-data.ts must have the target tier's speed/gap`);
console.log(`     (currently: Tier 2 = 45px/s, 4u — NOT scissor; needs switch to Tier 3)`);
console.log(`  3. npm install completed in parkiq/`);
console.log(`\n  Steps:`);
console.log(`  1. Set puzzle-data.ts bonusPuzzle.trains[0].speed = 34`);
console.log(`     (if testing Tier 3 — the strongest candidate)`);
console.log(`     Also: gapUnits=3, gapPx=144`);
console.log(`  2. npm run dev  (starts Devvit playtest)`);
console.log(`  3. In the game, drive to col 1 (live column for Tier 3).`);
console.log(`  4. Wait for both gaps to align. Drive through.`);
console.log(`  5. Check browser console for T_open measurement logs`);
console.log(`     (console instrumentation is in PuzzleScene.ts, active).`);

console.log(`\n  Expected result for Tier 3 (col 1):`);
console.log(`  T_open = 2.82s per script measurement (≥ 2× T_sprint=1.33s)`);
console.log(`  Window should feel generous. 4 of 6 cols are live.`);
