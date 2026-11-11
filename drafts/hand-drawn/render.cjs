// 出图：node drafts/hand-drawn/render.cjs <场景名…>   → images/<场景名>.jpg（1920×1080）
const { chromium } = require('playwright'); const path = require('path');
(async () => { const names = process.argv.slice(2); const b = await chromium.launch();
  for (const n of names) { const p = await b.newPage({ viewport: { width: 1920, height: 1080 } }); const t = Date.now();
    p.on('pageerror', e => console.error('ERR', n, e.message)); p.on('console', m => { if (m.type() === 'error') console.error('console', n, m.text()); });
    await p.goto('file://' + path.join(__dirname, 'page.html') + '?s=' + n); await p.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
    await p.screenshot({ path: path.join(__dirname, 'images', n + '.jpg'), type: 'jpeg', quality: 93 }); console.log(n, ((Date.now() - t) / 1000).toFixed(1) + 's'); await p.close(); }
  await b.close(); })();
