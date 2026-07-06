/**
 * P9 and P14 deep diagnostic.
 *
 * P9: angle=90, col1r5→col4r0.
 * Obstacles: sedan col4r4 (ox=240,oy=288), suv col1r1 (ox=96,oy=144).
 * After rotating left 1000ms (90°→0°), spawn at cx=96, cy=336.
 *
 * The suv at col1r1 has obsRect x=60-132, y=72-216.
 * Car at cx=96 (x=60-132) will collide with suv when cy is in 0-288 (y overlap 72-216 ± 72).
 * Specifically: car overlaps suv when cy-72 < 216 AND cy+72 > 72 → cy < 288 AND cy > 0.
 * So car ALWAYS collides with suv if it stays at cx=96 while moving up past cy=288.
 * Must drift right to cx > 132+36=168 BEFORE cy drops below 288.
 * Spawn cy=336. Need to drift right while going from cy=336 to cy=288 (dy=48px).
 * At θ=45°: dx/s=84.9, dy/s=-84.9. t=48/84.9=0.565s. dx=84.9*0.565=48px. cx=144.
 * cx=144 > 132+36=168? No, 144 < 168. Still in suv x range (60-132)? 144-36=108 < 132. Still overlaps!
 * Need cx-36 > 132 → cx > 168. dx needed = 168-96=72px.
 * At θ=45°: t=72/84.9=0.848s. dy=-84.9*0.848=-72px. cy=336-72=264. Still > 0. ✓
 * But sedan col4r4 obsRect x=204-276, y=216-360. At cx=168: 132-204 (x). 204>204? No overlap. ✓
 * After drift: cx=168, cy=264. Need to reach exit cx=192, cy=48. dx=24, dy=-216.
 * θ=arctan(24/216)=6.3°→70ms. sin=0.110, cos=0.994. dx/s=13.2, dy/s=-119.3.
 * t=24/13.2=1.82s. dy=-119.3*1.82=-217.1 ✓.
 * Sequence: left 1000ms, right 848ms (45°), forward 848ms, left 848ms (back to 0°), right 70ms, forward 1820ms, left 70ms.
 * Wait — rotation and forward are separate button presses. Can't rotate and move simultaneously.
 * Actually in the game: left/right rotates, forward/reverse moves. They're independent state flags.
 * But with mouse, I can only press one button at a time (single pointer).
 * So I must: rotate to angle, then move forward (which drifts), then rotate back.
 * The drift happens DURING the forward press, not during rotation.
 *
 * Revised P9 strategy:
 * 1. Rotate left 1000ms (90°→0°). Now at cx=96, cy=336, angle=0.
 * 2. Rotate right 500ms (0°→45°). Now angle=45°.
 * 3. Forward 848ms: dx=+72, dy=-72. Now cx=168, cy=264. angle=45°.
 * 4. Rotate left 500ms (45°→0°). Now angle=0.
 * 5. Rotate right 70ms (0°→6.3°). Now angle=6.3°.
 * 6. Forward 1820ms: dx=+24, dy=-216. Now cx=192, cy=48. angle=6.3°.
 * Exit rect: x=192-288, y=48-144. Car at cx=192, cy=48: x=156-228 overlaps 192-288 ✓, y=-24-120 overlaps 48-144 ✓. WIN!
 *
 * P14: angle=180, col1r5→col4r0. Same obstacle layout. Same avoidance needed.
 * At angle=180+θ reversing: dx=+sin(θ)*120, dy=-cos(θ)*120.
 * At θ=45° (angle=225°): dx=+84.9, dy=-84.9.
 * 1. Rotate right 500ms (180°→225°). angle=225°.
 * 2. Reverse 848ms: dx=+72, dy=-72. cx=168, cy=264.
 * 3. Rotate left 500ms (225°→180°). angle=180°.
 * 4. Rotate right 70ms (180°→186.3°). angle=186.3°.
 * 5. Reverse 1820ms: dx=+24, dy=-216. cx=192, cy=48. WIN!
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

const BTN = { forward: [195, 512], reverse: [195, 668], left: [117, 590], right: [273, 590] };

async function press(page, dir, ms) {
  const [x, y] = BTN[dir];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
  await page.waitForTimeout(50);
}

async function trySteps(puzzleId, steps, label) {
  const { server, port } = await startServer(puzzleId);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  let won = false;
  page.on('request', req => {
    if (req.method() === 'POST' && req.url().includes('/api/puzzle-complete')) won = true;
  });
  try {
    await page.goto(`http://127.0.0.1:${port}/game.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(3500);
    for (const s of steps) await press(page, s.dir, s.ms);
    await page.waitForTimeout(2000);
    console.log(`  P${puzzleId} [${label}]: ${won ? 'WIN' : 'FAIL'}`);
    return won;
  } finally {
    await browser.close();
    server.close();
  }
}

console.log('=== P9 variants ===');
// Strategy: rotate left 1000ms, then rotate right 500ms (45°), forward 848ms, rotate left 500ms, rotate right 70ms, forward 1820ms
await trySteps(9, [
  { dir: 'left', ms: 1000 },
  { dir: 'right', ms: 500 },
  { dir: 'forward', ms: 848 },
  { dir: 'left', ms: 500 },
  { dir: 'right', ms: 70 },
  { dir: 'forward', ms: 1820 },
], 'l1000+r500+fwd848+l500+r70+fwd1820');

await trySteps(9, [
  { dir: 'left', ms: 1000 },
  { dir: 'right', ms: 500 },
  { dir: 'forward', ms: 900 },
  { dir: 'left', ms: 500 },
  { dir: 'forward', ms: 2000 },
], 'l1000+r500+fwd900+l500+fwd2000');

await trySteps(9, [
  { dir: 'left', ms: 1000 },
  { dir: 'right', ms: 600 },
  { dir: 'forward', ms: 700 },
  { dir: 'left', ms: 600 },
  { dir: 'forward', ms: 2000 },
], 'l1000+r600+fwd700+l600+fwd2000');

// Try going right immediately and aggressively to avoid suv
await trySteps(9, [
  { dir: 'left', ms: 1000 },
  { dir: 'right', ms: 400 },
  { dir: 'forward', ms: 1000 },
  { dir: 'left', ms: 400 },
  { dir: 'forward', ms: 2000 },
], 'l1000+r400+fwd1000+l400+fwd2000');

// Try: rotate to 90° right (facing right), move forward briefly to shift right, then rotate back
await trySteps(9, [
  { dir: 'left', ms: 1000 },  // 90→0
  { dir: 'right', ms: 1000 }, // 0→90 (facing right)
  { dir: 'forward', ms: 600 }, // move right: dx=+72
  { dir: 'left', ms: 1000 },  // 90→0 (facing up)
  { dir: 'forward', ms: 2000 }, // move up to exit
], 'l1000+r1000+fwd600+l1000+fwd2000');

console.log('\n=== P14 variants ===');
await trySteps(14, [
  { dir: 'right', ms: 500 },
  { dir: 'reverse', ms: 848 },
  { dir: 'left', ms: 500 },
  { dir: 'right', ms: 70 },
  { dir: 'reverse', ms: 1820 },
], 'r500+rev848+l500+r70+rev1820');

await trySteps(14, [
  { dir: 'right', ms: 500 },
  { dir: 'reverse', ms: 900 },
  { dir: 'left', ms: 500 },
  { dir: 'reverse', ms: 2000 },
], 'r500+rev900+l500+rev2000');

await trySteps(14, [
  { dir: 'right', ms: 1000 }, // 180→270 (facing left)
  { dir: 'reverse', ms: 600 }, // reverse while facing left: moves right
  { dir: 'left', ms: 1000 },  // 270→180 (facing down again)
  { dir: 'reverse', ms: 2000 }, // reverse up
], 'r1000+rev600+l1000+rev2000');

await trySteps(14, [
  { dir: 'right', ms: 400 },
  { dir: 'reverse', ms: 1000 },
  { dir: 'left', ms: 400 },
  { dir: 'reverse', ms: 2000 },
], 'r400+rev1000+l400+rev2000');
