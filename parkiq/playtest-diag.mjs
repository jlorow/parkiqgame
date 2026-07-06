/**
 * Diagnostic: check canvas dimensions and whether a forward press registers
 * for puzzle 1 (known PASS), then check puzzle 2 with extended timing.
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

const { server, port } = await startServer(1);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

// Capture console logs from the page
page.on('console', msg => console.log('[PAGE]', msg.text()));

await page.goto(`http://127.0.0.1:${port}/game.html`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('canvas', { timeout: 15000 });
await page.waitForTimeout(3500);

// Check canvas dimensions
const canvasInfo = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  if (!c) return 'NO CANVAS';
  const r = c.getBoundingClientRect();
  return `canvas: ${c.width}x${c.height} | DOM rect: ${r.width.toFixed(1)}x${r.height.toFixed(1)} at (${r.left.toFixed(1)},${r.top.toFixed(1)})`;
});
console.log('Canvas info:', canvasInfo);

// Check if Phaser game object is accessible
const phaserInfo = await page.evaluate(() => {
  // Try to find Phaser game instance
  const keys = Object.keys(window).filter(k => k.toLowerCase().includes('phaser') || k === 'game');
  return 'window keys with phaser/game: ' + keys.join(', ');
});
console.log('Phaser info:', phaserInfo);

// Compute button positions
const rect = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  const r = c.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
});

const scaleX = rect.width / 390;
const scaleY = rect.height / 844;
console.log(`Scale: ${scaleX.toFixed(3)} x ${scaleY.toFixed(3)}`);

// Button positions in DOM coords
const buttons = {
  forward: { x: rect.left + 195 * scaleX, y: rect.top + 512 * scaleY },
  reverse: { x: rect.left + 195 * scaleX, y: rect.top + 668 * scaleY },
  left:    { x: rect.left + 117 * scaleX, y: rect.top + 590 * scaleY },
  right:   { x: rect.left + 273 * scaleX, y: rect.top + 590 * scaleY },
};
console.log('Button DOM coords:', JSON.stringify(buttons, null, 2));

// Test: hold forward for 3s, check for win
let won = false;
page.on('request', req => {
  if (req.method() === 'POST' && req.url().includes('/api/puzzle-complete')) {
    won = true;
    console.log('WIN DETECTED via /api/puzzle-complete');
  }
});

await page.mouse.move(buttons.forward.x, buttons.forward.y);
await page.mouse.down();
console.log('Forward button pressed at', buttons.forward.x.toFixed(1), buttons.forward.y.toFixed(1));
await page.waitForTimeout(3000);
await page.mouse.up();
await page.waitForTimeout(1000);
console.log('Won:', won);

// Now test puzzle 2: right shift then forward
await browser.close();
server.close();

// Test puzzle 2 with longer rotation time
const { server: s2, port: p2 } = await startServer(2);
const b2 = await chromium.launch({ headless: true });
const ctx2 = await b2.newContext({ viewport: { width: 390, height: 844 } });
const pg2 = await ctx2.newPage();
let won2 = false;
pg2.on('request', req => {
  if (req.method() === 'POST' && req.url().includes('/api/puzzle-complete')) {
    won2 = true;
    console.log('P2 WIN DETECTED');
  }
});
await pg2.goto(`http://127.0.0.1:${p2}/game.html`, { waitUntil: 'domcontentloaded' });
await pg2.waitForSelector('canvas', { timeout: 15000 });
await pg2.waitForTimeout(3500);

const rect2 = await pg2.evaluate(() => {
  const c = document.querySelector('canvas');
  const r = c.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
});
const sx2 = rect2.width / 390, sy2 = rect2.height / 844;
const fwd2 = { x: rect2.left + 195 * sx2, y: rect2.top + 512 * sy2 };
const rgt2 = { x: rect2.left + 273 * sx2, y: rect2.top + 590 * sy2 };

// P2 solution: player at col2r5, exit at col4r0
// Need to drift right by 2 cols (96px container * 1.35 = 129.6px canvas)
// At MOVE_SPEED=120px/s canvas: time = 129.6/120 = 1.08s → try 1200ms right
// Then forward: row5→row0 = 5 rows = 240px container * 1.35 = 324px / 120 = 2.7s → 3000ms
console.log('P2: pressing right 1200ms then forward 3000ms');
await pg2.mouse.move(rgt2.x, rgt2.y);
await pg2.mouse.down();
await pg2.waitForTimeout(1200);
await pg2.mouse.up();
await pg2.waitForTimeout(100);
await pg2.mouse.move(fwd2.x, fwd2.y);
await pg2.mouse.down();
await pg2.waitForTimeout(3000);
await pg2.mouse.up();
await pg2.waitForTimeout(1500);
console.log('P2 won:', won2);

await b2.close();
s2.close();
