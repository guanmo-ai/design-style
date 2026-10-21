import {Marked} from 'marked';
import sanitizeHtml from 'sanitize-html';
import {escapeHtml as h, REPO, sourceUrl, typeInfo, workDir, workLabel} from './assets/model.mjs';

const DOCUMENTS = {guide: {file: 'README.md'}, process: {file: 'PROCESS.md', title: '制作过程'}};
export function renderDocument(markdown, work, kind) {
  if (!DOCUMENTS[kind]) throw new Error('未知文档类型');
  // 风格叫「风格指南」，布局叫「布局指南」
  const documents = {guide: {...DOCUMENTS.guide, title: typeInfo(work).guide}, process: DOCUMENTS.process};
  const assets = new Set();
  const headings = [];
  const ids = new Map();
  const parser = new Marked({gfm: true, renderer: {
    heading({tokens, depth}) {
      const text = this.parser.parseInline(tokens);
      const label = sanitizeHtml(text, {allowedTags: [], allowedAttributes: {}});
      const slug = label.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
      const count = ids.get(slug) || 0;
      ids.set(slug, count + 1);
      const id = `doc-${slug}${count ? `-${count}` : ''}`;
      if (depth === 2) headings.push({id, label});
      return `<h${depth} id="${h(id)}">${text}</h${depth}>`;
    }
  }});
  function rewrite(value, image = false) {
    if (!value) return '';
    const base = `${REPO}/blob/main/${workDir(work)}/`;
    let url;
    try {url = new URL(value, base);} catch {return '';}
    if (!['https:', 'http:'].includes(url.protocol)) return '';
    if (value.startsWith('#')) return `#doc-${value.slice(1)}`;
    if (url.href.startsWith(base)) {
      let relative;
      try {relative = decodeURIComponent(url.pathname.slice(new URL(base).pathname.length));} catch {return '';}
      const docKind = Object.keys(documents).find(key => documents[key].file === relative);
      if (docKind && !image) {
        let fragment = '';
        try {fragment = decodeURIComponent(url.hash.slice(1));} catch { /* Ignore malformed anchors. */ }
        return `${docKind}.html${fragment ? `#doc-${fragment}` : ''}`;
      }
      if (image) {
        if (!/^(?:images\/preview\/[\w-]+\.svg|video\/cover\.jpg|process\/[\w.-]+\.(?:jpg|png|webp))$/.test(relative)) throw new Error(`文档图片不在允许的本期目录中：${value}`);
        assets.add(relative);
        return `../../${workDir(work)}/${relative}`;
      }
      return sourceUrl(work, relative) + url.hash;
    }
    if (image) throw new Error(`文档图片必须来自本期本地素材：${value}`);
    return url.href;
  }
  const body = sanitizeHtml(parser.parse(markdown), {
    allowedTags: ['h1','h2','h3','h4','h5','h6','p','a','img','strong','em','del','code','pre','blockquote','ul','ol','li','table','thead','tbody','tr','th','td','hr','br','input'],
    allowedAttributes: {a:['href','target','rel'],img:['src','alt','width','height','loading'],h1:['id'],h2:['id'],h3:['id'],h4:['id'],h5:['id'],h6:['id'],ol:['start'],input:['type','checked','disabled'],code:['class']},
    allowedSchemes: ['https', 'http'],
    transformTags: {
      a(tagName, attrs) {
        const href = rewrite(attrs.href);
        return {tagName, attribs: href ? {href, ...(/^https?:/.test(href) ? {target: '_blank', rel: 'noopener noreferrer'} : {})} : {}};
      },
      img(tagName, attrs) {
        // Load document images before anchor navigation settles to avoid layout shifts.
        return {tagName, attribs: {src: rewrite(attrs.src, true), alt: attrs.alt || '', loading: 'eager', ...( /^\d+$/.test(attrs.width) ? {width: attrs.width} : {})}};
      },
      input(tagName, attrs) {
        return {tagName, attribs: {type: 'checkbox', disabled: '', ...('checked' in attrs ? {checked: ''} : {})}};
      }
    }
  }).replace(/<table>/g, '<div class="table-scroll" tabindex="0" role="region" aria-label="可横向滚动的表格"><table>').replace(/<\/table>/g, '</table></div>');
  const label = documents[kind].title;
  const tabs = Object.entries(documents).map(([key, doc]) => `<a href="${key}.html"${kind === key ? ' aria-current="page"' : ''}>${doc.title}</a>`).join('');
  const contents = headings.map(heading => `<a href="#${h(heading.id)}">${heading.label}</a>`).join('');
  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${h(work.title)} · ${label} — Design Style</title><meta name="description" content="${h(work.title)}的${label}，来自 Design Style 仓库原文。"><link rel="icon" href="../../assets/mark.svg"><link rel="stylesheet" href="../../assets/gallery.css"><link rel="stylesheet" href="../../assets/reader.css"></head>
<body class="reader-page"><a class="skip-link" href="#article">跳到正文</a><div class="reader-shell">
  <header class="reader-header"><a class="brand" href="../../" aria-label="Design Style 首页"><img src="../../assets/mark.svg" width="28" height="28" alt=""><span>Design<span class="brand-dot">.</span>style</span></a><a class="return-work" href="../../#work-${h(work.id)}">← 返回作品</a></header>
  <div class="reader-bar"><p>${h(workLabel(work))} / ${h(work.title)} · ${h(work.titleEn)}</p><nav aria-label="作品文档">${tabs}</nav></div>
  <details class="mobile-contents"><summary>本页目录</summary><nav aria-label="本页目录">${contents}</nav></details>
  <div class="reading-layout"><aside class="reader-contents"><p>本页目录</p><nav aria-label="章节目录">${contents}</nav></aside><main id="article" class="prose">${body}</main></div>
  <footer><a href="../../#work-${h(work.id)}">← 返回${h(work.title)}作品</a><a href="${sourceUrl(work, documents[kind].file)}" target="_blank" rel="noopener noreferrer">查看仓库原文 ↗</a></footer>
</div></body></html>`;
  return {html, assets: [...assets], headings};
}
