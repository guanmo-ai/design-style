import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {renderDocument} from '../../gallery/render-documents.mjs';
import {root, loadCatalog} from '../../scripts/gallery/catalog.mjs';

test('站内文档保留表格、代码与所有图片，并转换文档交叉链接', async () => {
  const work = (await loadCatalog()).find(item => item.id === '001-bauhaus');
  const guide = renderDocument(await readFile(path.join(root, 'styles', work.id, 'README.md'), 'utf8'), work, 'guide');
  const process = renderDocument(await readFile(path.join(root, 'styles', work.id, 'PROCESS.md'), 'utf8'), work, 'process');
  assert.equal(guide.assets.length, 5);
  assert.equal(process.assets.length, 4);
  assert.equal(guide.headings.length, 10);
  assert.equal(process.headings.length, 14);
  assert.match(guide.html, /<table>/);
  assert.match(guide.html, /<pre><code/);
  assert.match(guide.html, /href="process.html"/);
  assert.match(process.html, /href="guide.html#doc-9--15-秒分镜"/);
  assert.match(guide.html, /id="doc-9--15-秒分镜"/);
  assert.match(guide.html, /href="..\/..\/#work-001-bauhaus"/);
  assert.match(process.html, /src="..\/..\/styles\/001-bauhaus\/process\/02-v2-storyboard.jpg"/);
  assert.match(process.html, /type="checkbox" disabled/);
  assert.doesNotMatch(guide.html, /href="(?:README|PROCESS)\.md/);
});

test('布局作品的文档从 layouts/ 读取素材', async () => {
  const work = (await loadCatalog()).find(item => item.id === '01-bento-grid');
  const guide = renderDocument(await readFile(path.join(root, 'layouts', work.id, 'README.md'), 'utf8'), work, 'guide');
  const process = renderDocument(await readFile(path.join(root, 'layouts', work.id, 'PROCESS.md'), 'utf8'), work, 'process');
  assert.equal(guide.assets.length, 5);
  assert.equal(process.assets.length, 4);
  assert.match(guide.html, /src="..\/..\/layouts\/01-bento-grid\/images\/preview\/skins.svg"/);
  assert.match(process.html, /src="..\/..\/layouts\/01-bento-grid\/process\/03-morph.jpg"/);
  assert.match(process.html, /href="guide.html#doc-9--15-秒分镜"/);
  assert.match(guide.html, /href="..\/..\/#work-01-bento-grid"/);
});

test('文档渲染移除脚本与危险 URL，同时保留安全链接', () => {
  const work = {id:'001-bauhaus', number:'001', title:'包豪斯', titleEn:'Bauhaus', release:'day-01'};
  const result = renderDocument('# 标题\n\n<script>alert(1)</script>\n\n<a href="javascript:alert(1)" onclick="alert(1)">危险链接</a>\n\n[官方](https://example.com/)\n\n## 相同标题\n\n## 相同标题', work, 'guide');
  assert.doesNotMatch(result.html, /<script|onclick|javascript:/);
  assert.match(result.html, /href="https:\/\/example.com\/" target="_blank" rel="noopener noreferrer"/);
  assert.deepEqual(result.headings.map(heading => heading.id), ['doc-相同标题','doc-相同标题-1']);
  assert.throws(() => renderDocument('![外部图片](https://example.com/image.png)', work, 'guide'), /本期本地素材/);
  assert.throws(() => renderDocument('![越界图片](../../private.png)', work, 'guide'), /本期本地素材/);
});
