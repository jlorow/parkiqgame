// Dev server for ParkIQ game mock - serves built game files + mocks API endpoints
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, 'dist/client');
const PORT = 5179;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.map': 'application/json',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Mock API endpoints
  if (pathname === '/api/progress') {
    console.log('[MOCK] GET /api/progress');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ userId: 'debug-user', puzzleIndex: 1 }));
    return;
  }

  if (pathname === '/api/puzzle-complete') {
    console.log('[MOCK] POST /api/puzzle-complete');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ puzzleIndex: 2 }));
    return;
  }

  // Serve static files
  let filePath = pathname === '/' ? '/game.html' : pathname;
  const fullPath = path.join(ROOT, filePath);

  try {
    const content = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath);
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});
