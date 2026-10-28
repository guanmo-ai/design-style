// 一次打包、批量出静帧：node scripts/stills_batch.mjs <compositionId> <outDir> <frames...>（帧可写成 a-b:step）
// 环境变量 BROWSER 指定 Chromium；渲染 WebGL 用 swangle。看动作用：一段连续帧拼成胶片条检查起势、过冲、节奏。
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [, , id, outDir, ...spec] = process.argv;
const frames = spec.flatMap((s) => {
  const m = s.match(/^(\d+)-(\d+)(?::(\d+))?$/);
  if (!m) return [Number(s)];
  const out = [];
  for (let f = +m[1]; f <= +m[2]; f += +(m[3] ?? 1)) out.push(f);
  return out;
});
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.BROWSER || null, chromiumOptions: {gl: 'swangle'}});
const props = JSON.parse(process.env.PROPS || '{"music":false}');
const comp = await selectComposition({serveUrl, id, inputProps: props, puppeteerInstance: browser});
for (const f of frames) {
  await renderStill({serveUrl, composition: comp, frame: f, output: path.join(outDir, `${String(f).padStart(4, '0')}.png`), inputProps: props, puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}});
  process.stdout.write(`${f} `);
}
await browser.close({silent: true});
console.log('\ndone');
