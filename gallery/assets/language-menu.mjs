import {escapeHtml as h} from './model.mjs';
import {text} from './i18n.mjs';

export function renderLanguageMenu({language = 'zh', id = 'site-language', assetBase = './assets/', hrefs} = {}) {
  if (!['zh','en'].includes(language)) throw new Error('语言无效');
  if (!/^[a-z][a-z0-9-]*$/i.test(id)) throw new Error('语言菜单 ID 无效');
  const icon = (name, className) => `<img class="${className}" src="${h(assetBase)}icons/${name}.svg" width="20" height="20" alt="" aria-hidden="true">`;
  const options = [
    {value:'zh', label:'简体中文', detail:'Simplified Chinese', lang:'zh-CN'},
    {value:'en', label:'English', detail:'英语', lang:'en'}
  ].map(option => {
    const isLink = Boolean(hrefs);
    const attributes = isLink ? `href="${h(hrefs[option.value])}" data-context data-reader-language="${option.value}" hreflang="${option.lang}"` : `type="button" data-language="${option.value}"`;
    const tag = isLink ? 'a' : 'button';
    return `<${tag} class="language-option" ${attributes} role="menuitemradio" aria-checked="${option.value === language}" aria-label="${option.label}" lang="${option.lang}" tabindex="-1"><span class="language-option-label"><span>${option.label}</span><small lang="${option.value === 'zh' ? 'en' : 'zh-CN'}">${option.detail}</small></span>${icon('check','language-check')}</${tag}>`;
  }).join('');
  return `<div class="language-menu" id="${id}"><button class="language-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="${id}-options" aria-label="${text(language,'chooseLanguage')}">${icon('globe','language-globe')}<span>${language === 'zh' ? '中文' : 'English'}</span>${icon('chevron-down','language-chevron')}</button><div class="language-panel" id="${id}-options" role="menu" aria-label="${text(language,'language')}" popover="manual" hidden><p class="language-menu-heading" aria-hidden="true">${text(language,'chooseLanguage')}</p>${options}</div></div>`;
}

export function menuPosition(trigger, panel, viewport) {
  const inset = 12;
  const left = Math.max(inset, Math.min(trigger.right - panel.width, viewport.width - panel.width - inset));
  const below = trigger.bottom + 10;
  const top = below + panel.height <= viewport.height - inset ? below : Math.max(inset, trigger.top - panel.height - 10);
  return {left, top};
}

let active;
let listening = false;
export function closeLanguageMenus(restoreFocus = false) {
  if (!active) return;
  const {trigger, panel} = active;
  active = undefined;
  if (typeof panel.hidePopover === 'function' && panel.matches(':popover-open')) panel.hidePopover();
  panel.hidden = true;
  trigger.setAttribute('aria-expanded','false');
  if (restoreFocus && trigger.isConnected) trigger.focus();
}

function placeMenu(trigger, panel) {
  const position = menuPosition(trigger.getBoundingClientRect(), panel.getBoundingClientRect(), {width:document.documentElement.clientWidth, height:innerHeight});
  panel.style.left = `${position.left}px`;
  panel.style.top = `${position.top}px`;
}

function openMenu(menu, focus = 'selected') {
  closeLanguageMenus();
  const trigger = menu.querySelector('.language-trigger');
  const panel = menu.querySelector('.language-panel');
  panel.hidden = false;
  if (typeof panel.showPopover === 'function') panel.showPopover();
  placeMenu(trigger, panel);
  trigger.setAttribute('aria-expanded','true');
  active = {menu, trigger, panel};
  const options = [...panel.querySelectorAll('[role="menuitemradio"]')];
  (focus === 'first' ? options[0] : focus === 'last' ? options.at(-1) : options.find(option => option.getAttribute('aria-checked') === 'true')).focus();
}

export function mountLanguageMenus(root = document) {
  for (const menu of root.querySelectorAll('.language-menu:not([data-ready])')) {
    menu.dataset.ready = 'true';
    const trigger = menu.querySelector('.language-trigger');
    trigger.addEventListener('click', () => active?.menu === menu ? closeLanguageMenus(true) : openMenu(menu));
    trigger.addEventListener('keydown', event => {
      if (!['ArrowDown','ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      openMenu(menu, event.key === 'ArrowDown' ? 'first' : 'last');
    });
    menu.querySelector('.language-panel').addEventListener('click', event => {
      if (event.target.closest('[role="menuitemradio"]')) closeLanguageMenus();
    });
  }
  if (active) placeMenu(active.trigger, active.panel);
  if (listening) return;
  listening = true;
  document.addEventListener('pointerdown', event => {
    if (active && !active.menu.contains(event.target)) closeLanguageMenus();
  });
  document.addEventListener('focusin', event => {
    if (active && !active.menu.contains(event.target)) closeLanguageMenus();
  });
  document.addEventListener('keydown', event => {
    if (!active) return;
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation(); closeLanguageMenus(true); return;
    }
    if (event.key === 'Tab') { closeLanguageMenus(true); return; }
    if (['Enter',' '].includes(event.key) && document.activeElement.matches('[role="menuitemradio"]')) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (!event.repeat) document.activeElement.click();
      return;
    }
    if (!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const options = [...active.panel.querySelectorAll('[role="menuitemradio"]')];
    const index = options.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : event.key === 'ArrowDown' ? (index + 1) % options.length : event.key === 'ArrowUp' ? (index - 1 + options.length) % options.length : index;
    options[next]?.focus();
  }, true);
  addEventListener('resize', () => closeLanguageMenus(true));
  addEventListener('scroll', event => {
    if (active && !active.panel.contains(event.target)) closeLanguageMenus();
  }, true);
}
