import {readState} from './model.mjs';
import {mountLanguageMenus} from './language-menu.mjs';

const language = document.documentElement.lang === 'en' ? 'en' : 'zh';
try {localStorage.setItem('design-style-language', language);} catch { /* Static links still carry the language. */ }
const state = readState(location.href);
// Keep the gallery's current search and series when changing document or language.
for (const link of document.querySelectorAll('a[data-context], .prose a[href]')) {
  const url = new URL(link.href);
  const isDocument = url.origin === location.origin && url.pathname.replace(/[^/]+$/, '') === location.pathname.replace(/[^/]+$/, '') && /\/(?:guide|process)(?:\.en)?\.html$/.test(url.pathname);
  const isGallery = url.origin === location.origin && url.pathname === new URL('../../', location.href).pathname && /^#work-[\w-]+$/.test(url.hash);
  if (!link.hasAttribute('data-context') && !isDocument && !isGallery) continue;
  url.searchParams.set('lang', link.dataset.readerLanguage || (isDocument ? (url.pathname.endsWith('.en.html') ? 'en' : 'zh') : language));
  if (state.query) url.searchParams.set('q', state.query);
  if (state.type !== 'all') url.searchParams.set('type', state.type);
  link.href = url.href;
}
mountLanguageMenus();
