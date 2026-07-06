/**
 * Deep diagnostic for failing puzzles.
 * Tests multiple timing variants per puzzle to find what works.
 * Also checks console for collision resets.
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
  const consoleLogs = [];
  page.on('request', req => {
    if (req.method() === 'POST' && req.url().includes('/api/puzzle-complete')) won = true;
  });
  page.on('console', msg => consoleLogs.push(msg.text()));

  try {
    await page.goto(`http://127.0.0.1:${port}/game.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(3500);

    for (const s of steps) await press(page, s.dir, s.ms);
    await page.waitForTimeout(2000);

    const relevant = consoleLogs.filter(l => l.includes('getProgress') || l.includes('puzzleComplete') || l.includes('crunch') || l.includes('collision'));
    console.log(`  P${puzzleId} [${label}]: ${won ? 'WIN' : 'FAIL'} | logs: ${relevant.join(' | ') || 'none'}`);
    return won;
  } finally {
    await browser.close();
    server.close();
  }
}

// ── P6: angle=90, col2r5→col2r0. Obstacle: sedan col0r2, suv col4r2.
// Exit: col2r0 → exitPixelX=2*48=96, exitPixelY=1*48=48. Rect: 96,48 96×96.
// Spawn: x=(2+1)*48=144, y=(5+2)*48=336.
// Car needs to reach x≈144 (col2), y≈48 (row0 exit).
// After rotating left 1000ms from 90°: angle should be 0° (facing up).
// Forward: dy=-288px container / 120px/s = 2.4s. But exit zone starts at y=48,
// car center needs to be within 48 to 144 (exit rect y range).
// Car starts at y=336, exit rect top=48, bottom=144. Car needs y < 144+72=216 to overlap.
// Actually: car rect = cx-36 to cx+36 (x), cy-72 to cy+72 (y).
// Exit rect = 96 to 192 (x), 48 to 144 (y).
// Overlap when: cx-36 < 192 AND cx+36 > 96 AND cy-72 < 144 AND cy+72 > 48.
// cx=144: 108<192 ✓, 180>96 ✓. cy condition: cy < 216 AND cy > -24.
// So car triggers exit when cy < 216. Spawn cy=336. Need dy > 120px. At 120px/s: 1s.
// So forward 1200ms should be enough! Why is it failing?
// Hypothesis: the rotation isn't completing properly, or the car is hitting an obstacle.
// Obstacle sedan col0r2: ox=(0+1)*48=48, oy=(2+2)*48=192. obsRect: 48-36=12 to 48+36=84 (x), 192-72=120 to 192+72=264 (y).
// Car at x=144: no x overlap with sedan (12-84). ✓
// Obstacle suv col4r2: ox=(4+1)*48=240, oy=192. obsRect: 204-276 (x), 120-264 (y).
// Car at x=144: no x overlap. ✓
// So no collision. The issue must be the rotation.

console.log('=== P6 variants ===');
await trySteps(6, [{ dir: 'left', ms: 1000 }, { dir: 'forward', ms: 1500 }], 'left1000+fwd1500');
await trySteps(6, [{ dir: 'left', ms: 1000 }, { dir: 'forward', ms: 2000 }], 'left1000+fwd2000');
await trySteps(6, [{ dir: 'left', ms: 1000 }, { dir: 'forward', ms: 2500 }], 'left1000+fwd2500');
await trySteps(6, [{ dir: 'left', ms: 1000 }, { dir: 'forward', ms: 3000 }], 'left1000+fwd3000');
await trySteps(6, [{ dir: 'left', ms: 900 }, { dir: 'forward', ms: 2500 }], 'left900+fwd2500');
await trySteps(6, [{ dir: 'left', ms: 1100 }, { dir: 'forward', ms: 2500 }], 'left1100+fwd2500');

// ── P2: angle=0, col2r5→col4r0. Exit: col4r0 → x=4*48=192, y=1*48=48. Rect: 192,48 96×96.
// Spawn: x=144, y=336. Need cx in 192-36=156 to 192+96+36=324... wait.
// Exit rect: x=192 to 288, y=48 to 144. Car rect: cx±36, cy±72.
// Overlap: cx-36 < 288 AND cx+36 > 192 AND cy-72 < 144 AND cy+72 > 48.
// cx condition: cx > 156 AND cx < 324. Spawn cx=144 < 156. Need to drift right by at least 12px.
// Obstacle sedan col0r1: ox=48, oy=(1+2)*48=144. obsRect: 12-84 (x), 72-216 (y).
// Obstacle suv col4r4: ox=240, oy=(4+2)*48=288. obsRect: 204-276 (x), 216-360 (y).
// Car at cx=144, cy=336: suv obsRect x=204-276, car x=108-180. No overlap. ✓
// If car drifts right to cx=200, cy=288: suv obsRect y=216-360, car y=216-360. OVERLAP! ✗
// The suv at col4r4 blocks the right lane at row4! Car must pass row4 before drifting right.
// Row4 oy=288. Car needs cy < 288-72=216 before drifting right past col4.
// Strategy: forward straight to cy=216 (dy=120px → 1s), then drift right.
// After cy=216: need cx to reach 156+. dx needed=12px minimum, but exit is at cx=192+.
// Actually need cx=192 (center of exit rect). dx=192-144=48px.
// Remaining dy=216-48=168px (to reach exit center).
// θ=arctan(48/168)=15.9°→177ms rotation. sin=0.274, cos=0.962. dx/s=32.8, dy/s=-115.4.
// t=48/32.8=1.46s. dy=-115.4*1.46=-168.5 ✓

console.log('\n=== P2 variants ===');
await trySteps(2, [{ dir: 'forward', ms: 1000 }, { dir: 'right', ms: 177 }, { dir: 'forward', ms: 1460 }], 'fwd1000+r177+fwd1460');
await trySteps(2, [{ dir: 'forward', ms: 1000 }, { dir: 'right', ms: 200 }, { dir: 'forward', ms: 1500 }], 'fwd1000+r200+fwd1500');
await trySteps(2, [{ dir: 'forward', ms: 800 }, { dir: 'right', ms: 177 }, { dir: 'forward', ms: 1600 }], 'fwd800+r177+fwd1600');
await trySteps(2, [{ dir: 'forward', ms: 1200 }, { dir: 'right', ms: 177 }, { dir: 'forward', ms: 1400 }], 'fwd1200+r177+fwd1400');

// ── P4: angle=0, col3r5→col1r0. Exit: col1r0 → x=1*48=48, y=48. Rect: 48,48 96×96.
// Spawn: x=(3+1)*48=192, y=336. Need cx in 48-36=12 to 48+96+36=180. cx=192 > 180. Need dx=-12 minimum.
// Obstacle sedan col5r1: ox=(5+1)*48=288, oy=144. obsRect: 252-324 (x), 72-216 (y). No issue.
// Obstacle suv col1r4: ox=(1+1)*48=96, oy=(4+2)*48=288. obsRect: 60-132 (x), 216-360 (y).
// Car at cx=192 drifting left: when cx=96, cy=288 → suv obsRect x=60-132, car x=60-132. OVERLAP! ✗
// Must pass row4 (cy<216) before reaching col1 (cx=96).
// Strategy: forward straight to cy=216 (dy=120px → 1s), then drift left.
// After cy=216: need cx=96 (exit center). dx=96-192=-96px. Remaining dy=216-48=168px.
// θ=arctan(96/168)=29.7°→330ms rotation. sin=0.496, cos=0.868. dx/s=-59.5, dy/s=-104.2.
// t=96/59.5=1.61s. dy=-104.2*1.61=-167.8 ✓

console.log('\n=== P4 variants ===');
await trySteps(4, [{ dir: 'forward', ms: 1000 }, { dir: 'left', ms: 330 }, { dir: 'forward', ms: 1610 }], 'fwd1000+l330+fwd1610');
await trySteps(4, [{ dir: 'forward', ms: 1000 }, { dir: 'left', ms: 300 }, { dir: 'forward', ms: 1700 }], 'fwd1000+l300+fwd1700');
await trySteps(4, [{ dir: 'forward', ms: 800 }, { dir: 'left', ms: 330 }, { dir: 'forward', ms: 1800 }], 'fwd800+l330+fwd1800');

// ── P7: angle=270, col2r5→col4r0. Same as P2 after rotation.
// Rotate right 1000ms (270→0), then same as P2 with forward-first strategy.
console.log('\n=== P7 variants ===');
await trySteps(7, [{ dir: 'right', ms: 1000 }, { dir: 'forward', ms: 1000 }, { dir: 'right', ms: 177 }, { dir: 'forward', ms: 1460 }], 'r1000+fwd1000+r177+fwd1460');
await trySteps(7, [{ dir: 'right', ms: 1000 }, { dir: 'forward', ms: 1000 }, { dir: 'right', ms: 200 }, { dir: 'forward', ms: 1500 }], 'r1000+fwd1000+r200+fwd1500');

// ── P9: angle=90, col1r5→col4r0. Rotate left 1000ms, then forward-first strategy.
// Spawn: x=(1+1)*48=96, y=336. Exit: col4r0 → x=192, y=48. dx=+96, dy=-288.
// Obstacle sedan col4r4: ox=240, oy=288. obsRect: 204-276 (x), 216-360 (y).
// Obstacle suv col1r1: ox=96, oy=144. obsRect: 60-132 (x), 72-216 (y).
// Car at cx=96 moving up: suv at x=60-132, y=72-216. Car x=60-132. OVERLAP when cy < 216+72=288.
// Must drift right before reaching row1 suv. But also avoid sedan at col4r4 (x=204-276, y=216-360).
// Car at cx=96 moving up: no x overlap with sedan. ✓
// Strategy: forward straight past suv (cy < 72, i.e. dy > 264px → 2.2s), then drift right.
// But exit is at y=48. After 2.2s forward: cy=336-264=72. Exit cy condition: cy < 216. ✓ already.
// Wait — suv col1r1 obsRect y=72-216. Car at cy=144 (mid-travel): car y=72-216. OVERLAP with suv! ✗
// The suv at col1r1 blocks col1 from row-1 to row4. Car spawns at col1r5 and must move through col1.
// The design doc says: "Stay left initially to avoid the car on the right, then shift right."
// "Left" here means col1 (player's starting column). The suv at col1r1 blocks the top of col1.
// So: forward in col1 until just before suv (row2 = cy=192), then shift right to col4.
// Row2 suv top: oy=144, obsRect top=72. Car bottom=cy+72. Need cy+72 < 72 → cy < 0. Impossible.
// Actually: car needs to NOT overlap suv. suv obsRect y=72-216. Car overlaps when cy-72 < 216 AND cy+72 > 72.
// i.e. cy < 288 AND cy > 0. So car ALWAYS overlaps suv y-range while in col1!
// The only way to avoid: be at different x. Suv x=60-132. Car must have cx > 132+36=168 or cx < 60-36=24.
// So car must drift right to cx > 168 before reaching suv y-range (cy < 288).
// But sedan col4r4 obsRect x=204-276, y=216-360. Car at cx=240 (col4): overlaps sedan when cy > 216-72=144.
// So: must be right of cx=168 AND above cy=144 to avoid both. 
// Path: start at (96,336), drift right to cx=168+ while going up past cy=144.
// dx=72, dy=-192. θ=arctan(72/192)=20.6°→229ms. sin=0.351, cos=0.936. dx/s=42.2, dy/s=-112.3.
// t=72/42.2=1.71s. dy=-112.3*1.71=-192 ✓. Then forward to exit.
// After drift: cx=168, cy=144. Exit at cx=192, cy=48. dx=24, dy=-96.
// θ=arctan(24/96)=14°→156ms. sin=0.242, cos=0.970. dx/s=29, dy/s=-116.4.
// t=24/29=0.83s. dy=-116.4*0.83=-96.6 ✓.
console.log('\n=== P9 variants ===');
await trySteps(9, [
  { dir: 'left', ms: 1000 },
  { dir: 'right', ms: 229 }, { dir: 'forward', ms: 1710 },
  { dir: 'left', ms: 229 },
  { dir: 'right', ms: 156 }, { dir: 'forward', ms: 830 },
  { dir: 'left', ms: 156 },
], 'l1000+r229+fwd1710+l229+r156+fwd830+l156');
await trySteps(9, [
  { dir: 'left', ms: 1000 },
  { dir: 'right', ms: 229 }, { dir: 'forward', ms: 1800 },
  { dir: 'left', ms: 229 }, { dir: 'forward', ms: 1000 },
], 'l1000+r229+fwd1800+l229+fwd1000');

// ── P14: angle=180, col1r5→col4r0. dx=+96, dy=-288 via reverse.
// Obstacle sedan col4r4: ox=240, oy=288. obsRect: 204-276 (x), 216-360 (y).
// Obstacle suv col1r1: ox=96, oy=144. obsRect: 60-132 (x), 72-216 (y).
// Same obstacle layout as P9 but in reverse. Same avoidance logic applies.
// At angle=180+θ reversing: dx=+sin(θ)*120, dy=-cos(θ)*120.
// θ=20.6°→229ms rotation. reverse 1710ms (dx=+72, dy=-192). Then straighten, reverse to exit.
// After: cx=168, cy=144. Need cx=192, cy=48. dx=+24, dy=-96.
// θ=14°→156ms. reverse 830ms.
console.log('\n=== P14 variants ===');
await trySteps(14, [
  { dir: 'right', ms: 229 }, { dir: 'reverse', ms: 1710 },
  { dir: 'left', ms: 229 },
  { dir: 'right', ms: 156 }, { dir: 'reverse', ms: 830 },
  { dir: 'left', ms: 156 },
], 'r229+rev1710+l229+r156+rev830+l156');
await trySteps(14, [
  { dir: 'right', ms: 229 }, { dir: 'reverse', ms: 1800 },
  { dir: 'left', ms: 229 }, { dir: 'reverse', ms: 1000 },
], 'r229+rev1800+l229+rev1000');
