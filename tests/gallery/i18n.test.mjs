import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {resolveLanguage, languageUrl, text, messages, documentHref} from '../../gallery/assets/i18n.mjs';
import {loadCatalog, root, validateEntries} from '../../scripts/gallery/catalog.mjs';
import {selectWorks, adjacentWork, workDir} from '../../gallery/assets/model.mjs';
import {renderDocument} from '../../gallery/render-documents.mjs';

test('语言优先级为链接、已选语言、浏览器语言；不接受任意语言值', () => {
  const url = 'https://example.com/design-style/?type=layout&q=grid#work-01-bento-grid';
  assert.equal(resolveLanguage(languageUrl(url, 'en'), {stored:'zh', languages:['zh-CN']}), 'en');
  assert.equal(resolveLanguage(url, {stored:'zh', languages:['en-US']}), 'zh');
  assert.equal(resolveLanguage(url, {languages:['zh-TW', 'en']}), 'zh');
  assert.equal(resolveLanguage(url, {stored:'<script>', languages:['fr-FR']}), 'en');
  assert.equal(resolveLanguage(`${url.replace('#', '&lang=bad#')}`, {languages:['zh']}), 'zh');
  const switched = new URL(languageUrl(url, 'en'));
  assert.equal(switched.searchParams.get('q'), 'grid');
  assert.equal(switched.searchParams.get('type'), 'layout');
  assert.equal(switched.hash, '#work-01-bento-grid');
  assert.throws(() => languageUrl(url, '../en'), /语言/);
});

test('中英文界面文案覆盖一致，文档入口保留语言与当前筛选', () => {
  assert.deepEqual(Object.keys(messages.en).sort(), Object.keys(messages.zh).sort());
  assert.equal(text('en', 'resultCount', {total:7, count:2}), 'Showing 2 of 7 films');
  const href = documentHref({id:'001-bauhaus'}, 'guide', 'en', {type:'style', query:'grid & red'});
  const url = new URL(href, 'https://example.com/design-style/');
  assert.equal(url.pathname, '/design-style/read/001-bauhaus/guide.en.html');
  assert.equal(url.searchParams.get('q'), 'grid & red');
  assert.equal(url.searchParams.get('type'), 'style');
  assert.equal(url.searchParams.get('lang'), 'en');
});

test('每期英文简介、标签、图片标题和英文阅读文档齐全；缺译阻止发布', async () => {
  const works = await loadCatalog();
  for (const work of works) {
    for (const key of ['descriptionEn','categoryEn']) assert.ok(work[key]?.trim(), `${work.id}: ${key}`);
    assert.ok(work.tagsEn.length > 0);
    for (const image of work.images) assert.ok(image.titleEn && image.kindEn);
    for (const [kind,file] of [['guide','README.en.md'],['process','PROCESS.en.md']]) {
      const markdown = await readFile(path.join(root, workDir(work), file), 'utf8');
      const {html} = renderDocument(markdown, work, kind, 'en');
      assert.match(html, /<html lang="en"/);
      assert.match(html, /Back to film/);
      assert.match(html, /hreflang="zh-CN"/);
      assert.match(html, /guide\.en\.html/);
      assert.match(html, /process\.en\.html/);
      // The language picker deliberately names each language in its own script.
      const translatedText = html.replace(/<[^>]*>/g,'').replaceAll('简体中文','').replaceAll('英语','').replaceAll('中文','');
      assert.ok(!/[\p{Script=Han}]/u.test(translatedText), `${work.id}: English reader contains untranslated text`);
    }
  }
  const missing = structuredClone(works);
  delete missing[0].descriptionEn;
  assert.throws(() => validateEntries(missing), /descriptionEn/);
});

test('英文关键词可以搜索，左右切换保持当前搜索与分类顺序', async () => {
  const works = await loadCatalog();
  const state = {type:'style', query:'halftone'};
  assert.ok(selectWorks(works, state).some(work => work.id === '005-pop-art'));
  assert.equal(adjacentWork(works, {type:'layout', query:'grid'}, '02-masonry', 1)?.id, '01-bento-grid');
});
