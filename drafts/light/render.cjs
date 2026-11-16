// 渲染“光”：等页面算完（window.__done），直接从 WebGL 画布导出 PNG（不走截图，重页面截图会超时）。
// node render.cjs <out.png> [查询串]
const { chromium } = require('playwright');
const path = require('node:path'); const fs = require('node:fs');
(async () => {
  const [, , out, query = '', pageFile = 'light.html'] = process.argv;
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.setDefaultTimeout(0);
  page.on('console', m => { const t = m.text(); if (!/GL Driver/.test(t) && !/^spp \d*[1-9]\d /.test(t)) console.log('[page]', t); });
  const t0 = Date.now();
  await page.goto('file://' + path.resolve(__dirname, pageFile) + '?notext&' + query);
  await page.waitForFunction(() => window.__done === true, null, { timeout: 0, polling: 2000 });
  const url = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'));
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  await browser.close();
})();
