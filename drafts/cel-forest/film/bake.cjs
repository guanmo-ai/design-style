// 预先画好每个场景的分层（一层一张透明 PNG），片子页面只负责合成：node bake.cjs <场景名…>（不给就全画）
// 每层都是确定的（固定随机种子），layers/ 不进仓库，删了重跑即可。
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const want = process.argv.slice(2), out = path.join(__dirname, 'layers'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', m => console.log('[page]', m.text())); p.on('pageerror', e => console.error('pageerror', e.message));
  await p.goto('file://' + path.join(__dirname, 'bake.html'));
  await p.waitForFunction(() => window.ready === true, null, { timeout: 600000 });
  const scenes = want.length ? want : await p.evaluate(() => Object.keys(SCENES));
  for (const s of scenes) {
    const t = Date.now();
    const L = await p.evaluate(async s => { const L = await SCENES[s](); return L.map(l => ({ name: l.name, url: l.c.toDataURL('image/png') })); }, s);
    for (const l of L) fs.writeFileSync(path.join(out, `${s}-${l.name}.png`), Buffer.from(l.url.split(',')[1], 'base64'));
    console.log(s, L.map(l => l.name).join(' '), ((Date.now() - t) / 1000).toFixed(1) + 's');
  }
  await b.close();
})();
