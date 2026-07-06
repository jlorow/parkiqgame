/**
 * Targeted diagnostic for P2 (lateral drift) and P6 (rotation then forward).
 * Injects a script to expose car state from Phaser scene for verification.
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

// ── Test P6: angle=90, should rotate left 1000ms then forward ────────────────
console.log('=== P6 DIAGNOSTIC ===');
{
  const { server, port } = await startServer(6);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  let won = false;
  page.on('request', req => {
    if (req.method() === 'POST' && req.url().includes('/api/puzzle-complete')) {
      won = true;
      console.log('P6 WIN! payload:', req.postData());
    }
  });
  page.on('console', msg => {
    const t = msg.text();
    if (t.includes('getProgress') || t.includes('puzzleComplete')) console.log('[PAGE]', t);
  });

  await page.goto(`http://127.0.0.1:${port}/game.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(3500);

  // Expose car state via page injection
  const carState = await page.evaluate(() => {
    // Try to access Phaser game
    const game = window.__PHASER_GAME__ || (window.Phaser && window.Phaser.GAMES && window.Phaser.GAMES[0]);
    if (!game) return 'no game found';
    const scene = game.scene.getScene('PuzzleScene');
    if (!scene) return 'no PuzzleScene';
    return {
      carX: scene.carX,
      carY: scene.carY,
      carAngle: scene.carAngle,
      puzzle: scene.puzzle ? { id: scene.puzzle.id, playerCar: scene.puzzle.playerCar, exitZone: scene.puzzle.exitZone } : null,
    };
  });
  console.log('P6 initial car state:', JSON.stringify(carState));

  // Try: rotate left 1000ms (90°→0°), then forward 2500ms
  console.log('P6: pressing left 1000ms...');
  await press(page, 'left', 1000);

  const afterRotate = await page.evaluate(() => {
    const game = window.__PHASER_GAME__ || (window.Phaser && window.Phaser.GAMES && window.Phaser.GAMES[0]);
    if (!game) return 'no game';
    const scene = game.scene.getScene('PuzzleScene');
    if (!scene) return 'no scene';
    return { carX: scene.carX, carY: scene.carY, carAngle: scene.carAngle };
  });
  console.log('P6 after rotate:', JSON.stringify(afterRotate));

  console.log('P6: pressing forward 2500ms...');
  await press(page, 'forward', 2500);

  const afterForward = await page.evaluate(() => {
    const game = window.__PHASER_GAME__ || (window.Phaser && window.Phaser.GAMES && window.Phaser.GAMES[0]);
    if (!game) return 'no game';
    const scene = game.scene.getScene('PuzzleScene');
    if (!scene) return 'no scene';
    return { carX: scene.carX, carY: scene.carY, carAngle: scene.carAngle };
  });
  console.log('P6 after forward:', JSON.stringify(afterForward));

  await page.waitForTimeout(1000);
  console.log('P6 won:', won);

  // Also check exit zone pixel coords for P6
  const exitInfo = await page.evaluate(() => {
    const game = window.__PHASER_GAME__ || (window.Phaser && window.Phaser.GAMES && window.Phaser.GAMES[0]);
    if (!game) return 'no game';
    const scene = game.scene.getScene('PuzzleScene');
    if (!scene || !scene.puzzle) return 'no puzzle';
    const ez = scene.puzzle.exitZone;
    const UNIT_PX = 48, OFFSET_X = 1, OFFSET_Y = 2;
    const exitPixelX = (ez.col + OFFSET_X) * UNIT_PX - 48;
    const exitPixelY = (ez.row + OFFSET_Y) * UNIT_PX - 48;
    return { ez, exitPixelX, exitPixelY, exitRect: `${exitPixelX},${exitPixelY} 96x96` };
  });
  console.log('P6 exit zone:', JSON.stringify(exitInfo));

  await browser.close();
  server.close();
}

// ── Test P2: angle=0, lateral drift right ────────────────────────────────────
console.log('\n=== P2 DIAGNOSTIC ===');
{
  const { server, port } = await startServer(2);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  let won = false;
  page.on('request', req => {
    if (req.method() === 'POST' && req.url().includes('/api/puzzle-complete')) {
      won = true;
      console.log('P2 WIN! payload:', req.postData());
    }
  });

  await page.goto(`http://127.0.0.1:${port}/game.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(3500);

  const initial = await page.evaluate(() => {
    const game = window.__PHASER_GAME__ || (window.Phaser && window.Phaser.GAMES && window.Phaser.GAMES[0]);
    if (!game) return 'no game';
    const scene = game.scene.getScene('PuzzleScene');
    if (!scene) return 'no scene';
    const ez = scene.puzzle?.exitZone;
    const UNIT_PX = 48, OX = 1, OY = 2;
    const epx = ez ? (ez.col + OX) * UNIT_PX - 48 : null;
    const epy = ez ? (ez.row + OY) * UNIT_PX - 48 : null;
    return {
      carX: scene.carX, carY: scene.carY, carAngle: scene.carAngle,
      puzzle: scene.puzzle ? { id: scene.puzzle.id, playerCar: scene.puzzle.playerCar, exitZone: ez } : null,
      exitPixel: { x: epx, y: epy },
    };
  });
  console.log('P2 initial:', JSON.stringify(initial));

  // Try: rotate right 20° (222ms), forward 2000ms (should drift right and up)
  await press(page, 'right', 222);
  const mid1 = await page.evaluate(() => {
    const game = window.__PHASER_GAME__ || (window.Phaser && window.Phaser.GAMES && window.Phaser.GAMES[0]);
    const scene = game?.scene.getScene('PuzzleScene');
    return scene ? { carX: scene.carX, carY: scene.carY, carAngle: scene.carAngle } : null;
  });
  console.log('P2 after right 222ms:', JSON.stringify(mid1));

  await press(page, 'forward', 2000);
  const mid2 = await page.evaluate(() => {
    const game = window.__PHASER_GAME__ || (window.Phaser && window.Phaser.GAMES && window.Phaser.GAMES[0]);
    const scene = game?.scene.getScene('PuzzleScene');
    return scene ? { carX: scene.carX, carY: scene.carY, carAngle: scene.carAngle } : null;
  });
  console.log('P2 after forward 2000ms:', JSON.stringify(mid2));

  await press(page, 'left', 222);
  await press(page, 'forward', 500);
  const final = await page.evaluate(() => {
    const game = window.__PHASER_GAME__ || (window.Phaser && window.Phaser.GAMES && window.Phaser.GAMES[0]);
    const scene = game?.scene.getScene('PuzzleScene');
    return scene ? { carX: scene.carX, carY: scene.carY, carAngle: scene.carAngle } : null;
  });
  console.log('P2 final:', JSON.stringify(final));
  await page.waitForTimeout(1000);
  console.log('P2 won:', won);

  await browser.close();
  server.close();
}
