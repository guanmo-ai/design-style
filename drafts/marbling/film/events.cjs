// 和 ../../_lib/events.cjs 一样（导出页面里的出字 / 滴落时间给 audio.py），只多一条：浏览器版本对不上时用云端预装的 /opt/pw-browsers/chromium。
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => { const [, , inp, out] = process.argv;
  const exe = process.env.CHROME || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const b = await chromium.launch({ executablePath: exe, args: ['--headless=new', '--no-sandbox', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const p = await b.newPage();
  await p.goto('file://' + path.resolve(inp) + '?preview'); await p.waitForFunction(() => window.ready === true, null, { timeout: 300000 });
  fs.writeFileSync(out, JSON.stringify(await p.evaluate(() => window.events()))); await b.close(); console.log('wrote', out); })();
