import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const MIME = { '.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.mp3':'audio/mpeg','.json':'application/json' };

function startServer(puzzleIndex) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/progress') { res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({userId:'test',puzzleIndex})); return; }
      if (req.method === 'POST' && url.pathname === '/api/puzzle-complete') { let b=''; req.on('data',d=>{b+=d;}); req.on('end',()=>{ const {puzzleId}=JSON.parse(b||'{}'); res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({puzzleIndex:puzzleId>=15?1:(puzzleId||1)+1})); }); return; }
      let fp = join(DIST,'client',url.pathname==='/'?'game.html':url.pathname);
      if(!existsSync(fp)) fp=join(DIST,'client','game.html');
      if(existsSync(fp)){res.writeHead(200,{'Content-Type':MIME[extname(fp)]||'application/octet-stream'});res.end(readFileSync(fp));}else{res.writeHead(404);res.end('nf');}
    });
    server.listen(0,'127.0.0.1',()=>resolve({server,port:server.address().port}));
  });
}

const BTN = {forward:[195,512],reverse:[195,668],left:[117,590],right:[273,590]};
async function press(page,dir,ms){const[x,y]=BTN[dir];await page.mouse.move(x,y);await page.mouse.down();await page.waitForTimeout(ms);await page.mouse.up();await page.waitForTimeout(50);}

async function test(rotMs, fwdMs) {
  const {server,port}=await startServer(6);
  const browser=await chromium.launch({headless:true});
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  const page=await ctx.newPage();
  let won=false;
  page.on('request',req=>{if(req.method()==='POST'&&req.url().includes('/api/puzzle-complete'))won=true;});
  await page.goto(`http://127.0.0.1:${port}/game.html`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('canvas',{timeout:15000});
  await page.waitForTimeout(3500);
  await press(page,'left',rotMs);
  await press(page,'forward',fwdMs);
  await page.waitForTimeout(2000);
  await browser.close();
  server.close();
  return won;
}

// Test P6 with range of rotation timings
for (const rot of [800, 850, 900, 950, 1000, 1050, 1100]) {
  const won = await test(rot, 2500);
  console.log(`P6 left${rot}+fwd2500: ${won?'WIN':'FAIL'}`);
}
