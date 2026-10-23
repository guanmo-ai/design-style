import test from 'node:test';
import assert from 'node:assert/strict';
import {renderLanguageMenu, menuPosition} from '../../gallery/assets/language-menu.mjs';

test('语言入口明确标注当前语言，菜单只有一个选中项，保留阅读页原生链接', () => {
  const html = renderLanguageMenu({language:'en', id:'reader-language', assetBase:'../../assets/', hrefs:{zh:'guide.html?lang=zh&q=red%26black', en:'guide.en.html?lang=en'}});
  assert.match(html, /aria-haspopup="menu"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="reader-language-options"/);
  assert.match(html, /English<\/span>/);
  assert.equal([...html.matchAll(/aria-checked="true"/g)].length, 1);
  assert.equal([...html.matchAll(/role="menuitemradio"/g)].length, 2);
  assert.match(html, /href="guide.html\?lang=zh&amp;q=red%26black"/);
  assert.match(html, /src="..\/..\/assets\/icons\/globe.svg"/);
  assert.throws(() => renderLanguageMenu({language:'xx', id:'test'}), /语言/);
});

test('窄屏和视口底部的语言菜单不会越界，空间不足时向上展开', () => {
  const panel = {width:224,height:170};
  const viewport = {width:320,height:600};
  const right = menuPosition({left:250,right:306,top:12,bottom:56}, panel, viewport);
  assert.ok(right.left >= 12 && right.left + panel.width <= 308);
  assert.equal(right.top, 66);
  const bottom = menuPosition({left:120,right:210,top:530,bottom:574}, panel, viewport);
  assert.equal(bottom.top, 350);
  assert.ok(bottom.top + panel.height < 530);
  const left = menuPosition({left:0,right:44,top:12,bottom:56},panel,viewport);
  assert.equal(left.left, 12);
});
