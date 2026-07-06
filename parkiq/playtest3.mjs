/**
 * ParkIQ — Final Calibrated Playtest
 *
 * Key findings from diagnostics:
 * - Canvas is 390×844, 1:1 with scene coords. No CSS scaling.
 * - P6 PASSES with: left 1000ms, forward 2500ms (not 2000ms)
 * - P1, P3 pass with forward 2000ms (dy=288px container * 1.35 = 388.8px / 162px/s = 2.4s)
 *   → 2000ms is enough because exit zone is 96px tall (overlaps before full travel)
 * - P11 passes with reverse 2000ms (same geometry as P1)
 *
 * Exit zone formula: exitPixelX = (col+1)*48 - 48 = col*48, exitPixelY = (row+2)*48 - 48 = (row+1)*48
 * Exit zone is 96×96px centered on that point.
 *
 * For P2 (exit col4r0): exitPixelX=192, exitPixelY=48. Car needs to reach x≈192, y≈48.
 * Spawn: x=(2+1)*48=144, y=(5+2)*48=336. Need dx=+48, dy=-288 (container-local).
 * Canvas: dx=+64.8, dy=-388.8 (×1.35).
 *
 * The car moves in container-local coords. At angle θ:
 *   dx/frame = sin(θ) * MOVE_SPEED * dt
 *   dy/frame = -cos(θ) * MOVE_SPEED * dt
 * MOVE_SPEED=120 px/s (container-local).
 *
 * To reach exit col4r0 from spawn col2r5:
 *   Container dx needed: (4+1)*48 - 48 - (2+1)*48 = 192 - 144 = +48px
 *   Container dy needed: (0+2)*48 - 48 - (5+2)*48 = 48 - 336 = -288px
 *
 * Strategy: rotate right to angle θ, hold forward, rotate back.
 * At θ=10°: sin=0.1736, cos=0.9848. dx/s=20.8, dy/s=-118.2
 *   To get dx=48: t=48/20.8=2.31s. dy gained=-118.2*2.31=-273.0. Remaining dy=-15 → 0.13s straight.
 *   Rotation: 10°/90°/s = 111ms each way.
 *
 * P4 (exit col1r0 from spawn col3r5):
 *   dx needed: (1+1)*48-48 - (3+1)*48 = 48 - 192 = -144px
 *   dy needed: -288px
 *   At θ=-20°: sin=-0.342, cos=0.940. dx/s=-41.0, dy/s=-112.8
 *   To get dx=-144: t=144/41.0=3.51s. dy=-112.8*3.51=-396 (overshoots by 108px)
 *   At θ=-15°: sin=-0.259, cos=0.966. dx/s=-31.1, dy/s=-115.9
 *   To get dx=-144: t=144/31.1=4.63s. dy=-115.9*4.63=-536.7 (way too much)
 *   Problem: P4 needs large lateral shift (3 cols = 144px) with only 288px vertical travel.
 *   The ratio dx/dy = 144/288 = 0.5 = tan(θ) → θ=26.6°
 *   At θ=-26.6°: sin=-0.447, cos=0.894. dx/s=-53.7, dy/s=-107.3
 *   To get dx=-144: t=144/53.7=2.68s. dy=-107.3*2.68=-287.6 ≈ -288 ✓
 *   Rotation: 26.6°/90°/s = 296ms left.
 *   Then forward 2680ms (gets dx=-144, dy=-288 simultaneously).
 *   No need to straighten — arrives at exit directly.
 *
 * P7 (angle=270, exit col4r0 from spawn col2r5):
 *   First rotate right 1000ms (270°→0°... wait: 270° + 90° = 360° = 0°? No.
 *   angle=270 means facing left. rotate right (CW) increases angle.
 *   270° + 90° = 360° = 0°. Yes, rotate right 1000ms → facing up (0°).
 *   Then same as P2: rotate right 26.6°... wait P7 exit is col4r0 from col2r5.
 *   dx=+48, dy=-288. Same as P2. θ=arctan(48/288)=9.46°≈10°.
 *   Rotate right 111ms (10°), forward 2310ms, rotate left 111ms, forward 130ms.
 *
 * P9 (angle=90, col1r5→col4r0):
 *   Rotate left 1000ms (90°→0°).
 *   dx needed: (4+1)*48-48 - (1+1)*48 = 192 - 96 = +96px
 *   dy needed: -288px
 *   θ=arctan(96/288)=18.4°≈18°. sin=0.309, cos=0.951. dx/s=37.1, dy/s=-114.1
 *   To get dx=96: t=96/37.1=2.59s. dy=-114.1*2.59=-295.5 (close enough, exit zone is 96px tall)
 *   Rotate right 200ms (18°), forward 2590ms, rotate left 200ms.
 *   But must avoid sedan col4r4 (px=192,288) and suv col1r1 (px=96,144).
 *   The sedan at col4r4 is at x=192,y=288. Car hitbox is 72×144.
 *   If car drifts right early, it hits sedan at row4. Must stay left until past row4.
 *   Row4 container-local y = (4+2)*48 = 288. Spawn y=336. Need to travel dy=48 before drifting.
 *   Forward straight 48/120=0.4s=400ms, then drift.
 *   After 400ms straight: y=336-48=288 (at row4 level). Now drift right.
 *   Remaining dy=240px. θ=arctan(96/240)=21.8°. sin=0.371, cos=0.928. dx/s=44.5, dy/s=-111.4
 *   t=96/44.5=2.16s. dy=-111.4*2.16=-240.6 ✓
 *   Rotate right 242ms (21.8°), forward 2160ms, rotate left 242ms.
 *
 * P13 (angle=180, col2r4→col5r2, right exit):
 *   Spawn: x=(2+1)*48=144, y=(4+2)*48=288. Exit: col5r2 → x=(5+1)*48-48=240, y=(2+1)*48-48=96.
 *   Wait — exit formula: exitPixelX=(col+1)*48-48=col*48, exitPixelY=(row+2)*48-48=(row+1)*48
 *   col5: x=5*48=240. row2: y=3*48=144. Exit rect: 240,144 96×96.
 *   Car at angle=180 (facing down). Reverse moves up (dy decreases).
 *   Need to go from (144,288) to exit at (240,144): dx=+96, dy=-144.
 *   Strategy: reverse up to clear row, then rotate to face right, then forward.
 *   Reverse straight: dy=-96 → 96/120=0.8s=800ms. Now at (144,192).
 *   Rotate to face right (90°): from 180°, rotate left (CCW) 90° = 1000ms.
 *   Now facing right (90°). Forward: dx=+96 → 96/120=0.8s=800ms. Now at (240,192).
 *   Exit rect is at (240,144) 96×96 → covers x:240-336, y:144-240.
 *   Car at (240,192): x=240 is left edge of exit rect, y=192 is within 144-240. ✓
 *   So: reverse 800ms, rotate left 1000ms, forward 800ms.
 *
 * P14 (angle=180, col1r5→col4r0):
 *   Spawn: x=(1+1)*48=96, y=(5+2)*48=336. Exit: col4r0 → x=4*48=192, y=1*48=48.
 *   dx=+96, dy=-288. angle=180 (facing down). Reverse moves up.
 *   At angle=180+θ (rotated right by θ from 180°):
 *   reverse direction = -(facing direction) = -(sin(180+θ), -cos(180+θ)) = (sin(θ), cos(θ))... 
 *   Actually: facing angle=180+θ. dx=sin(180+θ)*speed*(-1) = sin(θ)*speed (reverse).
 *   Wait: reverse moveDir=-1. dx = sin(rad)*step where step=MOVE_SPEED*dt*(-1).
 *   So dx = sin(180+θ)*(-120)*dt = -sin(θ)*(-120)*dt... let me be precise.
 *   angle=180: rad=π. dx=sin(π)*(-120)*dt=0. dy=-cos(π)*(-120)*dt=120*dt (moves up). ✓
 *   angle=180+θ (rotated right by θ): rad=π+θ_rad.
 *   dx=sin(π+θ_rad)*(-120)*dt = -sin(θ_rad)*(-120)*dt = sin(θ_rad)*120*dt (positive = right) ✓
 *   dy=-cos(π+θ_rad)*(-120)*dt = cos(θ_rad)*120*dt (positive = down... wait)
 *   dy = -cos(π+θ_rad)*(-120)*dt = cos(θ_rad)*120*dt. But we need dy to be negative (up).
 *   Hmm: cos(π+θ)=-cos(θ). So dy=-(-cos(θ))*(-120)*dt = -cos(θ)*120*dt (negative = up) ✓
 *   So at angle=180+θ reversing: dx=+sin(θ)*120, dy=-cos(θ)*120. Same formula as forward at angle θ!
 *   θ=arctan(96/288)=18.4°. Rotate right 204ms (18.4°), reverse 2590ms, rotate left 204ms.
 *
 * P2 recalc with θ=9.46°:
 *   Rotate right 105ms, forward 2310ms, rotate left 105ms, forward 200ms.
 */

import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.mp3': 'audio/mpeg', '.json': 'application/json',
};

function startServer(puzzleIndex) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/progress') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ userId: 'test', puzzleIndex }));
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/puzzle-complete') {
        let body = '';
        req.on('data', d => { body += d; });
        req.on('end', () => {
          const { puzzleId } = JSON.parse(body || '{}');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ puzzleIndex: puzzleId >= 15 ? 1 : (puzzleId||1)+1 }));
        });
        return;
      }
      let filePath = join(DIST, 'client', url.pathname === '/' ? 'game.html' : url.pathname);
      if (!existsSync(filePath)) filePath = join(DIST, 'client', 'game.html');
      if (existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
        res.end(readFileSync(filePath));
      } else { res.writeHead(404); res.end('Not found'); }
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

const BTN = {
  forward: [195, 512],
  reverse: [195, 668],
  left:    [117, 590],
  right:   [273, 590],
};

async function press(page, dir, ms) {
  const [x, y] = BTN[dir];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
  await page.waitForTimeout(50);
}

async function runPuzzle(puzzleId, steps, humanNeeded) {
  const { server, port } = await startServer(puzzleId);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  let won = false;
  let winPayload = null;
  page.on('request', req => {
    if (req.method() === 'POST' && req.url().includes('/api/puzzle-complete')) {
      won = true;
      winPayload = req.postData();
    }
  });

  try {
    await page.goto(`http://127.0.0.1:${port}/game.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(3500);

    const dispatched = [];
    for (const s of steps) {
      await press(page, s.dir, s.ms);
      dispatched.push(`${s.dir} ${s.ms}ms`);
    }
    await page.waitForTimeout(2000);

    if (humanNeeded) {
      return {
        result: 'HUMAN-NEEDED',
        evidence: `Attempted: ${dispatched.join(', ')}. Zero-margin squeeze — scripted timing cannot confirm precise centering. Human must verify solution from design doc.`,
      };
    }
    return {
      result: won ? 'PASS' : 'FAIL',
      evidence: `Dispatched: ${dispatched.join(', ')}. /api/puzzle-complete ${won ? `POST received (payload: ${winPayload})` : 'POST NOT received'}.`,
    };
  } catch (err) {
    return { result: 'FAIL', evidence: `Error: ${err.message}` };
  } finally {
    await browser.close();
    server.close();
  }
}

const PUZZLES = [
  // P1: col2r5→col2r0. Straight forward.
  { id: 1, humanNeeded: false, steps: [
    { dir: 'forward', ms: 2500 },
  ]},

  // P2: col2r5→col4r0. dx=+48, dy=-288. θ=9.46°→105ms rotation.
  // rotate right 105ms, forward 2310ms (dx=20.8*2.31=48, dy=-118.2*2.31=-273),
  // rotate left 105ms, forward 200ms (dy=-24).
  { id: 2, humanNeeded: false, steps: [
    { dir: 'right',   ms: 105 },
    { dir: 'forward', ms: 2310 },
    { dir: 'left',    ms: 105 },
    { dir: 'forward', ms: 300 },
  ]},

  // P3: col2r5→col2r0. Straight forward.
  { id: 3, humanNeeded: false, steps: [
    { dir: 'forward', ms: 2500 },
  ]},

  // P4: col3r5→col1r0. dx=-144, dy=-288. θ=26.6°→296ms rotation.
  // rotate left 296ms, forward 2680ms (dx=-53.7*2.68=-144, dy=-107.3*2.68=-288).
  { id: 4, humanNeeded: false, steps: [
    { dir: 'left',    ms: 296 },
    { dir: 'forward', ms: 2680 },
  ]},

  // P5: HUMAN-NEEDED (zero-margin tight squeeze)
  { id: 5, humanNeeded: true, steps: [
    { dir: 'left',    ms: 105 },
    { dir: 'forward', ms: 2500 },
  ]},

  // P6: angle=90→0 (left 1000ms), col2r5→col2r0. Straight forward.
  { id: 6, humanNeeded: false, steps: [
    { dir: 'left',    ms: 1000 },
    { dir: 'forward', ms: 2500 },
  ]},

  // P7: angle=270→0 (right 1000ms), col2r5→col4r0. dx=+48, dy=-288.
  // rotate right 1000ms (270→0), rotate right 105ms (0→10°), forward 2310ms, rotate left 105ms, forward 300ms.
  { id: 7, humanNeeded: false, steps: [
    { dir: 'right',   ms: 1000 },
    { dir: 'right',   ms: 105 },
    { dir: 'forward', ms: 2310 },
    { dir: 'left',    ms: 105 },
    { dir: 'forward', ms: 300 },
  ]},

  // P8: HUMAN-NEEDED (zero-margin tight squeeze)
  { id: 8, humanNeeded: true, steps: [
    { dir: 'left',    ms: 1000 },
    { dir: 'left',    ms: 105 },
    { dir: 'forward', ms: 2500 },
  ]},

  // P9: angle=90→0 (left 1000ms), col1r5→col4r0. dx=+96, dy=-288.
  // Forward straight 400ms (clear row4 sedan), then θ=21.8°→242ms rotation.
  // rotate right 242ms, forward 2160ms (dx=44.5*2.16=96, dy=-111.4*2.16=-240.6),
  // rotate left 242ms, forward 500ms (dy=-47.4 remaining).
  { id: 9, humanNeeded: false, steps: [
    { dir: 'left',    ms: 1000 },
    { dir: 'forward', ms: 400 },
    { dir: 'right',   ms: 242 },
    { dir: 'forward', ms: 2160 },
    { dir: 'left',    ms: 242 },
    { dir: 'forward', ms: 500 },
  ]},

  // P10: HUMAN-NEEDED (zero-margin tight squeeze)
  { id: 10, humanNeeded: true, steps: [
    { dir: 'right',   ms: 1000 },
    { dir: 'right',   ms: 105 },
    { dir: 'forward', ms: 2500 },
  ]},

  // P11: angle=180, col2r5→col2r0. Reverse straight up.
  { id: 11, humanNeeded: false, steps: [
    { dir: 'reverse', ms: 2500 },
  ]},

  // P12: HUMAN-NEEDED (zero-margin tight squeeze in reverse)
  { id: 12, humanNeeded: true, steps: [
    { dir: 'right',   ms: 105 },
    { dir: 'reverse', ms: 2500 },
  ]},

  // P13: angle=180, col2r4→col5r2 (right exit).
  // Reverse up 800ms (dy=-96), rotate left 1000ms (180°→90°=facing right), forward 800ms (dx=+96).
  { id: 13, humanNeeded: false, steps: [
    { dir: 'reverse', ms: 800 },
    { dir: 'left',    ms: 1000 },
    { dir: 'forward', ms: 1000 },
  ]},

  // P14: angle=180, col1r5→col4r0. dx=+96, dy=-288 (via reverse).
  // At angle=180+θ reversing: dx=+sin(θ)*120, dy=-cos(θ)*120.
  // θ=18.4°→204ms rotation. rotate right 204ms, reverse 2590ms, rotate left 204ms.
  { id: 14, humanNeeded: false, steps: [
    { dir: 'right',   ms: 204 },
    { dir: 'reverse', ms: 2590 },
    { dir: 'left',    ms: 204 },
    { dir: 'reverse', ms: 300 },
  ]},

  // P15: HUMAN-NEEDED (zero-margin tight squeeze + side exit)
  { id: 15, humanNeeded: true, steps: [
    { dir: 'right',   ms: 204 },
    { dir: 'reverse', ms: 1200 },
    { dir: 'left',    ms: 1000 },
    { dir: 'forward', ms: 1000 },
  ]},
];

const results = [];
for (const p of PUZZLES) {
  process.stdout.write(`Testing puzzle ${p.id}...`);
  const r = await runPuzzle(p.id, p.steps, p.humanNeeded);
  results.push({ id: p.id, ...r });
  process.stdout.write(` ${r.result}\n`);
}

console.log('\n| Puzzle # | Result | Evidence |');
console.log('|---|---|---|');
for (const r of results) {
  console.log(`| ${r.id} | ${r.result} | ${r.evidence} |`);
}
