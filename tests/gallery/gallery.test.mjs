import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm, symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {loadCatalog, validateEntries} from '../../scripts/gallery/catalog.mjs';
import {createGalleryServer} from '../../scripts/gallery/serve.mjs';
import * as model from '../../gallery/assets/model.mjs';
const {selectWorks, adjacentWork, sourceUrl, videoUrl, readState, typeOf, workLabel} = model;

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
  assert.equal(videoUrl(work), `./media/001-bauhaus.mp4?v=${work.sha256}`);
  assert.equal(work.type, 'style');
});

test('018 使用发布版 30fps 时间轴，源码入口指向 three.js 工程', async () => {
  const works = await loadCatalog();
  const work = works.find(work => work.id === '018-diorama');
  assert.equal(work.fps, 30);
  assert.equal(work.duration, 20);
  assert.equal(work.chapters.find(chapter => chapter.label === '02 房间剖面').start, 4.2);
  assert.equal(sourceUrl(work, 'video'), 'https://github.com/guanmo-ai/design-style/tree/main/styles/018-diorama/video3d');
  assert.equal(sourceUrl(work, 'README.md'), 'https://github.com/guanmo-ai/design-style/blob/main/styles/018-diorama/README.md');
  assert.throws(() => validateEntries(works.map(item => item === work ? {...item, videoDir: '../private'} : item)), /源码目录/);
});

test('布局作品放在 layouts/，编号独立，标签和源码路径随类型变化', async () => {
  const works = await loadCatalog();
  const bento = works.find(item => item.id === '01-bento-grid');
  assert.equal(bento.type, 'layout');
  assert.equal(workLabel(bento), '布局 01');
  assert.equal(workLabel(works.find(item => item.id === '001-bauhaus')), '风格 001');
  assert.equal(bento.duration, 15);
  assert.equal(bento.chapters.find(chapter => chapter.label === '05 五条规则').start, 7.4);
  assert.equal(sourceUrl(bento, 'video'), 'https://github.com/guanmo-ai/design-style/tree/main/layouts/01-bento-grid/video');
  assert.equal(sourceUrl(bento, 'PROCESS.md'), 'https://github.com/guanmo-ai/design-style/blob/main/layouts/01-bento-grid/PROCESS.md');
  assert.equal(videoUrl(bento), `./media/01-bento-grid.mp4?v=${bento.sha256}`);
  assert.deepEqual(selectWorks(works, {type: 'layout'}).map(work => work.id), ['02-masonry', '01-bento-grid']);
  assert.ok(selectWorks(works, {type: 'style'}).every(work => work.type === 'style'));
  assert.equal(selectWorks(works, {query: '布局 便当'}).length, 1);
  assert.equal(typeOf({}), 'style');
});

test('目录拒绝路径逃逸、外部视频与重复作品', async () => {
  const [work] = await loadCatalog();
  for (const patch of [{id: '../private'}, {asset: 'https://example.com/movie.mp4'}, {release: '../tag'}, {sha256: ''}, {type: undefined}, {type: 'other'}, {type: 'layout'}]) {
    assert.throws(() => validateEntries([{...work, ...patch}]));
  }
  assert.throws(() => validateEntries([work, work]));
});

test('网站上架期号按系列连续，制作目录与已发布链接保持独立', async () => {
  const works = await loadCatalog();
  const first = works.find(work => work.id === '001-bauhaus');
  const second = {...first, id:'013-art-deco', asset:'013-art-deco.mp4', release:'day-13', number:'002'};
  const layout = works.find(work => work.id === '01-bento-grid');
  assert.doesNotThrow(() => validateEntries([second, layout, first]));
  assert.equal(workLabel(second), '风格 002');
  assert.equal(sourceUrl(second, 'video'), 'https://github.com/guanmo-ai/design-style/tree/main/styles/013-art-deco/video');
  assert.equal(videoUrl(second), `./media/013-art-deco.mp4?v=${second.sha256}`);
  for (const number of ['001', '003', '013', '2', '000']) {
    assert.throws(() => validateEntries([first, {...second, number}]), /上架期号/);
  }
  assert.throws(() => validateEntries([first, {...layout, number:'02'}]), /上架期号/);
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
  assert.deepEqual(readState('https://site.test/design-style/?q=几何&sort=unknown'), {query: '几何', type: 'all', sort: 'latest', category: 'all'});
  assert.equal(readState('https://site.test/design-style/?type=layout').type, 'layout');
  assert.equal(readState('https://site.test/design-style/?type=../x').type, 'all');
});

test('影片导航沿当前筛选与排序循环，全部作品可跨风格和布局', async () => {
  assert.equal(typeof adjacentWork, 'function');
  const works = (await loadCatalog()).filter(work => ['003-constructivism', '002-swiss-style', '001-bauhaus', '02-masonry', '01-bento-grid'].includes(work.id));
  const cases = [
    [{type: 'style'}, '003-constructivism', 1, '002-swiss-style'],
    [{type: 'style'}, '001-bauhaus', 1, '003-constructivism'],
    [{type: 'style'}, '003-constructivism', -1, '001-bauhaus'],
    [{type: 'layout'}, '02-masonry', 1, '01-bento-grid'],
    [{type: 'all'}, '003-constructivism', 1, '02-masonry'],
    [{type: 'all'}, '02-masonry', -1, '003-constructivism'],
    [{type: 'all', query: '网格'}, '002-swiss-style', 1, '01-bento-grid'],
    [{type: 'style', sort: 'oldest'}, '001-bauhaus', 1, '002-swiss-style']
  ];
  for (const [state, id, direction, expected] of cases) {
    assert.equal(adjacentWork(works, state, id, direction)?.id, expected);
  }
});

test('空列表、单部影片和不在筛选结果内的直达影片不提供导航', async () => {
  assert.equal(typeof adjacentWork, 'function');
  const works = await loadCatalog();
  assert.equal(adjacentWork([], {}, '001-bauhaus', 1), undefined);
  assert.equal(adjacentWork(works, {query: '包豪斯'}, '001-bauhaus', -1), undefined);
  assert.equal(adjacentWork(works, {type: 'layout'}, '003-constructivism', 1), undefined);
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

test('同名视频更新哈希后使用不同 URL，避免继续播放缓存的旧版', async () => {
  const [work] = await loadCatalog();
  const updated = {...work, sha256: 'f'.repeat(64)};
  assert.notEqual(videoUrl(work), videoUrl(updated));
  assert.equal(new URL(videoUrl(updated), 'https://example.com/').pathname, `/media/${work.asset}`);
});
