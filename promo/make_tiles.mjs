// 把每个风格的“圆”定格成静帧：960×540 的给画廊墙（public/promo/tiles/），原尺寸的给开场轮盘（tiles/full/）。
// 用法：node promo/make_tiles.mjs [bundle 目录=out/bundle]（先 npx remotion bundle src/index.ts --out-dir out/bundle）
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TL = JSON.parse(fs.readFileSync(path.join(root, 'promo/timeline.json'), 'utf8'));
const serveUrl = path.resolve(process.argv[2] || path.join(root, 'out/bundle'));
const outDir = path.join(root, 'public/promo/tiles');
fs.mkdirSync(path.join(outDir, 'full'), {recursive: true});
// 定格在哪一帧：两拍的场景避开结尾的接力（红色涨满、转轴、网点长满）
const KEY = {bauhaus: 36, swiss: 34, constructivism: 40, memphis: 36, ink: 47};
const jobs = [...TL.scenes.map((s) => [s.id, KEY[s.id] ?? s.len - 6]), ['bento', 0], ['masonry', 0]];
const chromiumOptions = {gl: process.env.GL || 'swangle'};
const browser = await openBrowser('chrome', {browserExecutable: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', chromiumOptions});
for (const [id, frame] of jobs) {
  const inputProps = {only: id, hud: false, blur: 1, music: false};
  const composition = await selectComposition({serveUrl, id: 'Promo', puppeteerInstance: browser, chromiumOptions, inputProps});
  await renderStill({composition, serveUrl, frame, output: path.join(outDir, `${id}.jpg`), imageFormat: 'jpeg', jpegQuality: 92, scale: 0.5, puppeteerInstance: browser, overwrite: true, chromiumOptions, inputProps});
  console.log('tile', id, frame);
  // 原尺寸、不带颗粒的一份：开场的 21 片轮盘用；水墨那张也是镜头从墙上拉出来的起点
  await renderStill({composition, serveUrl, frame, output: path.join(outDir, 'full', `${id}.jpg`), imageFormat: 'jpeg', jpegQuality: 95, scale: 1, puppeteerInstance: browser, overwrite: true, chromiumOptions, inputProps: {...inputProps, grain: false}});
}
await browser.close({silent: true});
process.exit(0);
