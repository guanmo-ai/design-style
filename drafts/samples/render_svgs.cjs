// 把一个目录里的 fNNNN.svg 逐帧截成 PNG：node render_svgs.cjs <dir> [宽 高]
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path');
(async () => {
  const [, , dir, w = '1920', h = '1080'] = process.argv;
  const files = fs.readdirSync(dir).filter(f => /^f\d+\.svg$/.test(f)).sort();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  for (const f of files) {
    await page.setContent(`<html><body style="margin:0">${fs.readFileSync(path.join(dir, f), 'utf8')}</body></html>`);
    await page.screenshot({ path: path.join(dir, f.replace('.svg', '.png')) });
  }
  await browser.close();
})();
