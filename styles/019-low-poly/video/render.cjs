// 把目录里的 fNNNN.svg 逐帧截成 PNG（file:// 打开，字体从 public/fonts 读）：node render.cjs <目录> [宽 高]
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path');
(async () => {
  const [, , dir, w = '1920', h = '1080'] = process.argv;
  const files = fs.readdirSync(dir).filter(f => /^f\d+\.svg$/.test(f)).sort();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  for (const f of files) {
    await page.goto('file://' + path.resolve(dir, f));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(dir, f.replace('.svg', '.png')) });
  }
  await browser.close();
})();
