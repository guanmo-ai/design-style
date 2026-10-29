// 逐帧渲染一个动画场景页：node anim_shoot.cjs <scene.html> <输出目录> [起始帧 结束帧 宽 高 fps]
// 页面要提供 window.renderFrame(f, fps) 和 window.__ready。
const { chromium } = require('playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.ttf': 'font/ttf', '.otf': 'font/otf', '.png': 'image/png' };
(async () => {
  const [, , page_, out, f0 = '0', f1 = '149', w = '1920', h = '1080', fps = '30'] = process.argv;
  fs.mkdirSync(out, { recursive: true });
  const srv = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
  }).listen(0);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  page.on('pageerror', e => console.log('[err]', e.message));
  const rel = path.relative(ROOT, path.resolve(page_)).split(path.sep).join('/');
  await page.goto(`http://127.0.0.1:${srv.address().port}/${rel}?anim=1&pr=${process.env.PR || 1}&w=${w}&h=${h}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 600000 });
  const ev = await page.evaluate(() => window.__events || []);
  fs.writeFileSync(path.join(out, 'events.json'), JSON.stringify(ev));
  const t0 = Date.now();
  const step = +(process.env.STEP || 1);
  for (let f = +f0; f <= +f1; f += step) {
    await page.evaluate(([f, fps]) => window.renderFrame(f, fps), [f, +fps]);
    await page.screenshot({ path: path.join(out, `f${String(f).padStart(4, '0')}.png`) });
  }
  console.log(`frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  await browser.close(); srv.close();
})();
