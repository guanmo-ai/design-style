// node frames.cjs page.html outdir f1,f2,...   — renders specific frames (for review)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => { const [, , inp, out, list, q = ''] = process.argv; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.setDefaultTimeout(900000); p.on('pageerror', e => console.error('pageerror', e.message)); p.on('console', m => { if (!/willRead/.test(m.text())) console.log('[page]', m.text()); });
  await p.goto('file://' + path.resolve(inp) + '?nodraw' + q); await p.waitForFunction(() => window.ready === true, null, { timeout: 600000 });
  for (const f of list.split(',').map(Number)) { const t = Date.now(); await p.evaluate(f => window.frame(f), f); await p.screenshot({ path: path.join(out, String(f).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 85 }); console.log(f, Date.now() - t, 'ms'); }
  await b.close(); })();
