import test from 'node:test';
import assert from 'node:assert/strict';
import {renderLanguageToggle} from '../../gallery/assets/language-toggle.mjs';

test('中文页面只提供一个直接切换英文的动作，英文页面直接切回中文', () => {
  const zh = renderLanguageToggle({language:'zh'});
  assert.equal([...zh.matchAll(/<button\b/g)].length, 1);
  assert.match(zh, /<button(?=[^>]*class="language-trigger")(?=[^>]*data-language="en")[^>]*>/);
  assert.match(zh, /<span>English<\/span>/);
  assert.doesNotMatch(zh, /aria-haspopup|role="menu/);
  const en = renderLanguageToggle({language:'en'});
  assert.match(en, /<button(?=[^>]*class="language-trigger")(?=[^>]*data-language="zh")[^>]*>/);
  assert.match(en, /<span>中文<\/span>/);
  assert.throws(() => renderLanguageToggle({language:'xx'}), /语言/);
});

test('阅读页语言入口直接链接到另一语言，保留并转义浏览状态', () => {
  const html = renderLanguageToggle({language:'en', id:'reader-language', assetBase:'../../assets/', hrefs:{zh:'guide.html?lang=zh&q=red%26black', en:'guide.en.html?lang=en'}});
  assert.equal([...html.matchAll(/<a\b/g)].length, 1);
  assert.match(html, /href="guide.html\?lang=zh&amp;q=red%26black"/);
  assert.match(html, /src="..\/..\/assets\/icons\/globe.svg"/);
  assert.match(html, /data-reader-language="zh"/);
  assert.match(html, /hreflang="zh-CN"/);
});
