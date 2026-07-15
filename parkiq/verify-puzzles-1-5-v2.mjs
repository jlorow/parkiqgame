// ═══════════════════════════════════════════════════════════════════════════════
//  verify-puzzles-1-5-v2.mjs  —  Verify puzzle 1 (parallel, fixed spawn),
//  puzzle 5 (NEW perpendicular, center-right exit), and puzzle 2 (angled, regression).
//
//  Uses real getRotatedBox() sizes, per-frame movement at 60/30/20 fps,
//  and the tight center-proximity exit check (±8px).
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
//  Collision & Movement Constants  (mirrors PuzzleScene.ts)
// ─────────────────────────────────────────────────────────────────────────────

const MOVE_SPEED = 120;
const ROTATION_SPEED = 90;
const UNIT_PX = 48;
const CONTAINER_OFFSET_X = 0.5;
const CONTAINER_OFFSET_Y = 0.5;

const SEDAN_BOX = {
  0:  { w: 45, h: 69 },
  15: { w: 58, h: 73 },
  30: { w: 68, h: 74 },
  45: { w: 73, h: 73 },
  60: { w: 74, h: 68 },
  75: { w: 73, h: 58 },
  90: { w: 69, h: 45 },
};

const LARGE_BOX = {
  0:  { w: 49, h: 100 },
  45: { w: 99, h: 99 },
  90: { w: 100, h: 49 },
};

const CAR_W = 36;
const CAR_H = 64;

const POS_TOLERANCE = 8;

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

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
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function simulateStep(cx, cy, carAngle, inputDir, obstacles, vehicleType, dt) {
  // 1. Rotation
  if (inputDir === 'left') carAngle -= ROTATION_SPEED * dt;
  if (inputDir === 'right') carAngle += ROTATION_SPEED * dt;

  // 2. Determine forward/reverse
  let moveDir = 0;
  if (inputDir === 'forward') moveDir = 1;
  else if (inputDir === 'reverse') moveDir = -1;

  const rad = carAngle * Math.PI / 180;
  let ncx = cx;
  let ncy = cy;
  if (moveDir !== 0) {
    const step = MOVE_SPEED * dt * moveDir;
    ncx = cx + Math.sin(rad) * step;
    ncy = cy + (-Math.cos(rad)) * step;
  }

  // 3. Collision check — ALWAYS checked, even on rotation-only steps
  const col = checkCollision(ncx, ncy, carAngle, obstacles, vehicleType);
  if (col.collided) {
    return { cx, cy, carAngle, collided: true };
  }

  cx = ncx;
  cy = ncy;
  return { cx, cy, carAngle, collided: false };
}

function checkCollision(cx, cy, carAngle, obstacles, vehicleType) {
  const playerTable = getVehicleTable(vehicleType);
  const playerBox = getRotatedBox(playerTable, carAngle);
  const playerRect = {
    x: cx - playerBox.w / 2,
    y: cy - playerBox.h / 2,
    w: playerBox.w,
    h: playerBox.h,
  };

  for (const obs of obstacles) {
    if (obs.type === 'pillar') continue;

    const ox = obs.x ?? ((obs.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX;
    const oy = obs.y ?? ((obs.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX;

    const obsTable = getVehicleTable(obs.type);
    const obsBox = getRotatedBox(obsTable, obs.angle);
    const obsRect = {
      x: ox - obsBox.w / 2,
      y: oy - obsBox.h / 2,
      w: obsBox.w,
      h: obsBox.h,
    };

    if (rectsOverlap(playerRect, obsRect)) {
      return { collided: true, obs, overlap: { player: playerRect, obstacle: obsRect } };
    }
  }

  return { collided: false };
}

function checkExitReached(cx, cy, carAngle, exitZone, vehicleType) {
  const bayX = exitZone.x ?? ((exitZone.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX;
  const bayY = exitZone.y ?? ((exitZone.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX;
  const bayAngle = exitZone.angle ?? 0;

  // Center proximity
  if (Math.abs(cx - bayX) > POS_TOLERANCE) return false;
  if (Math.abs(cy - bayY) > POS_TOLERANCE) return false;

  // Angle tolerance
  const tolerance = exitZone.parkingType === 'angled' ? 15 : 10;
  let diff = Math.abs(carAngle - bayAngle);
  if (diff > 180) diff = 360 - diff;
  if (diff > tolerance) return false;

  return true;
}

function computeExitRect(exitZone, vehicleType) {
  const bayX = exitZone.x ?? ((exitZone.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX;
  const bayY = exitZone.y ?? ((exitZone.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX;
  if (!exitZone.parkingType) return { x: bayX - 48, y: bayY - 48, w: 96, h: 96 };

  if (exitZone.parkingType === 'angled') {
    return { x: bayX - 20, y: bayY - 35, w: 40, h: 70 };
  }

  const tbl = getVehicleTable(vehicleType);
  const box = getRotatedBox(tbl, exitZone.angle ?? 0);
  return { x: bayX - box.w / 2, y: bayY - box.h / 2, w: box.w, h: box.h };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Puzzle Data
// ─────────────────────────────────────────────────────────────────────────────

const PUZZLES = [
  // Puzzle 1 — parallel, spawn at (144, 244, 45°), SUV moved to x:68 (was 78 — fixed spawn collision)
  {
    id: 1,
    vehicleType: 'sedan',
    spawn: { x: 144, y: 244, angle: 45 },
    obstacles: [
      { type: 'sedan', x: 232, y: 213, angle: 45 },
      { type: 'sedan', x: 216, y: 139, angle: 45 },
      { type: 'suv',   x: 68,  y: 214, angle: 45 },
      { type: 'suv',   x: 71,  y: 132, angle: 45 },
      { type: 'sedan', x: 70,  y: 67,  angle: 45 },
      { type: 'sedan', x: 218, y: 73,  angle: 45 },
    ],
    exitZone: { x: 143, y: 92, angle: 0, parkingType: 'parallel' },
  },
  // Puzzle 5 — NEW perpendicular, center-right exit at (216, 48, 0°)
  // Approach at 40° keeps player BELOW SUV y-range (37.5-106.5) throughout drift.
  // At final approach (0°), corridor = sedan@144 right edge (166.5) to SUV@264 left edge (241.5).
  {
    id: 5,
    vehicleType: 'sedan',
    spawn: { x: 120, y: 264, angle: 0 },
    obstacles: [
      { type: 'sedan', x: 72,  y: 168, angle: 0 },   // col 1 row 3
      { type: 'sedan', x: 120, y: 120, angle: 0 },   // col 2 row 2
      { type: 'sedan', x: 144, y: 72,  angle: 0 },   // col 2.5 row 1
      { type: 'suv',   x: 264, y: 72,  angle: 0 },   // col 5 row 1
    ],
    exitZone: { x: 216, y: 48, angle: 0, parkingType: 'perpendicular' },
  },
  // Puzzle 2 — angled, regression check (unchanged layout)
  {
    id: 2,
    vehicleType: 'sedan',
    spawn: { x: 144, y: 244, angle: 0 },
    obstacles: [
      { type: 'sedan', x: 55,  y: 205, angle: 0 },
      { type: 'suv',   x: 205, y: 170, angle: 0 },
      { type: 'sedan', x: 37,  y: 82,  angle: 45 },
      { type: 'suv',   x: 225, y: 82,  angle: 45 },
    ],
    exitZone: { x: 119, y: 90, angle: 45, parkingType: 'angled' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Path candidates for each puzzle
// ─────────────────────────────────────────────────────────────────────────────

const PATH_CANDIDATES = {
  1: [
    // Puzzle 1: from spawn (144, 244, 45°) to parallel exit (143, 92, 0°)
    // At 45° forward goes up-right — must steer left to 0° then drive straight up.
    // Physics: L500 (rotate 45°→0° at 90°/s), then F1267 (go straight up 152px at 120px/s)
    { label: 'rotate-then-up',   path: 'L500+F1267', description: 'Steer left to 0°, drive straight up to exit' },
    { label: 'rotate-short-up',  path: 'L400+F1300', description: 'Near 0°, coast up with slight angle margin' },
    { label: 'rotate-then-short',path: 'L600+F1200', description: 'Overshoot left, then straight up' },
    { label: 'forward-then-rotate',path: 'F200+L400+F1000', description: 'Brief forward at 45°, rotate, forward' },
  ],
  5: [
    // Puzzle 5: from (120, 264, 0°) to perpendicular exit (216, 48, 0°)
    // 40° approach: at 40.5° (R444 snaps to 45° bucket, AABB 73×73).
    // Player stays BELOW both row-1 obstacles (y<106.5+36.5=143) throughout drift.
    // Verified: traces to final position~ (210, 49, 0°) within exit tolerance.
    { label: 'drift-40',      path: 'R444+F1167+L444+F907', description: '✅ 40° verified WIN — see debug-p5.mjs' },
    { label: 'drift-40-short',path: 'R444+F1000+L444+F1100', description: '40° shorter drift -> cx≈198 (exit cx≥208)' },
    { label: 'drift-45',      path: 'R500+F900+L500+F1100', description: '45° steeper drift -> cx≈196 (exit cx≥208)' },
    { label: 'drift-35',      path: 'R389+F1100+L389+F1000', description: '35° drift -> collides @ sedan 120,120' },
    { label: 'drift-27',      path: 'R300+F1615+L300+F362', description: '27° drift -> collides @ sedan 120,120 (too slow)' },
  ],
  2: [
    // Puzzle 2: angled exit at (119, 90, 45°) — regression check
    // Spawn at (144, 244, 0°). Exit requires cx=119±8, cy=90±8, angle 45°±15°.
    // The exit angle 45° is up-right — need to reach x=119 (left of spawn x=144).
    // Go straight up at 0° (no lateral drift), then steer right to face 45° at end.
    { label: 'up-then-right', path: 'F1000+R500+F200', description: 'Go straight up, then steer right to 45°, coast' },
    { label: 'short-up-right',path: 'F800+R600+F300', description: 'Shorter up, then steer to 45°, coast' },
    { label: 'straight-right', path: 'R500+F1200', description: 'Steer right first, then drive at 45°' },
    { label: 'left-drift',     path: 'L200+F1500', description: 'Light left steer to reduce x' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  Simulation
// ─────────────────────────────────────────────────────────────────────────────

function runSequence(puzzle, sequence, fps) {
  const dt = 1 / fps;
  let cx = puzzle.spawn.x;
  let cy = puzzle.spawn.y;
  let carAngle = puzzle.spawn.angle;
  let totalCollisions = 0;
  let reachedExit = false;
  let finalStep = 0;

  const steps = parsePath(sequence);

  for (let s = 0; s < steps.length; s++) {
    const step = steps[s];
    const durationMs = step.duration;
    const frames = Math.round(durationMs * fps / 1000);
    const dir = step.dir;

    for (let f = 0; f < frames; f++) {
      const result = simulateStep(cx, cy, carAngle, dir, puzzle.obstacles, puzzle.vehicleType, dt);
      cx = result.cx;
      cy = result.cy;
      carAngle = result.carAngle;
      if (result.collided) {
        totalCollisions++;
        cx = puzzle.spawn.x;
        cy = puzzle.spawn.y;
        carAngle = puzzle.spawn.angle;
        break;  // reset break inner loop, continue to next phase
      }
    }

    // Check exit after each phase
    if (checkExitReached(cx, cy, carAngle, puzzle.exitZone, puzzle.vehicleType)) {
      reachedExit = true;
      finalStep = s + 1;
      break;
    }
  }

  // Final exit check one more time after all phases
  if (!reachedExit) {
    reachedExit = checkExitReached(cx, cy, carAngle, puzzle.exitZone, puzzle.vehicleType);
  }

  return { cx, cy, carAngle, totalCollisions, reachedExit, finalStep };
}

function parsePath(pathStr) {
  const steps = [];
  const re = /([LRF])(\d+)/g;
  let match;
  while ((match = re.exec(pathStr)) !== null) {
    let dir;
    if (match[1] === 'L') dir = 'left';
    else if (match[1] === 'R') dir = 'right';
    else if (match[1] === 'F') dir = 'forward';
    else if (match[1] === 'B') dir = 'reverse';
    else continue;
    steps.push({ dir, duration: parseInt(match[2], 10) });
  }
  return steps;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Static geometry analysis
// ─────────────────────────────────────────────────────────────────────────────

function analyzeSpawnClearance(puzzle) {
  const { spawn, obstacles, vehicleType } = puzzle;
  const tbl = getVehicleTable(vehicleType);
  const box = getRotatedBox(tbl, spawn.angle);
  const playerRect = {
    x: spawn.x - box.w / 2,
    y: spawn.y - box.h / 2,
    w: box.w,
    h: box.h,
  };

  const issues = [];
  for (const obs of obstacles) {
    if (obs.type === 'pillar') continue;
    const ox = obs.x ?? ((obs.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX;
    const oy = obs.y ?? ((obs.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX;
    const obsTbl = getVehicleTable(obs.type);
    const obsBox = getRotatedBox(obsTbl, obs.angle);
    const obsRect = {
      x: ox - obsBox.w / 2,
      y: oy - obsBox.h / 2,
      w: obsBox.w,
      h: obsBox.h,
    };

    if (rectsOverlap(playerRect, obsRect)) {
      const overlapX = Math.min(playerRect.x + playerRect.w, obsRect.x + obsRect.w) -
                       Math.max(playerRect.x, obsRect.x);
      const overlapY = Math.min(playerRect.y + playerRect.h, obsRect.y + obsRect.h) -
                       Math.max(playerRect.y, obsRect.y);
      issues.push({
        obstacle: obs,
        overlapPx: { x: overlapX.toFixed(1), y: overlapY.toFixed(1) },
        playerRect,
        obsRect,
      });
    }
  }
  return issues;
}

function analyzeExitCorridor(puzzle) {
  const { exitZone, obstacles, vehicleType } = puzzle;
  const bayX = exitZone.x ?? ((exitZone.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX;
  const bayY = exitZone.y ?? ((exitZone.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX;

  // Tolerance zone
  const tolZone = {
    x: bayX - POS_TOLERANCE,
    y: bayY - POS_TOLERANCE,
    w: POS_TOLERANCE * 2,
    h: POS_TOLERANCE * 2,
  };

  // Player at exit (at perfect alignment)
  const tbl = getVehicleTable(vehicleType);
  const pBox = getRotatedBox(tbl, exitZone.angle ?? 0);
  const playerAtExit = {
    x: bayX - pBox.w / 2,
    y: bayY - pBox.h / 2,
    w: pBox.w,
    h: pBox.h,
  };

  const issues = [];
  for (const obs of obstacles) {
    if (obs.type === 'pillar') continue;
    const ox = obs.x ?? ((obs.col ?? 0) + CONTAINER_OFFSET_X) * UNIT_PX;
    const oy = obs.y ?? ((obs.row ?? 0) + CONTAINER_OFFSET_Y) * UNIT_PX;
    const obsTbl = getVehicleTable(obs.type);
    const obsBox = getRotatedBox(obsTbl, obs.angle);
    const obsRect = {
      x: ox - obsBox.w / 2,
      y: oy - obsBox.h / 2,
      w: obsBox.w,
      h: obsBox.h,
    };

    if (rectsOverlap(playerAtExit, obsRect)) {
      issues.push({ obstacle: obs, obsRect });
    }
  }
  return { toleranceZone: tolZone, playerAtExit, exitOverlapIssues: issues };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────────────────────────────────────

const FPS_VALUES = [20, 30, 60];

function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Puzzle 1 / 5 / 2 — Solvability Verification (v2)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const puzzle of PUZZLES) {
    console.log(`─── Puzzle ${puzzle.id} ──────────────────────────────────────`);
    console.log(`  Vehicle: ${puzzle.vehicleType}`);
    console.log(`  Spawn: (${puzzle.spawn.x}, ${puzzle.spawn.y}, ${puzzle.spawn.angle}°)`);
    console.log(`  Exit: parkingType=${puzzle.exitZone.parkingType} at (${puzzle.exitZone.x}, ${puzzle.exitZone.y}, ${puzzle.exitZone.angle ?? 0}°)`);
    console.log(`  Obstacles: ${puzzle.obstacles.length}`);

    // ── 1. Static analysis: spawn clearance ──
    console.log(`\n  ── Static: Spawn clearance ──`);
    const spawnIssues = analyzeSpawnClearance(puzzle);
    if (spawnIssues.length === 0) {
      console.log(`  ✅ Spawn is clear — no overlap with any obstacle`);
    } else {
      console.log(`  ❌ SPAWN COLLISION:`);
      for (const issue of spawnIssues) {
        console.log(`     ${issue.obstacle.type} at (${issue.obstacle.x ?? issue.obstacle.col},${issue.obstacle.y ?? issue.obstacle.row}) — overlap ${issue.overlapPx.x}px X × ${issue.overlapPx.y}px Y`);
      }
      console.log(`     Player AABB at spawn: ${JSON.stringify(spawnIssues[0].playerRect)}`);
      console.log(`     (See first collision)`);
    }

    // ── 2. Static analysis: exit corridor ──
    console.log(`\n  ── Static: Exit corridor ──`);
    const exitCorridor = analyzeExitCorridor(puzzle);
    if (exitCorridor.exitOverlapIssues.length === 0) {
      console.log(`  ✅ Exit area is clear — no obstacle overlaps player at exit`);
    } else {
      console.log(`  ❌ EXIT OVERLAP:`);
      for (const issue of exitCorridor.exitOverlapIssues) {
        console.log(`     ${issue.obstacle.type} at (${issue.obstacle.x ?? issue.obstacle.col},${issue.obstacle.y ?? issue.obstacle.row}) overlaps player at exit`);
      }
    }

    // ── 3. Candidate path testing ──
    const paths = PATH_CANDIDATES[puzzle.id] ?? [];
    console.log(`\n  ── Dynamic: Candidate paths ──`);
    let anyWin = false;
    for (const cand of paths) {
      console.log(`\n  Path: ${cand.label}  (${cand.path})`);
      console.log(`  ${cand.description}`);
      for (const fps of FPS_VALUES) {
        const result = runSequence(puzzle, cand.path, fps);
        const status = result.reachedExit ? '🏆 WIN' : result.totalCollisions > 0 ? '💥 COLLISIONS' : '—';
        const posStr = `(${result.cx.toFixed(1)}, ${result.cy.toFixed(1)}, ${result.carAngle.toFixed(1)}°)`;
        console.log(`    ${fps}fps: ${status}  collisions=${result.totalCollisions}  final=${posStr}`);
        if (result.reachedExit) anyWin = true;
      }
    }

    if (!anyWin) {
      console.log(`\n  ⚠️  No winning path found among candidates.`);
    } else {
      console.log(`\n  ✅ At least one winning path found.`);
    }

    console.log(``);
  }

  // ── Summary ──
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  for (const puzzle of PUZZLES) {
    const paths = PATH_CANDIDATES[puzzle.id] ?? [];
    let win = false;
    for (const cand of paths) {
      for (const fps of FPS_VALUES) {
        const result = runSequence(puzzle, cand.path, fps);
        if (result.reachedExit) {
          win = true;
          console.log(`  Puzzle ${puzzle.id}: ✅ WIN  path="${cand.path}" @ ${fps}fps  → (${result.cx.toFixed(1)}, ${result.cy.toFixed(1)}, ${result.carAngle.toFixed(1)}°)`);
          break;
        }
      }
      if (win) break;
    }
    if (!win) {
      console.log(`  Puzzle ${puzzle.id}: ❌ NO WIN PATH among candidates`);
    }
  }
  console.log(``);
}

main();
