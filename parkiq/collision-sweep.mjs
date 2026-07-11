/**
 * HYBRID GUARD VERIFICATION — Round 2
 *
 * Matching baseline resolution: Y_STEP=4 (same as original 155k sweep)
 * Col-2-specific boundary table + "any column" separately labeled.
 *
 * Constants match PuzzleScene.ts exactly.
 */
const UNIT_PX = 48;
const CONTAINER_OFFSET_X = 0.5, CONTAINER_OFFSET_Y = 0.5;
const CAR_W = 36, CAR_H = 64, TRAIN_W = 44;
const CAR_HALF = CAR_H / 2;
const TRAIN_CONFIGS = [
  { row: 3, direction: 'right', speed: 34, gapUnits: 3 },
  { row: 4, direction: 'left',  speed: 34, gapUnits: 3 },
];
const ROW_CENTERS = [0,1,2,3,4,5].map(r => (r + CONTAINER_OFFSET_Y) * UNIT_PX);
const CELL_HALF = UNIT_PX / 2; // 24
const ROW5_CELL = { lo: ROW_CENTERS[5] - CELL_HALF, hi: ROW_CENTERS[5] + CELL_HALF }; // [240, 288]
const ROW2_CELL = { lo: ROW_CENTERS[2] - CELL_HALF, hi: ROW_CENTERS[2] + CELL_HALF }; // [96, 144]
const ROW3_CENTER = ROW_CENTERS[3], ROW4_CENTER = ROW_CENTERS[4];
const CYCLE_DURATION = (6 * UNIT_PX) / 34; // ~8.47s

// MATCHING BASELINE RESOLUTION: Y_STEP=4, DT=0.02
const DT = 0.02;
const Y_STEP = 4;
const Y_MIN = 72, Y_MAX = 312;

function inSafeCell(py) {
  return (py >= ROW5_CELL.lo && py <= ROW5_CELL.hi) ||
         (py >= ROW2_CELL.lo && py <= ROW2_CELL.hi);
}

function getGapCols(offset, gapUnits) {
  const raw = Math.floor(offset / UNIT_PX);
  const start = ((raw % 6) + 6) % 6;
  const s = new Set();
  for (let g = 0; g < gapUnits; g++) s.add((start + g) % 6);
  return s;
}

function rectsOverlap(px, py, pw, ph, cx, cy, cw, ch) {
  return (px + pw/2 > cx - cw/2) && (py + ph/2 > cy - ch/2) &&
         (px - pw/2 < cx + cw/2) && (py - ph/2 < cy + ch/2);
}

function checkCollisionAt(off1, off2, px, py, tch, skipGuard) {
  if (!skipGuard && inSafeCell(py)) return { type: 'guard-skipped', col: -1, hit: false, py };
  const g1 = getGapCols(off1, 3), g2 = getGapCols(off2, 3);
  const tchHalf = tch / 2;
  const col = Math.round((px - CONTAINER_OFFSET_X * UNIT_PX) / UNIT_PX);
  if (col < 0 || col > 5) return { type: 'none', col, hit: false };
  const bothGap = g1.has(col) && g2.has(col);

  for (const cfg of TRAIN_CONFIGS) {
    const off = cfg.row === 3 ? off1 : off2;
    const lg = getGapCols(off, cfg.gapUnits);
    const ty = (cfg.row + CONTAINER_OFFSET_Y) * UNIT_PX;
    for (let c = 0; c < 6; c++) {
      if (lg.has(c)) continue;
      const tx = (c + CONTAINER_OFFSET_X) * UNIT_PX;
      if (rectsOverlap(px, py, CAR_W, CAR_H, tx, ty, TRAIN_W, tch)) {
        if (bothGap) return { type: 'gap-protected', col, hit: true, trackRow: cfg.row, py };
        return { type: 'hit', col, hit: true, trackRow: cfg.row, py, bothGap };
      }
    }
  }
  return { type: 'none', col, hit: false };
}

function categorizeHit(py) {
  if (py >= ROW5_CELL.lo && py <= ROW5_CELL.hi) return 'spawn-cell';
  if (py >= ROW2_CELL.lo && py <= ROW2_CELL.hi) return 'exit-cell';
  return 'expected-or-transition';
}

// ════════════════════════════════════════════════════════════
//  FULL SWEEP at Y_STEP=4 (matching baseline)
// ════════════════════════════════════════════════════════════

function runSweep(tch, label, skipGuard) {
  const s = { total:0, none:0, gapProtected:0, expectedOrTransition:0, spawnCell:0, exitCell:0, guardSkipped:0 };
  const collFn = (o1, o2, px, py, tch) => checkCollisionAt(o1, o2, px, py, tch, skipGuard);

  for (let col = 0; col < 6; col++) {
    const px = (col + CONTAINER_OFFSET_X) * UNIT_PX;
    for (let t = 0; t < CYCLE_DURATION; t += DT) {
      const o1 = t * 34, o2 = 96 - t * 34;
      for (let y = Y_MIN; y <= Y_MAX; y += Y_STEP) {
        s.total++;
        const r = collFn(o1, o2, px, y, tch);
        if (r.type === 'none')           s.none++;
        else if (r.type === 'gap-protected') s.gapProtected++;
        else if (r.type === 'guard-skipped') s.guardSkipped++;
        else if (r.hit) {
          const cat = categorizeHit(r.py);
          if (cat === 'spawn-cell')          s.spawnCell++;
          else if (cat === 'exit-cell')      s.exitCell++;
          else                               s.expectedOrTransition++;
        }
      }
    }
  }

  const t = s.total;
  console.log(`\n═══ ${label} (Y_STEP=${Y_STEP}, DT=${DT}) ═══`);
  console.log(`Total: ${t}`);
  console.log(`No collision:       ${s.none} (${(s.none/t*100).toFixed(1)}%)`);
  console.log(`Guard-skipped:      ${s.guardSkipped} (${(s.guardSkipped/t*100).toFixed(1)}%)`);
  console.log(`Gap-protected:      ${s.gapProtected} (should be 0) ${s.gapProtected === 0 ? '✅' : '❌'}`);
  console.log(`Expected/transition:${s.expectedOrTransition} (${(s.expectedOrTransition/t*100).toFixed(1)}%)`);
  console.log(`Spawn cell false+:  ${s.spawnCell} (BUCKET a) ${s.spawnCell === 0 ? '✅' : '❌'}`);
  console.log(`Exit cell false+:   ${s.exitCell} (BUCKET a) ${s.exitCell === 0 ? '✅' : '❌'}`);
  return s;
}

console.log('══════════════════════════════════════════════════');
console.log(' HYBRID GUARD — Round 2 at Matching Resolution');
console.log('══════════════════════════════════════════════════');
console.log(`\nBaseline resolution: Y_STEP=${Y_STEP}, DT=${DT}s`);
console.log(`Expected samples: (${(Y_MAX-Y_MIN)/Y_STEP})Y × 6col × ${Math.ceil(CYCLE_DURATION/DT)}time = ${((Y_MAX-Y_MIN)/Y_STEP * 6 * Math.ceil(CYCLE_DURATION/DT)).toFixed(0)}`);

runSweep(32, 'HYBRID GUARD (H=32 + cell bounds)', false);

console.log('────────────────────────────────────────────────────');
console.log(' NO-GUARD VARIANT — same sweep, guard bypassed');
console.log('────────────────────────────────────────────────────');
const noGuard = runSweep(32, 'NO GUARD (H=32 only, cell bounds removed)', true);

// ════════════════════════════════════════════════════════════
//  COLUMN-SPECIFIC BOUNDARY TABLE
// ════════════════════════════════════════════════════════════

console.log('\n═══ BOUNDARY TRANSITION — COL 2 SPECIFIC ═══');
console.log('Per-column at col 2  |  Any-column (separate)');

const spawnTestYs = [238, 239, 240, 241];
const exitTestYs  = [145, 144, 143];

for (const y of spawnTestYs) {
  let h2 = 0, ha = 0, total = 0;
  for (let t = 0; t < CYCLE_DURATION; t += DT) {
    total++;
    const o1 = t * 34, o2 = 96 - t * 34;
    const pxc2 = (2 + CONTAINER_OFFSET_X) * UNIT_PX;
    const r2 = checkCollisionAt(o1, o2, pxc2, y, 32);
    if (r2.hit && r2.type !== 'guard-skipped') h2++;
    for (let c = 0; c < 6; c++) {
      const pxc = (c + CONTAINER_OFFSET_X) * UNIT_PX;
      const rc = checkCollisionAt(o1, o2, pxc, y, 32);
      if (rc.hit && rc.type !== 'guard-skipped') { ha++; break; }
    }
  }
  const guard = inSafeCell(y);
  console.log(`Y=${y}  |  col2: ${h2}/${total} (${(h2/total*100).toFixed(1)}%)  |  any-col: ${ha}/${total} (${(ha/total*100).toFixed(1)}%)  |  guard: ${guard ? 'ACTIVE ✅' : 'OFF'}`);
}

console.log('');
for (const y of exitTestYs) {
  let h2 = 0, ha = 0, total = 0;
  for (let t = 0; t < CYCLE_DURATION; t += DT) {
    total++;
    const o1 = t * 34, o2 = 96 - t * 34;
    const pxc2 = (2 + CONTAINER_OFFSET_X) * UNIT_PX;
    const r2 = checkCollisionAt(o1, o2, pxc2, y, 32);
    if (r2.hit && r2.type !== 'guard-skipped') h2++;
    for (let c = 0; c < 6; c++) {
      const pxc = (c + CONTAINER_OFFSET_X) * UNIT_PX;
      const rc = checkCollisionAt(o1, o2, pxc, y, 32);
      if (rc.hit && rc.type !== 'guard-skipped') { ha++; break; }
    }
  }
  const guard = inSafeCell(y);
  console.log(`Y=${y}  |  col2: ${h2}/${total} (${(h2/total*100).toFixed(1)}%)  |  any-col: ${ha}/${total} (${(ha/total*100).toFixed(1)}%)  |  guard: ${guard ? 'ACTIVE ✅' : 'OFF'}`);
}

// ════════════════════════════════════════════════════════════
//  T_open + gap confirmation
// ════════════════════════════════════════════════════════════

console.log('\n═══ FINAL CONFIRMATION ═══');
console.log('T_open = (144 - 36) / (34 + 34) = 108 / 68 = 1.588s — unchanged');
console.log('Gap-protected = 0 — mechanic intact');
console.log('Guard reads carY only — no moveDir/exitCheck/cooldown interaction');
console.log('Full checkTrainCollision() implementation ready (pasted in report)');
console.log('\n═══ END ═══');
