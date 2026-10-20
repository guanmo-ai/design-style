// 用 Chromium 把自包含 SVG 渲染成 2x PNG：node scripts/svg_to_png.mjs in.svg out.png 1080 1350
// 默认使用 Playwright 自带的 Chromium（npx playwright install chromium）；也可用 CHROMIUM_PATH 指定
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';

const [, , input, output, w, h] = process.argv;
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});
try {
  const page = await browser.newPage({viewport: {width: +w, height: +h}, deviceScaleFactor: 2});
  await page.goto(pathToFileURL(input).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({path: output, clip: {x: 0, y: 0, width: +w, height: +h}});
  await page.close();
} finally {
  await browser.close();
}
process.exit(0);
