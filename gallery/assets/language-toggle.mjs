import {escapeHtml as h} from './model.mjs';

export function renderLanguageToggle({language = 'zh', id = 'site-language', assetBase = './assets/', hrefs} = {}) {
  if (!['zh','en'].includes(language)) throw new Error('语言无效');
  if (!/^[a-z][a-z0-9-]*$/i.test(id)) throw new Error('语言入口 ID 无效');
  const target = language === 'zh' ? 'en' : 'zh';
  const lang = target === 'en' ? 'en' : 'zh-CN';
  const label = target === 'en' ? 'Switch to English' : '切换为中文';
  const attributes = hrefs
    ? `href="${h(hrefs[target])}" data-context data-reader-language="${target}" hreflang="${lang}"`
    : `type="button" data-language="${target}"`;
  const tag = hrefs ? 'a' : 'button';
  return `<div class="language-control" id="${id}"><${tag} class="language-trigger" ${attributes} lang="${lang}" aria-label="${label}" title="${label}"><img class="language-globe" src="${h(assetBase)}icons/globe.svg" width="20" height="20" alt="" aria-hidden="true"><span>${target === 'en' ? 'English' : '中文'}</span></${tag}></div>`;
}
