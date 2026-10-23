import {readdir, readFile, lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {loadCatalog, output, root, sha256} from './catalog.mjs';
import {renderDocument, DOCUMENT_PAGES} from '../../gallery/render-documents.mjs';
import {workDir} from '../../gallery/assets/model.mjs';

export async function checkRelease(base = output) {
  const works = await loadCatalog();
  const expected = new Set(['index.html', 'LICENSE', 'NOTICE.md', '.nojekyll', 'data/works.json',
    'assets/gallery.css', 'assets/gallery.mjs', 'assets/model.mjs', 'assets/reader.css', 'assets/reader.mjs', 'assets/i18n.mjs', 'assets/mark.svg',
    'assets/fonts/DMSans-latin.woff2', 'assets/fonts/Newsreader-latin.woff2',
    'assets/fonts/OFL-DMSans.txt', 'assets/fonts/OFL-Newsreader.txt']);
  for (const work of works) {
    expected.add(`media/${work.asset}`);
    expected.add(`${workDir(work)}/video/cover.jpg`);
    for (const image of work.images) expected.add(`${workDir(work)}/images/preview/${image.file}.svg`);
    for (const {kind, language, file, slug} of DOCUMENT_PAGES) {
      expected.add(`read/${work.id}/${slug}.html`);
      const markdown = await readFile(path.join(root, workDir(work), file), 'utf8');
      for (const asset of renderDocument(markdown, work, kind, language).assets) expected.add(`${workDir(work)}/${asset}`);
    }
  }
  let bytes = 0;
  const files = new Set();
  async function walk(directory) {
    for (const name of await readdir(path.join(base, directory))) {
      const relative = path.posix.join(directory, name);
      const info = await lstat(path.join(base, relative));
      assert.ok(!info.isSymbolicLink(), `禁止发布符号链接：${relative}`);
      if (info.isDirectory()) await walk(relative);
      else {
        assert.ok(info.isFile() && expected.has(relative), `非发布文件：${relative}`);
        files.add(relative); bytes += info.size;
      }
    }
  }
  await walk('');
  assert.deepEqual([...files].sort(), [...expected].sort(), '发布文件缺失');
  assert.ok(bytes < 1_000_000_000, '发布产物超过 GitHub Pages 1 GB 限制');
  assert.deepEqual(JSON.parse(await readFile(path.join(base, 'data/works.json'), 'utf8')), works, '发布目录与内容源不一致');
  for (const work of works) assert.equal(await sha256(path.join(base, 'media', work.asset)), work.sha256, `视频校验失败：${work.id}`);

  // Model the real project-site prefix, rather than testing only at localhost /.
  const prefix = 'https://guanmo-ai.github.io/design-style/';
  const htmlPages = new Map();
  for (const file of files) if (file.endsWith('.html')) htmlPages.set(file, await readFile(path.join(base, file), 'utf8'));
  let checkedLinks = 0;
  function checkLink(value, from) {
    const url = new URL(value.replaceAll('&amp;', '&'), new URL(from, prefix));
    if (url.origin !== new URL(prefix).origin) return;
    assert.ok(url.href.startsWith(prefix), `链接逃逸站点子路径：${from} → ${value}`);
    const relative = decodeURIComponent(url.pathname.slice(new URL(prefix).pathname.length)) || 'index.html';
    assert.ok(files.has(relative), `本地链接目标不存在：${from} → ${value}`);
    if (url.hash && htmlPages.has(relative)) {
      const id = decodeURIComponent(url.hash.slice(1));
      const isWork = relative === 'index.html' && works.some(work => id === `work-${work.id}`);
      assert.ok(isWork || [...htmlPages.get(relative).matchAll(/\bid="([^"]+)"/g)].some(match => match[1] === id), `锚点不存在：${from} → ${value}`);
    }
    checkedLinks++;
  }
  for (const [file, html] of htmlPages) {
    assert.ok(!/https?:\/\/(?:localhost|127\.0\.0\.1)|\/Users\/|\.gallery-cache/.test(html), `页面包含本地路径：${file}`);
    for (const match of html.matchAll(/<(?:a|img|script|link)\b[^>]*?\b(?:href|src)="([^"]+)"/g)) checkLink(match[1], file);
  }
  for (const file of files) if (file.endsWith('.css')) {
    const css = await readFile(path.join(base, file), 'utf8');
    for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) checkLink(match[1], file);
  }
  return {files: files.size, checkedLinks, bytes, works: works.length};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkRelease();
  console.log(`发布检查通过：${result.files} 个文件，${result.checkedLinks} 个站内引用，${(result.bytes / 1024 / 1024).toFixed(1)} MiB，${result.works} 期视频。`);
}
