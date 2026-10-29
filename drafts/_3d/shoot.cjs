// 起一个本地静态服务器，用 Chromium（软件 WebGL）打开场景页，等页面把 window.__done 置 true 后截图。
// node shoot.cjs <scene.html> <out.png> [宽 高]
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..', '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.ttf': 'font/ttf', '.otf': 'font/otf', '.png': 'image/png', '.json': 'application/json' };
(async () => {
  const [, , page_, out, w = '1920', h = '1080'] = process.argv;
  const srv = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  }).listen(0);
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[err]', e.message));
  const rel = path.relative(ROOT, path.resolve(page_)).split(path.sep).join('/');
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${port}/${rel}`);
  await page.waitForFunction(() => window.__done === true, null, { timeout: 600000 });
  await page.screenshot({ path: out });
  console.log('rendered in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  await browser.close(); srv.close();
})();
