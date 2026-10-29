// 一次打包、批量出静帧：node scripts/stills_batch.mjs <compositionId> <outDir> <frames...>（帧可写成 a-b:step）
// 环境变量 BROWSER 指定 Chromium；渲染 WebGL 用 swangle。看动作用：一段连续帧拼成胶片条检查起势、过冲、节奏。
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser, ensureBrowser} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

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
let executable = process.env.BROWSER || null;
let chromeMode = process.env.REMOTION_CHROME_MODE || 'headless-shell';
let wrapperDir;
let browser;
const previousFromSurface = process.env.DISABLE_FROM_SURFACE;
try {
  // 精确回归用 CPU 栅格化，避免 GPU/Skia 在同一源码重渲时出现少量像素抖动。
  // 不改变正片命令或默认静帧设置；Windows 可继续通过 BROWSER 指定包装器。
  if (process.env.STABLE_RASTER === '1') {
    // 优先使用已安装的 Playwright 测试浏览器，独立临时 profile，不读取个人浏览器。
    if (!executable) {
      const {chromium} = await import('playwright');
      if (fs.existsSync(chromium.executablePath())) {
        executable = chromium.executablePath();
        chromeMode = 'chrome-for-testing';
      }
      else throw new Error('精确静帧核验需要测试浏览器：先运行 npx playwright install chromium，或用 BROWSER 指定。');
    }
    // 本机旧版 Headless Shell 在此通道实测截图失败；仅在完整测试浏览器中使用。
    if (chromeMode === 'chrome-for-testing') process.env.DISABLE_FROM_SURFACE = '1';
    if (process.platform === 'win32') throw new Error('STABLE_RASTER 需要 POSIX；Windows 请使用 BROWSER 包装器。');
    const installed = await ensureBrowser({browserExecutable: executable, chromeMode});
    if (!('path' in installed)) throw new Error('未找到用于静帧核验的浏览器');
    wrapperDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stable-raster-'));
    executable = path.join(wrapperDir, 'chromium');
    const quoted = "'" + installed.path.replaceAll("'", "'\\''") + "'";
    fs.writeFileSync(executable, `#!/bin/sh\nexec ${quoted} --disable-gpu-rasterization --disable-skia-runtime-opts --disable-checker-imaging --disable-new-content-rendering-timeout --run-all-compositor-stages-before-draw "$@"\n`, {mode: 0o700});
  }
  browser = await openBrowser('chrome', {browserExecutable: executable, chromeMode, chromiumOptions: {gl: 'swangle'}});
  if (process.env.STABLE_RASTER === '1') {
    // 此项目的颗粒与照片使用 CSS backgroundImage，Remotion 不会替它们等待 decode。
    // 在最终截图前等待字体、背景解码与两次绘制，避免把尚未完成的栅格块当作画面差异。
    // 浏览器实例只属于本次静帧核验；不修改依赖文件或正片组件。
    const newPage = browser.newPage.bind(browser);
    browser.newPage = async (...args) => {
      const page = await newPage(...args);
      const client = page._client();
      const send = client.send.bind(client);
      client.send = async (method, ...parameters) => {
        if (method === 'Page.captureScreenshot') {
          await page.evaluate(async () => {
            await document.fonts.ready;
            const urls = new Set();
            for (const element of document.querySelectorAll('[style*="background"]')) {
              const background = getComputedStyle(element).backgroundImage;
              for (const match of background.matchAll(/url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/g)) urls.add(match[1] ?? match[2] ?? match[3]);
            }
            // CSS 无法解码的背景仍按浏览器原有行为忽略；这里只等待所有解码结束。
            await Promise.allSettled([...urls].map(async (url) => {
              const image = new Image();
              image.src = url;
              await image.decode();
            }));
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          });
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
        return send(method, ...parameters);
      };
      return page;
    };
  }
  const props = JSON.parse(process.env.PROPS || '{"music":false}');
  const comp = await selectComposition({serveUrl, id, inputProps: props, puppeteerInstance: browser});
  for (const f of frames) {
    await renderStill({serveUrl, composition: comp, frame: f, output: path.join(outDir, `${String(f).padStart(4, '0')}.png`), inputProps: props, puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}});
    process.stdout.write(`${f} `);
  }
} finally {
  try { await browser?.close({silent: true}); }
  finally {
    if (wrapperDir) fs.rmSync(wrapperDir, {recursive: true, force: true});
    if (previousFromSurface === undefined) delete process.env.DISABLE_FROM_SURFACE;
    else process.env.DISABLE_FROM_SURFACE = previousFromSurface;
  }
}
console.log('\ndone');
