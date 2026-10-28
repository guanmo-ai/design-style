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
  assert.match(guide.html, /href="..\/..\/#work-01-bento-grid">看视频<\/a>/);
});

test('中英文阅读标题使用上架期号，保留原文锚点和源码标识', () => {
  const work = {id:'013-art-deco', type:'style', number:'008', title:'装饰艺术', titleEn:'Art Deco', release:'day-13'};
  const markdown = '# 013 · Art Deco\n\n[标题](#013--art-deco)\n\n[源码](video/ArtDeco.tsx)\n\n`styles/013-art-deco`';
  for (const language of ['zh', 'en']) {
    const {html} = renderDocument(markdown, work, 'guide', language);
    assert.match(html, /<h1 id="doc-013--art-deco">008 · Art Deco<\/h1>/);
    assert.match(html, language === 'zh' ? /风格 008 \/ 装饰艺术/ : /Style 008 \/ Art Deco/);
    assert.match(html, /href="#doc-013--art-deco"/);
    assert.match(html, /href="https:\/\/github.com\/guanmo-ai\/design-style\/blob\/main\/styles\/013-art-deco\/video\/ArtDeco.tsx"/);
    assert.match(html, /<code>styles\/013-art-deco<\/code>/);
  }
  const layout = {...work, id:'07-example', type:'layout', number:'03'};
  assert.match(renderDocument('# 07 · Example', layout, 'guide').html, /<h1 id="doc-07--example">03 · Example<\/h1>/);
  assert.match(renderDocument('# 布局 07 · Example', layout, 'guide').html, /<h1 id="doc-布局-07--example">布局 03 · Example<\/h1>/);
  assert.match(renderDocument('# Layout 07 · Example', layout, 'guide', 'en').html, /<h1 id="doc-layout-07--example">Layout 03 · Example<\/h1>/);
  assert.match(renderDocument('# 1925 · Art Deco', work, 'guide').html, /<h1 id="doc-1925--art-deco">1925 · Art Deco<\/h1>/);
});

test('文档渲染移除脚本与危险 URL，同时保留安全链接', () => {
  const work = {id:'001-bauhaus', number:'001', title:'包豪斯', titleEn:'Bauhaus', release:'day-01'};
  const result = renderDocument('# 标题\n\n<script>alert(1)</script>\n\n<a href="javascript:alert(1)" onclick="alert(1)">危险链接</a>\n\n[官方](https://example.com/)\n\n## 相同标题\n\n## 相同标题', work, 'guide');
  assert.doesNotMatch(result.html, /alert\(1\)|onclick|javascript:/);
  assert.deepEqual([...result.html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(match => match[0]), ['<script type="module" src="../../assets/reader.mjs"></script>']);
  assert.match(result.html, /href="https:\/\/example.com\/" target="_blank" rel="noopener noreferrer"/);
  assert.deepEqual(result.headings.map(heading => heading.id), ['doc-相同标题','doc-相同标题-1']);
  assert.throws(() => renderDocument('![外部图片](https://example.com/image.png)', work, 'guide'), /本期本地素材/);
  assert.throws(() => renderDocument('![越界图片](../../private.png)', work, 'guide'), /本期本地素材/);
});
