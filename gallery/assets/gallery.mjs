import {REPO, TYPES, typeOf, workDir, sourceUrl, releaseUrl, videoUrl, formatTime, escapeHtml as h, selectWorks, adjacentWork, readState} from './model.mjs';
import {resolveLanguage, languageUrl, text, content, documentHref} from './i18n.mjs';
import {renderLanguageToggle} from './language-toggle.mjs';

const $ = selector => document.querySelector(selector);
const viewer = $('#viewer');
const imageViewer = $('#image-viewer');
let works = [];
let state = readState(location.href);
let opener;
let currentWorkId;
let catalogFailed = false;
let language = resolveLanguage(location.href);
const t = (key, values) => text(language, key, values);
const title = work => content(work, 'title', language);
const workTypeText = (work, suffix = '') => t(`${typeOf(work)}${suffix}`);
const label = work => t(`${typeOf(work)}Label`, {number:work.number});
const external = (url, label) => `<a href="${h(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
const imagePath = (work, image) => `./${workDir(work)}/images/preview/${image.file}.svg`;
const coverPath = work => `./${workDir(work)}/video/cover.jpg`;
const links = work => [
  `<a href="${h(documentHref(work, 'guide', language, state))}">${workTypeText(work, 'Guide')}</a>`,
  `<a href="${h(documentHref(work, 'process', language, state))}">${t('process')}</a>`,
  external(sourceUrl(work, 'video'), t('source'))
].join('');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let previewsEnabled = !reducedMotion.matches && !navigator.connection?.saveData;
const previews = new Map();
const previewObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    const preview = previews.get(entry.target);
    if (!preview) continue;
    preview.visible = entry.isIntersecting && entry.intersectionRatio >= 0.01;
    updatePreview(preview);
  }
}, {threshold:[0, 0.01]}) : null;

function previewAllowed(preview) {
  return preview.visible && previewsEnabled && !document.hidden && !viewer.open && !preview.failed;
}

function stopPreview(preview, release = false) {
  preview.video.pause();
  preview.video.hidden = true;
  preview.cover.classList.remove('preview-playing');
  if (release && preview.video.hasAttribute('src')) {
    preview.video.removeAttribute('src');
    preview.video.load();
  }
}

function updatePreview(preview) {
  if (!previewAllowed(preview)) {
    stopPreview(preview, !preview.visible || !previewsEnabled || preview.failed);
    return;
  }
  if (preview.pending || !preview.video.paused) return;
  if (!preview.video.hasAttribute('src')) preview.video.src = preview.url;
  preview.pending = true;
  let retry = false;
  preview.video.play().catch(error => {
    retry = error.name === 'AbortError';
    preview.video.hidden = true;
    preview.cover.classList.remove('preview-playing');
  }).finally(() => {
    preview.pending = false;
    if (retry && previews.get(preview.cover) === preview && previewAllowed(preview)) updatePreview(preview);
  });
}

function syncPreviews() {
  for (const preview of previews.values()) updatePreview(preview);
}

function renderPreviewControl() {
  const button = $('#toggle-previews');
  button.hidden = !previewObserver;
  button.textContent = t(previewsEnabled ? 'pausePreviews' : 'playPreviews');
  button.setAttribute('aria-pressed', String(previewsEnabled));
}

function addPreview(cover, work) {
  if (!previewObserver) return;
  const video = document.createElement('video');
  video.className = 'card-preview';
  video.muted = video.defaultMuted = video.loop = video.playsInline = true;
  video.preload = 'none';
  video.hidden = true;
  video.tabIndex = -1;
  video.setAttribute('aria-hidden', 'true');
  const preview = {cover, video, url:videoUrl(work), visible:false, failed:false, pending:false};
  video.addEventListener('playing', () => {
    if (previews.get(cover) !== preview || !previewAllowed(preview)) { stopPreview(preview); return; }
    video.hidden = false;
    cover.classList.add('preview-playing');
  });
  video.addEventListener('error', () => { preview.failed = true; stopPreview(preview, true); });
  cover.querySelector('img').after(video);
  previews.set(cover, preview);
  previewObserver.observe(cover);
}

$('#toggle-previews').addEventListener('click', () => {
  previewsEnabled = !previewsEnabled;
  renderPreviewControl();
  syncPreviews();
});
reducedMotion.addEventListener('change', () => {
  previewsEnabled = !reducedMotion.matches && !navigator.connection?.saveData;
  renderPreviewControl();
  syncPreviews();
});
document.addEventListener('visibilitychange', syncPreviews);
window.addEventListener('pagehide', () => { for (const preview of previews.values()) stopPreview(preview, true); });
window.addEventListener('pageshow', syncPreviews);

function applyLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = t('pageTitle');
  $('meta[name="description"]').content = t('description');
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const attribute of ['aria-label', 'placeholder']) {
    for (const node of document.querySelectorAll(`[data-i18n-${attribute}]`)) node.setAttribute(attribute, t(node.getAttribute(`data-i18n-${attribute}`)));
  }
  for (const node of document.querySelectorAll('[data-language-control]')) node.innerHTML = renderLanguageToggle({language, id:node.dataset.languageControl});
  renderPreviewControl();
  if (catalogFailed) $('#loading').innerHTML = t('loadError') + external(REPO, t('githubBrowse'));
}
applyLanguage();

function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set('lang', language);
  for (const [key, value] of [['q', state.query], ['type', state.type === 'all' ? '' : state.type], ['category', state.category === 'all' ? '' : state.category], ['sort', state.sort === 'latest' ? '' : state.sort]]) {
    if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
  }
  history.replaceState(null, '', url);
}

function render() {
  // 单一作品列表，使用标签筛选两个系列。
  const types = ['all', ...Object.keys(TYPES).filter(type => works.some(work => typeOf(work) === type))];
  $('#types').innerHTML = types.map(type =>
    `<button type="button" class="category" data-type="${h(type)}" aria-pressed="${state.type === type}">${t(type)}<span>${type === 'all' ? works.length : works.filter(work => typeOf(work) === type).length}</span></button>`
  ).join('');
  const selected = selectWorks(works, state);
  $('#total-count').textContent = String(works.length).padStart(2, '0');
  $('#result-count').textContent = t('resultCount', {total:works.length, count:selected.length});
  $('#empty').hidden = selected.length !== 0;
  previewObserver?.disconnect();
  for (const preview of previews.values()) stopPreview(preview, true);
  previews.clear();
  $('#works').innerHTML = selected.map(work => `
    <article class="work-card">
      <button type="button" class="card-open" data-play="${h(work.id)}" aria-label="${h(t('view', {title:language === 'zh' ? `${work.title} ${work.titleEn}` : title(work)}))}">
        <span class="cover-button">
          <img src="${h(coverPath(work))}" alt="${h(t('cover', {title:title(work)}))}" width="${work.width}" height="${work.height}">
          <span class="card-type">${workTypeText(work)}</span><span class="card-play" aria-hidden="true">▶</span><span class="duration">${formatTime(work.duration)}</span>
        </span>
        <span class="card-title">${h(title(work))}${language === 'zh' ? ` <span>${h(work.titleEn)}</span>` : ''}</span>
        <span class="card-meta">${h(label(work))} · ${h(content(work, 'category', language))} · ${h(work.years)}</span>
      </button>
    </article>`).join('');
  for (const button of document.querySelectorAll('#works [data-play]')) {
    addPreview(button.querySelector('.cover-button'), selected.find(work => work.id === button.dataset.play));
  }
  // Language changes replace cards; keep the dialog's original return target alive.
  if (opener?.dataset.play) opener = [...document.querySelectorAll('[data-play]')].find(node => node.dataset.play === opener.dataset.play);
}

function renderImages(work) {
  return `<section class="resources" aria-labelledby="resources-title">
    <div class="section-heading"><h2 id="resources-title">${workTypeText(work, 'Images')}</h2><p class="section-note">${t('imageHint')}</p></div>
    <div class="image-grid">${work.images.map((image, index) => `
      <article class="image-card"><button class="image-open" type="button" data-image="${index}" data-work="${h(work.id)}" aria-label="${h(t('zoom', {title:content(image, 'title', language)}))}">
        <div class="image-wrap"><img src="${imagePath(work, image)}" alt="${h(title(work))} · ${h(content(image, 'kind', language))}" width="1080" height="1350" loading="lazy"></div>
        <p class="image-kind">${h(content(image, 'kind', language))} / 0${index + 1}</p><h3 class="image-title">${h(content(image, 'title', language))}</h3>
      </button><div class="image-bottom"><span>1080 × 1350 · SVG</span>${external(sourceUrl(work, `images/${image.file}.svg`), t('sourceFile'))}</div></article>`).join('')}</div>
  </section>`;

}

function showDialog(trigger) {
  if (!viewer.open) {
    opener = trigger || document.activeElement;
    viewer.showModal();
    syncPreviews();
  }
  viewer.scrollTop = 0;
}

function renderWorkText(work) {
  const selected = selectWorks(works, state);
  const index = selected.findIndex(item => item.id === work.id);
  $('#viewer-position').textContent = `${index < 0 ? '—' : index + 1} / ${selected.length}`;
  $('#viewer-position').title = index < 0 ? t('outside') : '';
  for (const [selector, direction, key] of [['#previous-work', -1, 'previousTitle'], ['#next-work', 1, 'nextTitle']]) {
    const adjacent = adjacentWork(works, state, work.id, direction);
    $(selector).disabled = !adjacent;
    $(selector).title = adjacent ? t(key, {title:title(adjacent)}) : t('noOther');
  }
  $('#viewer-label').textContent = `${label(work)} / DESIGN STYLE`;
  $('.player-error').innerHTML = t('playbackError') + external(releaseUrl(work), t('release'));
  $('#viewer-content').innerHTML = `
    <div class="viewer-details"><div><h2 id="viewer-title">${h(title(work))}${language === 'zh' ? ` · ${h(work.titleEn)}` : ''}</h2><p>${h(content(work, 'description', language))}</p></div></div>
    <div class="work-links" style="margin-top:20px">${links(work)}<div data-language-control="viewer-language">${renderLanguageToggle({language,id:'viewer-language'})}</div></div>
    <p class="media-language-note">${t('mediaNote')}</p>
    ${renderImages(work)}`;
}

function showWork(work, trigger) {
  $('.player')?.pause();
  currentWorkId = work.id;
  $('#viewer-media').innerHTML = `<video class="player" controls playsinline preload="metadata" poster="${h(coverPath(work))}" src="${videoUrl(work)}"></video><p class="player-error" hidden></p>`;
  renderWorkText(work);
  const player = $('.player');
  const playerError = $('.player-error');
  player.addEventListener('error', () => { playerError.hidden = false; });
  const url = new URL(location.href);
  url.hash = `work-${work.id}`;
  url.searchParams.set('lang', language);
  history.replaceState(null, '', url);
  showDialog(trigger);
  // Only an explicit click starts playback; deep links open paused.
  if (trigger) player.play().catch(() => {});
}

function navigateWork(direction, trigger) {
  const work = adjacentWork(works, state, currentWorkId, direction);
  if (work) showWork(work, trigger);
}

function showImage(work, index) {
  const image = work.images[index];
  $('.player')?.pause();
  $('#image-viewer-label').textContent = t('imagePreview');
  $('#image-viewer-content').innerHTML = `<img class="art-preview" src="${imagePath(work, image)}" alt="${h(content(image, 'title', language))}">
    <div class="viewer-details"><div><h2 id="image-viewer-title">${h(content(image, 'title', language))}</h2><p>${h(title(work))} · 1080 × 1350 · ${t('editable')}</p></div><div class="viewer-actions"><a class="button" href="${imagePath(work, image)}" download="${work.id}-${image.file}.svg">${t('download')}</a>${external(sourceUrl(work, `images/${image.file}.svg`), t('viewSource'))}</div></div>`;
  imageViewer.showModal();
  imageViewer.scrollTop = 0;
}

$('#image-close').addEventListener('click', () => imageViewer.close());
imageViewer.addEventListener('close', () => $('#image-viewer-content').replaceChildren());
imageViewer.addEventListener('click', event => {
  const rect = imageViewer.getBoundingClientRect();
  if (event.target === imageViewer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) imageViewer.close();
});

$('#close').addEventListener('click', () => viewer.close());
$('#previous-work').addEventListener('click', event => navigateWork(-1, event.currentTarget));
$('#next-work').addEventListener('click', event => navigateWork(1, event.currentTarget));
viewer.addEventListener('click', event => {
  const rect = viewer.getBoundingClientRect();
  if (event.target === viewer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) viewer.close();
});
viewer.addEventListener('close', () => {
  $('.player')?.pause();
  $('#viewer-media').replaceChildren();
  $('#viewer-content').replaceChildren();
  currentWorkId = undefined;
  const url = new URL(location.href); url.hash = ''; history.replaceState(null, '', url);
  if (opener?.isConnected) opener.focus();
  syncPreviews();
});
$('#types').addEventListener('click', event => {
  const button = event.target.closest('[data-type]');
  if (!button) return;
  state.type = button.dataset.type;
  updateUrl(); render();
  [...document.querySelectorAll('[data-type]')].find(item => item.dataset.type === state.type)?.focus();
});
$('#search').addEventListener('input', event => { state.query = event.target.value; updateUrl(); render(); });
$('#reset').addEventListener('click', () => {
  state = {query: '', type: 'all', category: 'all', sort: 'latest'};
  $('#search').value = ''; updateUrl(); render(); $('#search').focus();
});
$('#works').addEventListener('click', event => {
  const button = event.target.closest('[data-play]');
  if (button) showWork(works.find(work => work.id === button.dataset.play), button);
});
$('#viewer-content').addEventListener('click', event => {
  const button = event.target.closest('[data-image]');
  if (button) showImage(works.find(work => work.id === button.dataset.work), Number(button.dataset.image));
});
document.addEventListener('click', event => {
  const button = event.target.closest('[data-language]');
  if (!button || !['zh','en'].includes(button.dataset.language)) return;
  const controlId = button.closest('.language-control').id;
  language = button.dataset.language;
  history.replaceState(null, '', languageUrl(location.href, language));
  applyLanguage();
  if (works.length) render();
  if (viewer.open) {
    renderWorkText(works.find(work => work.id === currentWorkId));
  }
  document.getElementById(controlId)?.querySelector('.language-trigger').focus();
});
document.addEventListener('keydown', event => {
  if (viewer.open && !imageViewer.open && ['ArrowLeft', 'ArrowRight'].includes(event.key) && !event.defaultPrevented && !event.isComposing && !event.target.closest('video, input, textarea, select, [contenteditable]') && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && !document.fullscreenElement && !document.pictureInPictureElement) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) navigateWork(event.key === 'ArrowLeft' ? -1 : 1, document.activeElement);
  }
  if (event.key === '/' && !viewer.open && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault(); $('#search').focus();
  }
}, true);
function restoreNavigation() {
  const nextLanguage = resolveLanguage(location.href);
  // Keep the language action focused when the catalog finishes loading.
  if (language !== nextLanguage) {
    language = nextLanguage;
    applyLanguage();
  }
  state = {...readState(location.href), category: 'all', sort: 'latest'};
  if (state.type !== 'all' && !works.some(work => typeOf(work) === state.type)) state.type = 'all';
  $('#search').value = state.query;
  updateUrl();
  render();
  const work = works.find(item => location.hash === `#work-${item.id}`);
  if (work) showWork(work);
  else if (viewer.open) viewer.close();
}
window.addEventListener('popstate', restoreNavigation);
window.addEventListener('hashchange', restoreNavigation);
try {
  const response = await fetch('./data/works.json');
  if (!response.ok) throw new Error('catalog');
  works = await response.json();
  $('#loading').hidden = true;
  restoreNavigation();
} catch {
  catalogFailed = true;
  $('#loading').innerHTML = t('loadError') + external(REPO, t('githubBrowse'));
}
