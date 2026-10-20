import {createServer} from 'node:http';
import {stat, realpath} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {output} from './catalog.mjs';

const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
export function createGalleryServer(base = output) {
  const canonicalBase = realpath(base).catch(() => path.resolve(base));
  return createServer(async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const directory = await canonicalBase;
      const file = path.resolve(directory, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(directory + path.sep) || pathname.split('/').some(part => part.startsWith('.')) || await realpath(file) !== file) throw new Error('private');
      const info = await stat(file);
      if (!info.isFile()) throw new Error('file');
      const headers = {'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Accept-Ranges':'bytes', 'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff'};
      let start = 0, end = info.size - 1, status = 200;
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        const invalid = () => {res.writeHead(416, {'Content-Range': `bytes */${info.size}`});res.end();};
        if (!match || !match[1] && !match[2]) return invalid();
        if (!match[1]) start = Math.max(0, info.size - Number(match[2]));
        else {start = Number(match[1]);if (match[2]) end = Math.min(end, Number(match[2]));}
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= info.size) return invalid();
        status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
      }
      headers['Content-Length'] = end - start + 1;
      res.writeHead(status, headers);
      if (req.method === 'HEAD') res.end();
      else {
        const stream = createReadStream(file, {start, end});
        stream.on('error', () => res.destroy());
        res.on('close', () => stream.destroy());
        stream.pipe(res);
      }
    } catch {res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});res.end('未找到页面，请先运行 npm run gallery:build');}
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4186);
  const server = createGalleryServer();
  server.on('error', error => {console.error(`预览启动失败：${error.message}`);process.exitCode = 1;});
  server.listen(port, '127.0.0.1', () => console.log(`Motion Style 画廊：http://127.0.0.1:${port}`));
}
