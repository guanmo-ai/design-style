// 截 WebGL 页面：等页面把 window.__done 设为 true（分块渲染完）再截图
// node drafts/_lib/shot-gl.cjs <in.html | http://…> <out.png> [宽 高 倍率] [查询串]
// （用到 ES module 的页面要走 http：在仓库根目录 python3 -m http.server 8765）
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const [, , inp, out, w = '1920', h = '1080', dpr = '2', query = ''] = process.argv;
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[error]', e.message));
  const t0 = Date.now();
  await page.goto((/^https?:/.test(inp) ? inp : 'file://' + path.resolve(inp)) + (query ? '?' + query : ''));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.__done === true, null, { timeout: 15 * 60 * 1000, polling: 500 });
  await page.waitForTimeout(100);
  await page.screenshot({ path: out });
  console.log('shot', out, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  await browser.close();
})();
