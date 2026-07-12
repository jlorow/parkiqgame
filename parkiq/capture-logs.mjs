// Capture console logs from the ParkIQ game using Playwright
import { chromium } from 'playwright';

const URL = 'http://localhost:5179/';
const CAPTURE_SECONDS = 10;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const allLogs = [];

page.on('console', msg => {
  const text = msg.text();
  if (text.includes('[TRAIN-DEBUG]') || text.includes('[LOAD') || text.includes('error') || text.includes('Error') || text.includes('Phaser') || text.includes('train')) {
    allLogs.push(text);
  }
});

page.on('pageerror', err => {
  allLogs.push('[PAGE_ERROR] ' + err.message);
});

console.log(`Navigating to ${URL}...`);
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });

console.log(`Waiting ${CAPTURE_SECONDS} seconds for train debug logs...`);
await page.waitForTimeout(CAPTURE_SECONDS * 1000);

// Print captured logs
console.log('\n=== CAPTURED LOGS ===');
for (const log of allLogs) {
  console.log(log);
}

console.log('\n=== DONE ===');

await browser.close();
