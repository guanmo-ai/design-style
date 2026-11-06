// 导出页面里的动作时间：node drafts/_lib/events.cjs <page.html> <out.json>（页面要有 window.events()）
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => { const [, , inp, out] = process.argv; const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve(inp)); await p.waitForFunction(() => window.ready === true, null, { timeout: 300000 });
  fs.writeFileSync(out, JSON.stringify(await p.evaluate(() => window.events()))); await b.close(); console.log('wrote', out); })();
