// 逐帧截图：页面里要有 window.frame(f)（同步或返回 Promise），每帧是时间的纯函数。
// node drafts/_lib/film.cjs <page.html> <出图目录> <起始帧> <结束帧(不含)> [并发=3]
// 再用 ffmpeg 合成：ffmpeg -framerate 60 -i dir/%04d.png -i music.wav -c:v libx264 -pix_fmt yuv420p -crf 16 -shortest out.mp4
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
(async () => {
  const [, , inp, out, s0 = '0', s1 = '1', par = '3'] = process.argv;
  const a = +s0, b = +s1, P = +par;
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const t0 = Date.now();
  let done = 0;
  await Promise.all(Array.from({ length: P }, async (_, k) => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.error('pageerror', e.message));
    await page.goto('file://' + path.resolve(inp));
    await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
    for (let f = a + k; f < b; f += P) {
      await page.evaluate(f => window.frame(f), f);
      await page.screenshot({ path: path.join(out, String(f).padStart(4, '0') + '.png') });
      if (++done % 60 === 0) console.log(`${done}/${b - a}  ${((Date.now() - t0) / done).toFixed(0)} ms/帧`);
    }
    await page.close();
  }));
  await browser.close();
  console.log(`done ${b - a} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
})();
