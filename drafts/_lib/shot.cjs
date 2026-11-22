// 把 HTML 截成 PNG：node drafts/_lib/shot.cjs <in.html> <out.png> [宽 高 倍率]
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
const [, , inp, out, w = '1920', h = '1080', dpr = '1'] = process.argv;
// 项目锁定的 Playwright 和环境里装的浏览器版本对不上时（云端会话），退回预装的 Chromium。
const browser = await chromium.launch().catch(() => chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' }));
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
await page.goto('file://' + path.resolve(inp));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(150);
await page.screenshot({ path: out });
await browser.close();
})();
