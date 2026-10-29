// 把 HTML 截成 PNG：node drafts/_lib/shot.cjs <in.html> <out.png> [宽 高 倍率]
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
const [, , inp, out, w = '1920', h = '1080', dpr = '1'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
await page.goto('file://' + path.resolve(inp));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(150);
await page.screenshot({ path: out });
await browser.close();
})();
