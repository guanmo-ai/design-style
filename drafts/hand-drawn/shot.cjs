// 等页面画完（window.__done = true）再截：node shot.cjs <in.html> <out.png> [w h dpr]
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const [, , inp, out, w = '1920', h = '1080', dpr = '1'] = process.argv;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[err]', e.message));
  const t = Date.now();
  await page.goto('file://' + path.resolve(inp), { waitUntil: 'commit', timeout: 0 });
  await page.waitForFunction(() => window.__done === true, null, { timeout: 600000, polling: 200 });
  await page.waitForTimeout(100);
  await page.screenshot({ path: out });
  console.log('rendered in', ((Date.now() - t) / 1000).toFixed(1), 's');
  await browser.close();
})();
