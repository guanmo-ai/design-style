// 用法：COMP=L01-BentoGrid SCALE=0.5 node scripts/stills.mjs out/bundle out/check 60 150 300 ...
// 打包一次、批量渲染静帧，用于检查画面。COMP 默认 S001-Bauhaus；GL 默认 swangle（无 GPU 也能跑 WebGL）
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
const [serve, outDir, ...frames] = process.argv.slice(2);
const id = process.env.COMP || 'S001-Bauhaus';
const scale = Number(process.env.SCALE || 0.5);
const chromiumOptions = {gl: process.env.GL || 'swangle'};
const browser = await openBrowser('chrome', {browserExecutable: process.env.CHROMIUM_PATH || '/usr/local/bin/chromium', chromiumOptions});
const serveUrl = path.resolve(serve);
const composition = await selectComposition({serveUrl, id, puppeteerInstance: browser, chromiumOptions});
for (const fr of frames) {
  const t0 = Date.now();
  await renderStill({composition, serveUrl, frame: Number(fr), output: path.join(outDir, `f${String(fr).padStart(3, '0')}.png`), scale, puppeteerInstance: browser, overwrite: true, chromiumOptions});
  console.log('frame', fr, `${Date.now() - t0}ms`);
}
await browser.close({silent: true});
process.exit(0);
