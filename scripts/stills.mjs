// 用法：node scripts/stills.mjs out/bundle out/check 60 150 300 ...
// 打包一次、批量渲染静帧，用于检查画面
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
const [serve, outDir, ...frames] = process.argv.slice(2);
const browser = await openBrowser('chrome', {browserExecutable: process.env.CHROMIUM_PATH || '/usr/local/bin/chromium'});
const serveUrl = path.resolve(serve);
const composition = await selectComposition({serveUrl, id: 'S001-Bauhaus', puppeteerInstance: browser});
for (const fr of frames) {
  await renderStill({composition, serveUrl, frame: Number(fr), output: path.join(outDir, `f${String(fr).padStart(3, '0')}.png`), scale: 0.5, puppeteerInstance: browser, overwrite: true});
  console.log('frame', fr);
}
await browser.close({silent: true});
process.exit(0);
