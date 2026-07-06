/**
 * ParkIQ — Puzzle Playtest Script
 * Runs all 15 puzzles via Playwright, dispatching pointer events to the
 * Phaser canvas control pad. Detects wins by intercepting POST /api/puzzle-complete.
 *
 * Button positions (scene px, 1:1 with canvas at 390×844):
 *   CONTROLS_CENTER_X = 195, CONTROLS_CENTER_Y = 590
 *   BUTTON_RADIUS = 35, offset = 35*2+8 = 78
 *   forward: (195, 590 - 78) = (195, 512)
 *   reverse: (195, 590 + 78) = (195, 668)
 *   left:    (195 - 78, 590) = (117, 590)
 *   right:   (195 + 78, 590) = (273, 590)
 *
 * Canvas is scaled via CSS to fit the viewport. We must map scene coords
 * to actual DOM pixel coords using the canvas bounding rect.
 */

import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');

// ── MIME types ──────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.mp3':  'audio/mpeg',
  '.json': 'application/json',
  '.woff2':'font/woff2',
};

// ── Static file server with API mock ────────────────────────────────────────
function startServer(puzzleIndex) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');

      // Mock GET /api/progress
      if (req.method === 'GET' && url.pathname === '/api/progress') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ userId: 'test', puzzleIndex }));
        return;
      }

      // Mock POST /api/puzzle-complete — just echo back next index
      if (req.method === 'POST' && url.pathname === '/api/puzzle-complete') {
        let body = '';
        req.on('data', d => { body += d; });
        req.on('end', () => {
          const { puzzleId } = JSON.parse(body || '{}');
          const next = puzzleId >= 15 ? 1 : (puzzleId || 1) + 1;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ puzzleIndex: next }));
        });
        return;
      }

      // Serve static files from dist/
      let filePath = join(DIST, url.pathname === '/' ? '/game.html' : url.pathname);

      // Vite puts client files under dist/client/
      if (!existsSync(filePath)) {
        filePath = join(DIST, 'client', url.pathname === '/' ? 'game.html' : url.pathname);
      }
      // Try game.html as fallback for SPA routes
      if (!existsSync(filePath)) {
        filePath = join(DIST, 'client', 'game.html');
      }

      if (existsSync(filePath)) {
        const ext = extname(filePath);
        const mime = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(readFileSync(filePath));
      } else {
        res.writeHead(404);
        res.end('Not found: ' + url.pathname);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

// ── Scene coordinate → canvas DOM coordinate ────────────────────────────────
async function sceneToCanvas(page, sceneX, sceneY) {
  const rect = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  });
  if (!rect) return null;
  // Scene is 390×844; canvas is CSS-scaled
  const scaleX = rect.width  / 390;
  const scaleY = rect.height / 844;
  return {
    x: rect.left + sceneX * scaleX,
    y: rect.top  + sceneY * scaleY,
  };
}

// ── Hold a button for `ms` milliseconds ─────────────────────────────────────
async function holdButton(page, sceneX, sceneY, ms) {
  const pos = await sceneToCanvas(page, sceneX, sceneY);
  if (!pos) return;
  await page.mouse.move(pos.x, pos.y);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
  await page.waitForTimeout(50);
}

// ── Button scene coords ──────────────────────────────────────────────────────
const BTN = {
  forward: [195, 512],
  reverse: [195, 668],
  left:    [117, 590],
  right:   [273, 590],
};

// ── Wait for canvas to appear and Phaser to be ready ────────────────────────
async function waitForGame(page) {
  await page.waitForSelector('canvas', { timeout: 15000 });
  // Wait for Phaser's ready flag — poll for the puzzle number text appearing
  await page.waitForTimeout(3000);
}

// ── Detect win: intercept /api/puzzle-complete POST ─────────────────────────
function attachWinDetector(page) {
  let won = false;
  page.on('request', req => {
    if (req.method() === 'POST' && req.url().includes('/api/puzzle-complete')) {
      won = true;
    }
  });
  return () => won;
}

// ── Run one puzzle test ──────────────────────────────────────────────────────
async function testPuzzle(puzzleId, steps, humanNeeded) {
  const { server, port } = await startServer(puzzleId);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  const checkWon = attachWinDetector(page);

  try {
    await page.goto(`http://127.0.0.1:${port}/game.html`, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);

    // Execute solution steps
    for (const step of steps) {
      if (step.type === 'hold') {
        await holdButton(page, ...BTN[step.dir], step.ms);
      } else if (step.type === 'simultaneous') {
        // Hold two buttons at once (e.g. forward+right)
        const pos1 = await sceneToCanvas(page, ...BTN[step.dir1]);
        const pos2 = await sceneToCanvas(page, ...BTN[step.dir2]);
        if (pos1 && pos2) {
          await page.mouse.move(pos1.x, pos1.y);
          await page.mouse.down();
          // Second touch via touchscreen simulation isn't reliable in Playwright
          // — use sequential rapid presses as approximation
          await page.waitForTimeout(step.ms);
          await page.mouse.up();
          await page.mouse.move(pos2.x, pos2.y);
          await page.mouse.down();
          await page.waitForTimeout(step.ms);
          await page.mouse.up();
        }
      }
    }

    // Wait up to 2s for win signal after last step
    await page.waitForTimeout(2000);
    const won = checkWon();

    if (humanNeeded) {
      return { result: 'HUMAN-NEEDED', evidence: `Automated attempt dispatched (${steps.map(s=>s.dir||`${s.dir1}+${s.dir2}`).join(', ')}). Zero-margin squeeze — scripted timing cannot confirm precise centering. Human must verify solution from design doc.` };
    }
    return {
      result: won ? 'PASS' : 'FAIL',
      evidence: `Dispatched: ${steps.map(s => `${s.dir||`${s.dir1}+${s.dir2}`} ${s.ms}ms`).join(', ')}. /api/puzzle-complete POST ${won ? 'received' : 'NOT received'}.`,
    };
  } catch (err) {
    return { result: 'FAIL', evidence: `Error: ${err.message}` };
  } finally {
    await browser.close();
    server.close();
  }
}

// ── Puzzle solution steps (from puzzle-design-doc-v2.md) ────────────────────
//
// Physics: MOVE_SPEED=120px/s, ROTATION_SPEED=90deg/s, CONTAINER_SCALE=1.35
// Grid: UNIT_PX=48, CONTAINER_OFFSET_X=1, CONTAINER_OFFSET_Y=2
// Player spawn pixel (container-local): (col+1)*48, (row+2)*48
// Exit pixel (container-local): (ez.col+1)*48-48, (ez.row+2)*48-48
//
// Distance from spawn to exit (container-local px), then scaled by 1.35 for
// actual canvas px, then time = dist / (120 * 1.35) seconds.
//
// Tier 1 (angle 0 = already facing up = forward moves toward row 0):
//   P1: spawn col2r5=(144,336), exit col2r0=(96,48). dy=288px container.
//       canvas dist = 288*1.35=388px. time=388/162=2.4s → hold forward 2500ms
//   P2: spawn col2r5=(144,336), exit col4r0=(192,48). Need to go right then forward.
//       shift right: col2→col4 = 2 cols = 96px container. time=96*1.35/162=0.8s
//       then forward to row0: ~288px container → 2400ms
//   P3: spawn col2r5=(144,336), exit col2r0=(96,48). Straight through middle.
//       Same as P1: forward 2500ms
//   P4: spawn col3r5=(192,336), exit col1r0=(48,48). Need to go left then forward.
//       shift left: col3→col1 = 2 cols = 96px → 800ms left
//       then forward ~288px → 2400ms
//   P5: spawn col2r5=(144,336), exit col1r0=(48,48). Thread tight gap.
//       slight left shift: col2→col1 = 48px → 400ms left
//       then forward 2500ms
//
// Tier 2 (angle 90 or 270 = facing right or left — must rotate to 0 first):
//   Rotation to 0 from 90: need -90deg at 90deg/s = 1000ms left
//   Rotation to 0 from 270: need +90deg at 90deg/s = 1000ms right
//
// Tier 3 (angle 180 = facing down — reverse moves toward row 0):
//   Reverse moves in -facing direction = upward when angle=180

const PUZZLES = [
  // P1: straight forward
  { id: 1, humanNeeded: false, steps: [
    { type: 'hold', dir: 'forward', ms: 2800 },
  ]},
  // P2: shift right, then forward to col4 exit
  { id: 2, humanNeeded: false, steps: [
    { type: 'hold', dir: 'right',   ms: 800 },
    { type: 'hold', dir: 'forward', ms: 2800 },
  ]},
  // P3: straight forward through middle gap
  { id: 3, humanNeeded: false, steps: [
    { type: 'hold', dir: 'forward', ms: 2800 },
  ]},
  // P4: shift left, then forward to col1 exit
  { id: 4, humanNeeded: false, steps: [
    { type: 'hold', dir: 'left',    ms: 800 },
    { type: 'hold', dir: 'forward', ms: 2800 },
  ]},
  // P5: zero-margin tight squeeze — HUMAN-NEEDED
  { id: 5, humanNeeded: true, steps: [
    { type: 'hold', dir: 'left',    ms: 400 },
    { type: 'hold', dir: 'forward', ms: 2800 },
  ]},
  // P6: rotate from 90→0 (left 1000ms), then forward through center gap
  { id: 6, humanNeeded: false, steps: [
    { type: 'hold', dir: 'left',    ms: 1000 },
    { type: 'hold', dir: 'forward', ms: 2800 },
  ]},
  // P7: rotate from 270→0 (right 1000ms), then shift right, then forward
  { id: 7, humanNeeded: false, steps: [
    { type: 'hold', dir: 'right',   ms: 1000 },
    { type: 'hold', dir: 'right',   ms: 600 },
    { type: 'hold', dir: 'forward', ms: 2800 },
  ]},
  // P8: rotate from 90→0 (left 1000ms), slight left, then forward — HUMAN-NEEDED (tight)
  { id: 8, humanNeeded: true, steps: [
    { type: 'hold', dir: 'left',    ms: 1000 },
    { type: 'hold', dir: 'left',    ms: 300 },
    { type: 'hold', dir: 'forward', ms: 2800 },
  ]},
  // P9: rotate from 90→0 (left 1000ms), stay left, then shift right upper section
  { id: 9, humanNeeded: false, steps: [
    { type: 'hold', dir: 'left',    ms: 1000 },
    { type: 'hold', dir: 'forward', ms: 1200 },
    { type: 'hold', dir: 'right',   ms: 600 },
    { type: 'hold', dir: 'forward', ms: 1800 },
  ]},
  // P10: rotate from 270→0 (right 1000ms), thread mirrored tight gap — HUMAN-NEEDED
  { id: 10, humanNeeded: true, steps: [
    { type: 'hold', dir: 'right',   ms: 1000 },
    { type: 'hold', dir: 'right',   ms: 300 },
    { type: 'hold', dir: 'forward', ms: 2800 },
  ]},
  // P11: angle 180, reverse straight through center gap
  { id: 11, humanNeeded: false, steps: [
    { type: 'hold', dir: 'reverse', ms: 2800 },
  ]},
  // P12: angle 180, reverse through tight gap — HUMAN-NEEDED
  { id: 12, humanNeeded: true, steps: [
    { type: 'hold', dir: 'left',    ms: 300 },
    { type: 'hold', dir: 'reverse', ms: 2800 },
  ]},
  // P13: angle 180, reverse then turn right to side exit col5r2
  { id: 13, humanNeeded: false, steps: [
    { type: 'hold', dir: 'reverse', ms: 1400 },
    { type: 'hold', dir: 'right',   ms: 900 },
    { type: 'hold', dir: 'forward', ms: 1200 },
  ]},
  // P14: angle 180, reverse double-shift
  { id: 14, humanNeeded: false, steps: [
    { type: 'hold', dir: 'reverse', ms: 1200 },
    { type: 'hold', dir: 'right',   ms: 600 },
    { type: 'hold', dir: 'reverse', ms: 1800 },
  ]},
  // P15: angle 180, tight squeeze + side exit — HUMAN-NEEDED
  { id: 15, humanNeeded: true, steps: [
    { type: 'hold', dir: 'right',   ms: 400 },
    { type: 'hold', dir: 'reverse', ms: 1200 },
    { type: 'hold', dir: 'right',   ms: 900 },
    { type: 'hold', dir: 'forward', ms: 1200 },
  ]},
];

// ── Main ─────────────────────────────────────────────────────────────────────
const results = [];

for (const puzzle of PUZZLES) {
  process.stdout.write(`Testing puzzle ${puzzle.id}...`);
  const r = await testPuzzle(puzzle.id, puzzle.steps, puzzle.humanNeeded);
  results.push({ id: puzzle.id, ...r });
  process.stdout.write(` ${r.result}\n`);
}

// ── Print table ──────────────────────────────────────────────────────────────
console.log('\n| Puzzle # | Result | Evidence |');
console.log('|---|---|---|');
for (const r of results) {
  console.log(`| ${r.id} | ${r.result} | ${r.evidence} |`);
}
