// 单帧全尺寸：node drafts/_lib/still.cjs <page.html> <帧> <out.png> [裁切 x,y,w,h]
const { chromium } = require('playwright'); const path = require('path');
(async () => { const [, , inp, f, out, crop] = process.argv; const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 1920, height: 1080}}); p.on('pageerror', e => console.error('ERR', e.message));
  await p.goto('file://' + path.resolve(inp)); await p.waitForFunction(() => window.ready === true); await p.evaluate(f => frame(f), +f);
  const o = {path: out}; if (crop) { const [x, y, width, height] = crop.split(',').map(Number); o.clip = {x, y, width, height}; }
  await p.screenshot(o); await b.close(); })();
