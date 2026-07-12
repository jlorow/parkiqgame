// Simulate the train rendering math from PuzzleScene.ts updateTrains()
// to compute exact colSourceX values without needing a browser.

const UNIT_PX = 48;
const TRAIN_TILE_W = 484;
const TRAIN_TILE_H = 50;
const TRAIN_TILE_SCALE = 44 / 50;       // 0.88
const TRAIN_CELL_SOURCE_W = 48 / TRAIN_TILE_SCALE; // ≈ 54.5454545454...
const TRAIN_SPLIT_THRESHOLD = TRAIN_TILE_W - TRAIN_CELL_SOURCE_W; // ≈ 429.4545...

// Train config from puzzle-data.ts
// Track 0: row 3, direction 'right', speed: 34
const SPEED = 34;  // rendered px/s
const dt = 1/60;   // ~16.7ms per frame (60fps)

console.log('=== CONSTANTS ===');
console.log('TRAIN_TILE_W:', TRAIN_TILE_W);
console.log('TRAIN_TILE_SCALE:', TRAIN_TILE_SCALE);
console.log('TRAIN_CELL_SOURCE_W:', TRAIN_CELL_SOURCE_W);
console.log('TRAIN_SPLIT_THRESHOLD:', TRAIN_SPLIT_THRESHOLD);
console.log('Rendered full-train width:', TRAIN_TILE_W * TRAIN_TILE_SCALE);
console.log('Rendered 6-col track width:', 6 * UNIT_PX);
console.log('Full cycle (source px):', TRAIN_TILE_W);
console.log('Full cycle (rendered px):', TRAIN_TILE_W * TRAIN_TILE_SCALE);
console.log('Full cycle time (s):', (TRAIN_TILE_W * TRAIN_TILE_SCALE) / SPEED);
console.log('');

// Track 0: offset starts at 0, moves right (+34 px/s)
let offset = 0;

console.log('=== FRAME-BY-FRAME LOG (track 0, columns 0-5) ===');
console.log('Frame | offset(rend) | col | offsetSrc  | colSourceX  | needSplit | gapIdx');
console.log('------+-------------+-----+------------+-------------+-----------+-------');

// Simulate the gap computation too
// Track 0: gapUnits = 3
const gapUnits = 3;

for (let frame = 0; frame < 200; frame++) {
  // Advance offset (same as updateTrains)
  offset += SPEED * dt * 1; // dir = 1 (right)

  // Gap columns
  const rawGapCol = Math.floor(offset / UNIT_PX);
  const gapStartCol = ((rawGapCol % 6) + 6) % 6;
  const isGap = new Array(6).fill(false);
  for (let g = 0; g < gapUnits; g++) {
    isGap[(gapStartCol + g) % 6] = true;
  }

  // Log frame 0-5 and every 30th frame after that for the full cycle
  const shouldLog = frame < 6 || frame % 30 === 0 || frame === 199;

  if (shouldLog) {
    for (let c = 0; c < 6; c++) {
      const colSourceX = ((offset / TRAIN_TILE_SCALE) + c * TRAIN_CELL_SOURCE_W) % TRAIN_TILE_W;
      const needSplit = colSourceX > TRAIN_SPLIT_THRESHOLD;

      console.log(
        `f=${String(frame).padEnd(3)} | ${offset.toFixed(4).padEnd(12)} | ${c}   | ` +
        `${(offset / TRAIN_TILE_SCALE).toFixed(4).padEnd(10)} | ` +
        `${colSourceX.toFixed(4).padEnd(11)} | ${needSplit ? 'SPLIT ' : 'no    '} | ${isGap[c] ? 'gap' : '---'}`
      );
    }
    if (shouldLog) console.log(''); // blank line between frames
  }
}

// Now simulate when the nose becomes visible multiple times
// The nose should be near the right edge of the SVG (approximately x > 420 area based on red path at x=483)
// Let's track how many columns show the nose region (sourceX close to 0 or close to 484)
console.log('\n=== NOSE VISIBILITY ANALYSIS ===');
console.log('Nose region definition: colSourceX < 60 (train nose area at left)');
console.log('');

offset = 0;
const noseRegion = 60; // source pixels from left edge where nose would be
const tailRegion = TRAIN_TILE_W - 60; // source pixels from right edge where tail would be

// Track per-frame how many visible (non-gap) columns show the nose
for (let frame = 0; frame < 750; frame++) {
  offset += SPEED * dt * 1;

  const rawGapCol = Math.floor(offset / UNIT_PX);
  const gapStartCol = ((rawGapCol % 6) + 6) % 6;
  const isGap = new Array(6).fill(false);
  for (let g = 0; g < gapUnits; g++) {
    isGap[(gapStartCol + g) % 6] = true;
  }

  let noseCount = 0;
  let tailCount = 0;
  for (let c = 0; c < 6; c++) {
    const colSourceX = ((offset / TRAIN_TILE_SCALE) + c * TRAIN_CELL_SOURCE_W) % TRAIN_TILE_W;
    if (!isGap[c]) {
      if (colSourceX < noseRegion) noseCount++;
      if (colSourceX > tailRegion) tailCount++;
    }
  }

  // Log when nose or tail count changes
  if (noseCount > 1 || tailCount > 1) {
    console.log(
      `f=${String(frame).padEnd(4)} offset=${offset.toFixed(2)} noseInView=${noseCount} tailInView=${tailCount}`
    );
    for (let c = 0; c < 6; c++) {
      const colSourceX = ((offset / TRAIN_TILE_SCALE) + c * TRAIN_CELL_SOURCE_W) % TRAIN_TILE_W;
      console.log(`  col ${c}: sourceX=${colSourceX.toFixed(2)} ${isGap[c] ? 'GAP' : ''}`);
    }
  }
}

// Also check: what if the issue is actually the old tile-width being referenced in the SVG load?
console.log('\n=== SVG LOAD CONSTRAINTS ===');
console.log('Loaded with { width: 484, height: 50 }');
console.log('Train.svg viewBox: "0 0 484 50"');
console.log('TRAIN_TILE_W (wrap boundary):', TRAIN_TILE_W);
console.log('');

// Check: what constant does the split function actually use?
console.log('=== SPLIT FUNCTION ANALYSIS ===');
offset = 400; // near the wrap boundary
console.log('At offset=', offset);
for (let c = 0; c < 6; c++) {
  const colSourceX = ((offset / TRAIN_TILE_SCALE) + c * TRAIN_CELL_SOURCE_W) % TRAIN_TILE_W;
  console.log(`  col ${c}: colSourceX=${colSourceX.toFixed(4)}, threshold=${TRAIN_SPLIT_THRESHOLD.toFixed(4)}, split=${colSourceX > TRAIN_SPLIT_THRESHOLD}`);
  if (colSourceX > TRAIN_SPLIT_THRESHOLD) {
    const s1W = TRAIN_TILE_W - colSourceX;
    const s2W = TRAIN_CELL_SOURCE_W - s1W;
    console.log(`    s1W=${s1W.toFixed(4)} source px, s2W=${s2W.toFixed(4)} source px`);
    console.log(`    s1 renders ${(s1W * TRAIN_TILE_SCALE).toFixed(2)}px, s2 renders ${(s2W * TRAIN_TILE_SCALE).toFixed(2)}px`);
  }
}
