import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm, symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {loadCatalog, validateEntries} from '../../scripts/gallery/catalog.mjs';
import {createGalleryServer} from '../../scripts/gallery/serve.mjs';
import {selectWorks, sourceUrl, videoUrl, readState} from '../../gallery/assets/model.mjs';

test('作品来自本仓库，规格和章节来自现有源文件', async () => {
  const works = await loadCatalog();
  assert.ok(works.length >= 1);
  const work = works.find(item => item.id === '001-bauhaus');
  assert.equal(work.id, '001-bauhaus');
  assert.equal(work.duration, 15);
  assert.equal(work.fps, 60);
  assert.equal(work.chapters.find(chapter => chapter.label === '04 海报').start, 5.5);
  assert.equal(work.images.length, 4);
  assert.equal(sourceUrl(work, 'video'), 'https://github.com/guanmo-ai/design-style/tree/main/styles/001-bauhaus/video');
  assert.equal(sourceUrl(work, 'README.md'), 'https://github.com/guanmo-ai/design-style/blob/main/styles/001-bauhaus/README.md');
  assert.equal(videoUrl(work), './media/001-bauhaus.mp4');
});

test('目录拒绝路径逃逸、外部视频与重复作品', async () => {
  const [work] = await loadCatalog();
  for (const patch of [{id: '../private'}, {asset: 'https://example.com/movie.mp4'}, {release: '../tag'}, {sha256: ''}]) {
    assert.throws(() => validateEntries([{...work, ...patch}]));
  }
  assert.throws(() => validateEntries([work, work]));
});

test('搜索支持多关键词和英文，分类、空结果和排序组合生效', async () => {
  const works = (await loadCatalog()).filter(work => work.id === '001-bauhaus');
  assert.equal(selectWorks(works, {query: 'BAUHAUS 几何'}).length, 1);
  assert.equal(selectWorks(works, {query: '不存在的风格'}).length, 0);
  assert.equal(selectWorks(works, {category: '其他'}).length, 0);
  const two = [...works, {...works[0], id: '002-test', publishedAt: '2026-10-21T07:00:00Z'}];
  assert.equal(selectWorks(two)[0].id, '002-test');
  assert.equal(selectWorks(two, {sort: 'oldest'})[0].id, '001-bauhaus');
  assert.equal(works[0].id, '001-bauhaus');
  assert.deepEqual(readState('https://site.test/design-style/?q=几何&sort=unknown'), {query: '几何', sort: 'latest', category: 'all'});
});

test('静态预览支持视频范围请求、HEAD，并阻止站点外文件', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'design-style-gallery-'));
  await writeFile(path.join(directory, 'sample.mp4'), '0123456789');
  await writeFile(path.join(directory, '.secret'), 'private');
  await symlink(path.join(directory, '.secret'), path.join(directory, 'link.txt'));
  const server = createGalleryServer(directory);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(directory, {recursive: true, force: true}); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const range = await fetch(`${base}/sample.mp4`, {headers: {Range: 'bytes=2-5'}});
  assert.equal(range.status, 206); assert.equal(range.headers.get('content-range'), 'bytes 2-5/10'); assert.equal(await range.text(), '2345');
  const suffix = await fetch(`${base}/sample.mp4`, {headers: {Range: 'bytes=-3'}});
  assert.equal(await suffix.text(), '789');
  assert.equal((await fetch(`${base}/sample.mp4`, {headers: {Range:'bytes=100-200'}})).status, 416);
  const head = await fetch(`${base}/sample.mp4`, {method:'HEAD'});
  assert.equal(head.headers.get('content-length'), '10'); assert.equal(await head.text(), '');
  for (const route of ['/.secret', '/link.txt', '/%2e%2e%2fpackage.json', '/.git/config']) assert.equal((await fetch(`${base}${route}`)).status, 404);
});
