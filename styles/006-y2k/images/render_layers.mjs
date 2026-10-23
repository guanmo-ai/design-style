// 006 · 把 layers/*.json 渲染成透明 WebP（铬 / 果冻 / 泡泡 / 玻璃），SVG 用 <image> 叠上去
// 用法：node styles/006-y2k/images/render_layers.mjs [名字…]（默认全部）
// WebGL 走 SwiftShader（CPU），没有显卡也能出图；一张 2160×2700 约 10–30 秒
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, 'layers');
const want = process.argv.slice(2);
const names = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).filter((n) => !want.length || want.includes(n));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'],
});
let code = 0;
for (const n of names) {
  const cfg = JSON.parse(fs.readFileSync(path.join(DIR, `${n}.json`), 'utf8'));
  const page = await browser.newPage({viewport: {width: cfg.w, height: cfg.h}, deviceScaleFactor: 1});
  page.on('pageerror', (e) => console.error(`[${n}]`, e.message));
  page.on('console', (m) => m.type() === 'error' && console.error(`[${n}]`, m.text()));
  const t = Date.now();
  await page.goto(pathToFileURL(path.join(HERE, 'layer.html')).href + `?c=${n}`);
  await page.waitForFunction(() => window.__done, null, {timeout: 600000});
  if ((await page.evaluate(() => window.__done)) !== true) { code = 1; await page.close(); continue; }
  // 直接读画布像素（cfg.scale 倍），不经过截图缩放；Chromium 自带 WebP 编码（保留透明）
  const b64 = await page.evaluate(() => document.getElementById('c').toDataURL('image/webp', 0.92).split(',')[1]);
  await page.close();
  const out = path.join(DIR, `${n}.webp`);
  fs.writeFileSync(out, Buffer.from(b64, 'base64'));
  console.log(`layer ${n}.webp  ${(fs.statSync(out).size / 1024).toFixed(0)} KB  ${((Date.now() - t) / 1000).toFixed(1)} s`);
}
await browser.close();
process.exit(code);
