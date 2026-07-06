/**
 * Simulate P9/P14 collision geometry to verify solvability.
 * Replicates PuzzleScene collision logic exactly.
 */

const UNIT_PX = 48;
const OFFSET_X = 1;
const OFFSET_Y = 2;
const CAR_W = 72;
const CAR_H = 144;
const MOVE_SPEED = 120; // px/s container-local
const ROTATION_SPEED = 90; // deg/s

function obsRect(col, row) {
  const ox = (col + OFFSET_X) * UNIT_PX;
  const oy = (row + OFFSET_Y) * UNIT_PX;
  return { x1: ox - CAR_W/2, x2: ox + CAR_W/2, y1: oy - CAR_H/2, y2: oy + CAR_H/2 };
}

function carRect(cx, cy) {
  return { x1: cx - CAR_W/2, x2: cx + CAR_W/2, y1: cy - CAR_H/2, y2: cy + CAR_H/2 };
}

function overlaps(r1, r2) {
  return r1.x1 < r2.x2 && r1.x2 > r2.x1 && r1.y1 < r2.y2 && r1.y2 > r2.y1;
}

function exitRect(col, row) {
  const ex = (col + OFFSET_X) * UNIT_PX - 48;
  const ey = (row + OFFSET_Y) * UNIT_PX - 48;
  return { x1: ex, x2: ex + 96, y1: ey, y2: ey + 96 };
}

// P9 obstacles
const p9obs = [
  obsRect(4, 4), // sedan col4r4
  obsRect(1, 1), // suv col1r1
];
const p9exit = exitRect(4, 0);
const p9spawn = { cx: (1+OFFSET_X)*UNIT_PX, cy: (5+OFFSET_Y)*UNIT_PX, angle: 0 }; // after rotating from 90°

console.log('P9 obstacles:');
p9obs.forEach((o, i) => console.log(`  obs${i}: x=${o.x1}-${o.x2}, y=${o.y1}-${o.y2}`));
console.log('P9 exit rect:', p9exit);
console.log('P9 spawn:', p9spawn);
console.log('');

// Simulate: step through a path and check for collisions
function simulate(spawn, obstacles, exit, steps) {
  let cx = spawn.cx, cy = spawn.cy, angle = spawn.angle;
  let collided = false;
  let won = false;
  const DT = 0.016; // 60fps

  for (const step of steps) {
    const frames = Math.round(step.ms / (DT * 1000));
    for (let f = 0; f < frames; f++) {
      // Apply rotation
      if (step.dir === 'left') angle -= ROTATION_SPEED * DT;
      if (step.dir === 'right') angle += ROTATION_SPEED * DT;

      // Apply movement
      let moveDir = 0;
      if (step.dir === 'forward') moveDir = 1;
      if (step.dir === 'reverse') moveDir = -1;

      if (moveDir !== 0) {
        const rad = angle * Math.PI / 180;
        const spd = MOVE_SPEED * DT * moveDir;
        const ncx = cx + Math.sin(rad) * spd;
        const ncy = cy + (-Math.cos(rad)) * spd;
        const cr = carRect(ncx, ncy);
        let hit = false;
        for (const obs of obstacles) {
          if (overlaps(cr, obs)) { hit = true; break; }
        }
        if (!hit) { cx = ncx; cy = ncy; }
        else {
          collided = true;
          // Reset to spawn on collision (per game spec)
          cx = spawn.cx; cy = spawn.cy; angle = spawn.angle;
        }
      }

      // Check exit
      const cr = carRect(cx, cy);
      if (overlaps(cr, exit)) { won = true; break; }
    }
    if (won) break;
  }
  return { cx, cy, angle, collided, won };
}

// Test P9 variants
console.log('=== P9 simulation ===');
const p9variants = [
  [{ dir: 'right', ms: 500 }, { dir: 'forward', ms: 848 }, { dir: 'left', ms: 500 }, { dir: 'right', ms: 70 }, { dir: 'forward', ms: 1820 }],
  [{ dir: 'right', ms: 1000 }, { dir: 'forward', ms: 600 }, { dir: 'left', ms: 1000 }, { dir: 'forward', ms: 2000 }],
  [{ dir: 'right', ms: 500 }, { dir: 'forward', ms: 1000 }, { dir: 'left', ms: 500 }, { dir: 'forward', ms: 2000 }],
  [{ dir: 'right', ms: 400 }, { dir: 'forward', ms: 1200 }, { dir: 'left', ms: 400 }, { dir: 'forward', ms: 2000 }],
  [{ dir: 'right', ms: 300 }, { dir: 'forward', ms: 1500 }, { dir: 'left', ms: 300 }, { dir: 'forward', ms: 2000 }],
  [{ dir: 'right', ms: 200 }, { dir: 'forward', ms: 2000 }, { dir: 'left', ms: 200 }, { dir: 'forward', ms: 1000 }],
];

for (const steps of p9variants) {
  const r = simulate(p9spawn, p9obs, p9exit, steps);
  const label = steps.map(s => `${s.dir}${s.ms}`).join('+');
  console.log(`  [${label}]: won=${r.won}, collided=${r.collided}, final=(${r.cx.toFixed(1)},${r.cy.toFixed(1)},${r.angle.toFixed(1)}°)`);
}

// Check: is there ANY path from spawn to exit that avoids both obstacles?
// Brute force: try all combinations of right-rotation (0-90°) + forward time
console.log('\nBrute force P9 search:');
let found = false;
for (let rotDeg = 10; rotDeg <= 80; rotDeg += 5) {
  const rotMs = rotDeg / 90 * 1000;
  for (let fwd1 = 200; fwd1 <= 3000; fwd1 += 200) {
    for (let fwd2 = 200; fwd2 <= 3000; fwd2 += 200) {
      const steps = [
        { dir: 'right', ms: rotMs },
        { dir: 'forward', ms: fwd1 },
        { dir: 'left', ms: rotMs },
        { dir: 'forward', ms: fwd2 },
      ];
      const r = simulate(p9spawn, p9obs, p9exit, steps);
      if (r.won && !r.collided) {
        console.log(`  FOUND: right${rotMs.toFixed(0)}+fwd${fwd1}+left${rotMs.toFixed(0)}+fwd${fwd2}`);
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) break;
}
if (!found) {
  console.log('  No simple 2-phase path found. Trying 3-phase...');
  for (let r1 = 10; r1 <= 80; r1 += 10) {
    for (let f1 = 200; f1 <= 2000; f1 += 200) {
      for (let r2 = 10; r2 <= 80; r2 += 10) {
        for (let f2 = 200; f2 <= 2000; f2 += 200) {
          const rm1 = r1/90*1000, rm2 = r2/90*1000;
          const steps = [
            { dir: 'right', ms: rm1 }, { dir: 'forward', ms: f1 },
            { dir: 'left', ms: rm1 }, { dir: 'right', ms: rm2 },
            { dir: 'forward', ms: f2 }, { dir: 'left', ms: rm2 },
          ];
          const res = simulate(p9spawn, p9obs, p9exit, steps);
          if (res.won && !res.collided) {
            console.log(`  FOUND 3-phase: r${r1}+fwd${f1}+l${r1}+r${r2}+fwd${f2}+l${r2}`);
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
    if (found) break;
  }
}
if (!found) console.log('  No path found in brute force. P9 may be blocked by collision geometry.');

// Also check: what happens if we DON'T reset on collision (just stop)?
console.log('\nP9 without reset (stop on collision):');
function simulateNoReset(spawn, obstacles, exit, steps) {
  let cx = spawn.cx, cy = spawn.cy, angle = spawn.angle;
  let won = false;
  const DT = 0.016;
  for (const step of steps) {
    const frames = Math.round(step.ms / (DT * 1000));
    for (let f = 0; f < frames; f++) {
      if (step.dir === 'left') angle -= ROTATION_SPEED * DT;
      if (step.dir === 'right') angle += ROTATION_SPEED * DT;
      let moveDir = 0;
      if (step.dir === 'forward') moveDir = 1;
      if (step.dir === 'reverse') moveDir = -1;
      if (moveDir !== 0) {
        const rad = angle * Math.PI / 180;
        const spd = MOVE_SPEED * DT * moveDir;
        const ncx = cx + Math.sin(rad) * spd;
        const ncy = cy + (-Math.cos(rad)) * spd;
        const cr = carRect(ncx, ncy);
        let hit = false;
        for (const obs of obstacles) { if (overlaps(cr, obs)) { hit = true; break; } }
        if (!hit) { cx = ncx; cy = ncy; }
      }
      if (overlaps(carRect(cx, cy), exit)) { won = true; break; }
    }
    if (won) break;
  }
  return { cx, cy, angle, won };
}

// Best path without reset
const bestNoReset = [
  { dir: 'right', ms: 500 }, { dir: 'forward', ms: 848 },
  { dir: 'left', ms: 500 }, { dir: 'forward', ms: 2000 },
];
const r9nr = simulateNoReset(p9spawn, p9obs, p9exit, bestNoReset);
console.log(`  r500+fwd848+l500+fwd2000: won=${r9nr.won}, final=(${r9nr.cx.toFixed(1)},${r9nr.cy.toFixed(1)})`);

// Check what the car's position is at each step
console.log('\nP9 step-by-step trace (right500+fwd848+left500+fwd2000):');
let cx = p9spawn.cx, cy = p9spawn.cy, angle = p9spawn.angle;
const DT = 0.016;
const traceSteps = [
  { dir: 'right', ms: 500 }, { dir: 'forward', ms: 848 },
  { dir: 'left', ms: 500 }, { dir: 'forward', ms: 2000 },
];
for (const step of traceSteps) {
  const frames = Math.round(step.ms / (DT * 1000));
  let collisions = 0;
  for (let f = 0; f < frames; f++) {
    if (step.dir === 'left') angle -= ROTATION_SPEED * DT;
    if (step.dir === 'right') angle += ROTATION_SPEED * DT;
    let moveDir = 0;
    if (step.dir === 'forward') moveDir = 1;
    if (step.dir === 'reverse') moveDir = -1;
    if (moveDir !== 0) {
      const rad = angle * Math.PI / 180;
      const spd = MOVE_SPEED * DT * moveDir;
      const ncx = cx + Math.sin(rad) * spd;
      const ncy = cy + (-Math.cos(rad)) * spd;
      const cr = carRect(ncx, ncy);
      let hit = false;
      for (const obs of p9obs) { if (overlaps(cr, obs)) { hit = true; collisions++; break; } }
      if (!hit) { cx = ncx; cy = ncy; }
      else { cx = p9spawn.cx; cy = p9spawn.cy; angle = p9spawn.angle; } // reset
    }
  }
  console.log(`  After ${step.dir} ${step.ms}ms: cx=${cx.toFixed(1)}, cy=${cy.toFixed(1)}, angle=${angle.toFixed(1)}°, collisions=${collisions}`);
}
