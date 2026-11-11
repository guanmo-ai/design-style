import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {loadCatalog, root, sha256, videoSource} from '../../scripts/gallery/catalog.mjs';

test('首页直接进入作品选择，不包含顶部宣传影片或介绍区', async () => {
  const html = await readFile(path.join(root, 'gallery/index.html'), 'utf8');
  assert.match(html, /<main>\s*<section id="collection"/);
  assert.match(html, /<h1 id="collection-title"/);
  assert.doesNotMatch(html, /id="hero-|class="hero(?:\s|"|-)/);
});

test('毛绒按首次上架顺序收录，规格与已审原片一致，保留原字节', async () => {
  const works = await loadCatalog();
  const plush = works.find(work => work.id === '025-plush');
  assert.ok(plush);
  assert.equal(plush.number, '018');
  assert.equal(plush.release, 'day-25');
  assert.deepEqual([plush.duration,plush.fps,plush.width,plush.height], [20,60,1920,1080]);
  assert.equal(plush.images.length, 4);
  assert.equal(plush.chapters.at(-1).start, 17);
  const originalHash = await sha256(path.join(root, 'drafts/plush/film/plush-film.mp4'));
  assert.equal(plush.sha256, originalHash);
  // CI downloads the asset in its next step, so only inspect a local copy when present.
  const {access} = await import('node:fs/promises');
  if (await access(videoSource(plush)).then(() => true, () => false)) assert.equal(await sha256(videoSource(plush)), originalHash);
});
