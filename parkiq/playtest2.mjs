/**
 * ParkIQ — Revised Puzzle Playtest
 *
 * Physics recap (from knowledge.md + PuzzleScene.ts):
 *   MOVE_SPEED = 120 px/s (container-local, before CONTAINER_SCALE=1.35)
 *   ROTATION_SPEED = 90 deg/s
 *   Canvas = 390×844, no CSS scaling (confirmed by diagnostic)
 *   Container scale = 1.35 — but movement is in container-local coords,
 *   so actual canvas px/s = 120 * 1.35 = 162 px/s
 *
 *   To drift laterally: rotate to an angle, move forward, rotate back.
 *   dx per second at angle θ = sin(θ) * 162
 *   dy per second at angle θ = -cos(θ) * 162
 *
 * Grid → container-local pixel:
 *   px = (col + 1) * 48
 *   py = (row + 2) * 48
 *
 * Spawn and exit positions (container-local):
 *   P1:  spawn (144,336) exit (96,48)   → straight up, dy=288 → 288/162=1.78s
 *   P2:  spawn (144,336) exit (192,48)  → need dx=+48, dy=288
 *        Strategy: rotate ~15° right (166ms), hold forward while drifting right,
 *        then straighten. At 15°: dx/s=sin(15°)*162=41.9, dy/s=cos(15°)*162=156.5
 *        To get dx=48: t=48/41.9=1.15s forward at 15°, dy gained=156.5*1.15=180
 *        Remaining dy=288-180=108 → straighten (0°) and forward 108/162=0.67s
 *        Total: rotate_right 166ms, forward 1150ms, rotate_left 166ms, forward 700ms
 *   P3:  spawn (144,336) exit (96,48)   → straight up (same as P1)
 *   P4:  spawn (192,336) exit (48,48)   → need dx=-144, dy=288
 *        At -20°: dx/s=sin(-20°)*162=-55.4, dy/s=cos(20°)*162=152.3
 *        To get dx=-144: t=144/55.4=2.6s, dy=152.3*2.6=396 (too much, overshoots)
 *        Use -30°: dx/s=-81, dy/s=140.3. t=144/81=1.78s, dy=140.3*1.78=249.7
 *        Remaining dy=288-249.7=38.3 → forward 38.3/162=0.24s
 *        Total: rotate_left 333ms (30°), forward 1800ms, rotate_right 333ms, forward 250ms
 *   P9:  spawn col1r5=(96,336), exit col4r0=(192,48)
 *        Need dx=+96, dy=288. Use 20° right: dx/s=55.4, dy/s=152.3
 *        t=96/55.4=1.73s, dy=152.3*1.73=263.6. Remaining dy=24.4 → 150ms forward
 *        But must avoid sedan at col4r4=(192,288) and suv at col1r1=(96,144)
 *        Stay left (col1) until past row4 obstacle, then shift right
 *        Phase1: forward straight to row2 (dy=192px → 1185ms)
 *        Phase2: rotate right 20° (222ms), forward to clear col4r4 obstacle
 *        Phase3: straighten, forward to exit
 *   P13: spawn col2r4=(144,288), exit col5r2=(288,192)
 *        angle=180 (facing down), reverse moves up
 *        Reverse up: dy=-96 (row4→row2) → 96/162=0.59s
 *        Then rotate to face right (90°): from 180° need +270° or -90°
 *        Rotate left (CCW) 90°: 1000ms
 *        Then forward right to col5: dx=+144 → 144/162=0.89s
 *   P14: spawn col1r5=(96,336), exit col4r0=(192,48)
 *        angle=180, reverse moves up
 *        Same double-shift as P9 but in reverse
 *        Reverse straight to row3 (dy=144 → 889ms)
 *        Rotate right 20° (222ms), reverse (moves up+right)
 *        Straighten, reverse to exit
 *
 * For Tier 2 (angles 90/270): must rotate to 0° first
 *   From 90° (facing right): rotate left 90° = 1000ms
 *   From 270° (facing left): rotate right 90° = 1000ms
 *   Then apply same lateral drift logic as Tier 1
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

// Button scene coords (confirmed 1:1 with canvas DOM coords)
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
  await page.waitForTimeout(30);
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
    await page.waitForTimeout(3500); // wait for Phaser + async puzzle load

    const dispatched = [];
    for (const s of steps) {
      await press(page, s.dir, s.ms);
      dispatched.push(`${s.dir} ${s.ms}ms`);
    }

    await page.waitForTimeout(2000);

    if (humanNeeded) {
      return {
        result: 'HUMAN-NEEDED',
        evidence: `Attempted: ${dispatched.join(', ')}. Zero-margin squeeze — scripted timing cannot confirm precise centering. Human must verify: ${steps.map(s=>s.note||'').filter(Boolean).join('; ')}`,
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

// ── Solution sequences ───────────────────────────────────────────────────────
// All timings in ms. Physics: 162 canvas-px/s forward, 90 deg/s rotation.
// Lateral drift: rotate θ°, hold forward, rotate back.
// sin(15°)=0.259, cos(15°)=0.966 → dx=41.9/s, dy=156.5/s at 15°
// sin(20°)=0.342, cos(20°)=0.940 → dx=55.4/s, dy=152.3/s at 20°
// sin(30°)=0.500, cos(30°)=0.866 → dx=81.0/s, dy=140.3/s at 30°

const PUZZLES = [
  // ── TIER 1 ──────────────────────────────────────────────────────────────
  // P1: col2r5→col2r0. Straight forward. dy=288px/162=1.78s
  { id: 1, humanNeeded: false, steps: [
    { dir: 'forward', ms: 2000 },
  ]},

  // P2: col2r5→col4r0. Need dx=+96px right, dy=288px up.
  // Rotate right 20° (222ms), forward 1730ms (dx=55.4*1.73=95.8≈96, dy=152.3*1.73=263.6),
  // rotate left 20° (222ms), forward 150ms (dy=24.4).
  { id: 2, humanNeeded: false, steps: [
    { dir: 'right',   ms: 222 },
    { dir: 'forward', ms: 1730 },
    { dir: 'left',    ms: 222 },
    { dir: 'forward', ms: 300 },
  ]},

  // P3: col2r5→col2r0. Straight forward (same as P1).
  { id: 3, humanNeeded: false, steps: [
    { dir: 'forward', ms: 2000 },
  ]},

  // P4: col3r5→col1r0. Need dx=-96px left, dy=288px up.
  // Rotate left 20° (222ms), forward 1730ms, rotate right 20° (222ms), forward 300ms.
  { id: 4, humanNeeded: false, steps: [
    { dir: 'left',    ms: 222 },
    { dir: 'forward', ms: 1730 },
    { dir: 'right',   ms: 222 },
    { dir: 'forward', ms: 300 },
  ]},

  // P5: col2r5→col1r0. Tight squeeze. HUMAN-NEEDED.
  { id: 5, humanNeeded: true, steps: [
    { dir: 'left',    ms: 111, note: 'slight left drift to col1' },
    { dir: 'forward', ms: 2000, note: 'thread gap between col0 and col3 obstacles at row2' },
  ]},

  // ── TIER 2 ──────────────────────────────────────────────────────────────
  // P6: angle=90, col2r5→col2r0. Rotate left 90° (1000ms) to face up, then forward.
  { id: 6, humanNeeded: false, steps: [
    { dir: 'left',    ms: 1000 },
    { dir: 'forward', ms: 2000 },
  ]},

  // P7: angle=270, col2r5→col4r0. Rotate right 90° (1000ms) to face up,
  // then drift right 96px: rotate right 20° (222ms), forward 1730ms, rotate left 20° (222ms), forward 300ms.
  { id: 7, humanNeeded: false, steps: [
    { dir: 'right',   ms: 1000 },
    { dir: 'right',   ms: 222 },
    { dir: 'forward', ms: 1730 },
    { dir: 'left',    ms: 222 },
    { dir: 'forward', ms: 300 },
  ]},

  // P8: angle=90, col2r5→col1r0. Tight squeeze. HUMAN-NEEDED.
  { id: 8, humanNeeded: true, steps: [
    { dir: 'left',    ms: 1000, note: 'rotate from 90° to 0°' },
    { dir: 'left',    ms: 111,  note: 'slight left drift to col1' },
    { dir: 'forward', ms: 2000, note: 'thread tight gap col0/col3 at row2' },
  ]},

  // P9: angle=90, col1r5→col4r0. Double shift.
  // Rotate left 90° (1000ms). Stay left (col1) past row4 obstacle (sedan col4r4).
  // Forward straight 1200ms (dy=194px → row5 to ~row2.9), then drift right 144px:
  // rotate right 30° (333ms), forward 1778ms (dx=81*1.778=144, dy=140.3*1.778=249.5),
  // rotate left 30° (333ms), forward 250ms.
  { id: 9, humanNeeded: false, steps: [
    { dir: 'left',    ms: 1000 },
    { dir: 'forward', ms: 1200 },
    { dir: 'right',   ms: 333 },
    { dir: 'forward', ms: 1778 },
    { dir: 'left',    ms: 333 },
    { dir: 'forward', ms: 300 },
  ]},

  // P10: angle=270, col3r5→col4r0. Tight squeeze mirrored. HUMAN-NEEDED.
  { id: 10, humanNeeded: true, steps: [
    { dir: 'right',   ms: 1000, note: 'rotate from 270° to 0°' },
    { dir: 'right',   ms: 111,  note: 'slight right drift to col4' },
    { dir: 'forward', ms: 2000, note: 'thread tight gap col2/col5 at row2' },
  ]},

  // ── TIER 3 ──────────────────────────────────────────────────────────────
  // P11: angle=180, col2r5→col2r0. Reverse straight up. dy=288px/162=1.78s.
  { id: 11, humanNeeded: false, steps: [
    { dir: 'reverse', ms: 2000 },
  ]},

  // P12: angle=180, col2r5→col1r0. Tight squeeze in reverse. HUMAN-NEEDED.
  { id: 12, humanNeeded: true, steps: [
    { dir: 'right',   ms: 111, note: 'slight right rotation to drift left while reversing' },
    { dir: 'reverse', ms: 2000, note: 'thread tight gap col0/col3 at row2 in reverse' },
  ]},

  // P13: angle=180, col2r4→col5r2 (right exit).
  // Reverse up: row4→row2 = 96px / 162 = 593ms.
  // Rotate to face right (90°): from 180° rotate left 90° = 1000ms.
  // Forward right: col2→col5 = 144px / 162 = 889ms.
  { id: 13, humanNeeded: false, steps: [
    { dir: 'reverse', ms: 700 },
    { dir: 'left',    ms: 1000 },
    { dir: 'forward', ms: 1000 },
  ]},

  // P14: angle=180, col1r5→col4r0. Double shift in reverse.
  // Reverse straight to row3 (dy=96px → 593ms).
  // Drift right while reversing: rotate right 20° (222ms), reverse 1730ms
  // (dx=+55.4*1.73=95.8≈96, dy=152.3*1.73=263.6 upward),
  // rotate left 20° (222ms), reverse 300ms.
  { id: 14, humanNeeded: false, steps: [
    { dir: 'reverse', ms: 600 },
    { dir: 'right',   ms: 222 },
    { dir: 'reverse', ms: 1730 },
    { dir: 'left',    ms: 222 },
    { dir: 'reverse', ms: 300 },
  ]},

  // P15: angle=180, col1r4→col5r1 (right exit). Tight squeeze + side exit. HUMAN-NEEDED.
  { id: 15, humanNeeded: true, steps: [
    { dir: 'right',   ms: 222,  note: 'drift right while reversing to thread col0/col3 gap at row1' },
    { dir: 'reverse', ms: 1200, note: 'reverse through tight gap' },
    { dir: 'left',    ms: 1000, note: 'rotate from 180° to face right (90°)' },
    { dir: 'forward', ms: 1000, note: 'drive forward to col5 right exit' },
  ]},
];

// ── Run all ──────────────────────────────────────────────────────────────────
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
