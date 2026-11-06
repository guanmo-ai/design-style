// WebGL 片子的逐帧截图：页面要有 window.ready 和 async window.frame(f)（每帧是时间的纯函数）。
// node drafts/_lib/film-gl.cjs <page.html> <出图目录> <起始帧> <结束帧(不含)> [并发=2] [步长=1] [查询串]
// 已经存在的帧会跳过（断了可以接着渲）；步长 > 1 用来先出低密度的样片。
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
(async () => {
  const [, , inp, out, s0 = '0', s1 = '1', par = '2', stepS = '1', query = ''] = process.argv;
  const EXT = process.env.FRAME_EXT || '.jpg';
  const a = +s0, b = +s1, P = +par, step = +stepS;
  fs.mkdirSync(out, { recursive: true });
  const todo = [];
  for (let f = a; f < b; f += step) if (!fs.existsSync(path.join(out, String(f).padStart(4, '0') + EXT))) todo.push(f);
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const t0 = Date.now();
  let done = 0;
  await Promise.all(Array.from({ length: P }, async (_, k) => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.error('pageerror', e.message));
    page.on('console', m => { const t = m.text(); if (!/GPU stall|GL Driver/.test(t)) console.log('[page]', t); });
    await page.goto('file://' + path.resolve(inp) + (query ? '?' + query : ''));
    await page.waitForFunction(() => window.ready === true, null, { timeout: 300000, polling: 200 });
    for (let i = k; i < todo.length; i += P) {
      const f = todo[i];
      await page.evaluate(f => window.frame(f), f);
      await page.screenshot(EXT === '.jpg' ? { path: path.join(out, String(f).padStart(4, '0') + EXT), type: 'jpeg', quality: 95 } : { path: path.join(out, String(f).padStart(4, '0') + EXT) });
      done++;
      if (done % 20 === 0 || done === todo.length) console.log(`${done}/${todo.length}  ${((Date.now() - t0) / done / 1000).toFixed(2)} s/帧`);
    }
    await page.close();
  }));
  await browser.close();
  console.log(`done ${todo.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
})();
