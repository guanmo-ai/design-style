import {Marked} from 'marked';
import sanitizeHtml from 'sanitize-html';
import {escapeHtml as h, REPO, sourceUrl, workDir} from './assets/model.mjs';
import {text, content} from './assets/i18n.mjs';
import {renderLanguageMenu} from './assets/language-menu.mjs';

const DOCUMENTS = {guide: {file: 'README.md'}, process: {file: 'PROCESS.md'}};
export const DOCUMENT_PAGES = Object.entries(DOCUMENTS).flatMap(([kind, {file}]) => ['zh','en'].map(language => ({kind, language, file:language === 'en' ? file.replace('.md','.en.md') : file, slug:`${kind}${language === 'en' ? '.en' : ''}`})));
export function renderDocument(markdown, work, kind, language = 'zh') {
  if (!DOCUMENTS[kind]) throw new Error('未知文档类型');
  if (!['zh','en'].includes(language)) throw new Error('语言无效');
  const t = (key, values) => text(language, key, values);
  const title = content(work, 'title', language);
  const back = `../../${language === 'en' ? '?lang=en' : ''}#work-${h(work.id)}`;
  // 风格叫「风格指南」，布局叫「布局指南」
  const documents = {guide: {title:t(work.type === 'layout' ? 'layoutGuide' : 'styleGuide')}, process: {title:t('process')}};
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
    if (!image && kind === 'guide' && url.href === `${REPO}/releases/tag/${work.release}`) return back;
    if (value.startsWith('#')) return `#doc-${value.slice(1)}`;
    if (url.href.startsWith(base)) {
      let relative;
      try {relative = decodeURIComponent(url.pathname.slice(new URL(base).pathname.length));} catch {return '';}
      const page = DOCUMENT_PAGES.find(page => page.file === relative);
      if (page && !image) {
        let fragment = '';
        try {fragment = decodeURIComponent(url.hash.slice(1));} catch { /* Ignore malformed anchors. */ }
        return `${page.slug}.html${fragment ? `#doc-${fragment}` : ''}`;
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
  }).replace(/<table>/g, `<div class="table-scroll" tabindex="0" role="region" aria-label="${t('table')}"><table>`).replace(/<\/table>/g, '</table></div>');
  const label = documents[kind].title;
  const tabs = Object.entries(documents).map(([key, doc]) => `<a data-context href="${key}${language === 'en' ? '.en' : ''}.html"${kind === key ? ' aria-current="page"' : ''}>${doc.title}</a>`).join('');
  const contents = headings.map(heading => `<a href="#${h(heading.id)}">${heading.label}</a>`).join('');
  const languageControl = renderLanguageMenu({language,id:'reader-language',assetBase:'../../assets/',hrefs:{zh:`${kind}.html`,en:`${kind}.en.html`}});
  const sourceFile = DOCUMENT_PAGES.find(page => page.kind === kind && page.language === language).file;
  const html = `<!doctype html>
<html lang="${language === 'zh' ? 'zh-CN' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${h(title)} · ${label} — Design Style</title><meta name="description" content="${h(title)} · ${label} — Design Style"><link rel="icon" href="../../assets/mark.svg"><link rel="stylesheet" href="../../assets/gallery.css"><link rel="stylesheet" href="../../assets/reader.css"><script type="module" src="../../assets/reader.mjs"></script></head>
<body class="reader-page"><a class="skip-link" href="#article">${t('skipArticle')}</a><div class="reader-shell">
  <header class="reader-header"><a data-context class="brand" href="../../${language === 'en' ? '?lang=en' : ''}" aria-label="${t('home')}"><img src="../../assets/mark.svg" width="28" height="28" alt=""><span>Design<span class="brand-dot">.</span>style</span></a><div class="reader-tools">${languageControl}<a data-context class="return-work" href="${back}">${t('back')}</a></div></header>
  <div class="reader-bar"><p>${h(t(work.type === 'layout' ? 'layoutLabel' : 'styleLabel', {number:work.number}))} / ${h(title)}${language === 'zh' ? ` · ${h(work.titleEn)}` : ''}</p><nav aria-label="${t('documents')}">${tabs}</nav></div>
  <details class="mobile-contents"><summary>${t('contents')}</summary><nav aria-label="${t('contents')}">${contents}</nav></details>
  <div class="reading-layout"><aside class="reader-contents"><p>${t('contents')}</p><nav aria-label="${t('chapters')}">${contents}</nav></aside><main id="article" class="prose">${body}</main></div>
  <footer><a data-context href="${back}">${t('back')}</a><a href="${sourceUrl(work, sourceFile)}" target="_blank" rel="noopener noreferrer">${t('original')}</a></footer>
</div></body></html>`;
  return {html, assets: [...assets], headings};
}
