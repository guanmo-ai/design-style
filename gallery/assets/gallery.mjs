import {REPO, TYPES, typeOf, typeInfo, workDir, workLabel, sourceUrl, releaseUrl, videoUrl, formatTime, escapeHtml as h, selectWorks, readState} from './model.mjs';

const $ = selector => document.querySelector(selector);
const viewer = $('#viewer');
const imageViewer = $('#image-viewer');
let works = [];
let state = readState(location.href);
let opener;
const external = (url, label) => `<a href="${h(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
const imagePath = (work, image) => `./${workDir(work)}/images/preview/${image.file}.svg`;
const coverPath = work => `./${workDir(work)}/video/cover.jpg`;
const links = work => [
  `<a href="./read/${h(work.id)}/guide.html">${typeInfo(work).guide}</a>`,
  `<a href="./read/${h(work.id)}/process.html">制作过程</a>`,
  external(sourceUrl(work, 'video'), '源代码 ↗')
].join('');

function updateUrl() {
  const url = new URL(location.href);
  for (const [key, value] of [['q', state.query], ['type', state.type === 'all' ? '' : state.type], ['category', state.category === 'all' ? '' : state.category], ['sort', state.sort === 'latest' ? '' : state.sort]]) {
    if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
  }
  history.replaceState(null, '', url);
}

function render() {
  // 第一组：类型（全部 / 风格 / 布局）；第二组：当前类型下的分类，再点一次取消
  const types = ['all', ...Object.keys(TYPES).filter(type => works.some(work => typeOf(work) === type))];
  $('#types').innerHTML = types.map(type =>
    `<button type="button" class="category" data-type="${h(type)}" aria-pressed="${state.type === type}">${type === 'all' ? '全部' : TYPES[type].name}<span>${type === 'all' ? works.length : works.filter(work => typeOf(work) === type).length}</span></button>`
  ).join('');
  const pool = works.filter(work => state.type === 'all' || typeOf(work) === state.type);
  const categories = [...new Set(pool.map(work => work.category))];
  $('#categories').hidden = categories.length < 2 && state.category === 'all';
  $('#categories').innerHTML = categories.map(category =>
    `<button type="button" class="category" data-category="${h(category)}" aria-pressed="${state.category === category}">${h(category)}<span>${pool.filter(work => work.category === category).length}</span></button>`
  ).join('');
  const selected = selectWorks(works, state);
  $('#total-count').textContent = String(works.length).padStart(2, '0');
  $('#result-count').textContent = `共 ${works.length} 期，显示 ${selected.length} 期`;
  $('#empty').hidden = selected.length !== 0;
  $('#works').innerHTML = selected.map(work => `
    <article class="work-card">
      <button type="button" class="card-open" data-play="${h(work.id)}" aria-label="查看 ${h(work.title)} ${h(work.titleEn)}">
        <span class="cover-button">
          <img src="${h(coverPath(work))}" alt="${h(work.title)}短片封面" width="${work.width}" height="${work.height}">
          ${typeOf(work) === 'style' ? '' : `<span class="card-type">${typeInfo(work).name}</span>`}<span class="card-play" aria-hidden="true">▶</span><span class="duration">${formatTime(work.duration)}</span>
        </span>
        <span class="card-title">${h(work.title)} <span>${h(work.titleEn)}</span></span>
        <span class="card-meta">${h(workLabel(work))} · ${h(work.category)} · ${h(work.years)}</span>
      </button>
    </article>`).join('');
}

function renderImages(work) {
  return `<section class="resources" aria-labelledby="resources-title">
    <div class="section-heading"><h2 id="resources-title">${typeInfo(work).images}</h2><p class="section-note">可放大查看与下载 SVG</p></div>
    <div class="image-grid">${work.images.map((image, index) => `
      <article class="image-card"><button class="image-open" type="button" data-image="${index}" data-work="${h(work.id)}" aria-label="放大查看：${h(image.title)}">
        <div class="image-wrap"><img src="${imagePath(work, image)}" alt="${h(work.title)} · ${h(image.kind)}" width="1080" height="1350" loading="lazy"></div>
        <p class="image-kind">${h(image.kind)} / 0${index + 1}</p><h3 class="image-title">${h(image.title)}</h3>
      </button><div class="image-bottom"><span>1080 × 1350 · SVG</span>${external(sourceUrl(work, `images/${image.file}.svg`), '源文件 ↗')}</div></article>`).join('')}</div>
  </section>`;

}

function showDialog(trigger) {
  opener = trigger || document.activeElement;
  if (!viewer.open) viewer.showModal();
  viewer.scrollTop = 0;
}

function showWork(work, trigger) {
  $('#viewer-label').textContent = `${workLabel(work)} / DESIGN STYLE`;
  $('#viewer-content').innerHTML = `
    <video class="player" controls playsinline preload="metadata" poster="${h(coverPath(work))}" src="${videoUrl(work)}"></video>
    <p class="player-error" hidden>暂时无法加载视频。可以${external(releaseUrl(work), '前往本仓库 Release 观看或下载 ↗')}。</p>
    <div class="viewer-details"><div><h2 id="viewer-title">${h(work.title)} · ${h(work.titleEn)}</h2><p>${h(work.description)}</p></div></div>
    <div class="work-links" style="margin-top:20px">${links(work)}</div>
    ${renderImages(work)}`;
  const player = $('.player');
  player.addEventListener('error', () => { $('.player-error').hidden = false; });
  const url = new URL(location.href);
  url.hash = `work-${work.id}`;
  history.replaceState(null, '', url);
  showDialog(trigger);
  // Only an explicit click starts playback; deep links open paused.
  if (trigger) player.play().catch(() => {});
}

function showImage(work, index) {
  const image = work.images[index];
  $('.player')?.pause();
  $('#image-viewer-label').textContent = `${typeInfo(work).name}图预览`;
  $('#image-viewer-content').innerHTML = `<img class="art-preview" src="${imagePath(work, image)}" alt="${h(image.title)}">
    <div class="viewer-details"><div><h2 id="image-viewer-title">${h(image.title)}</h2><p>${h(work.title)} · 1080 × 1350 · 可编辑 SVG</p></div><div class="viewer-actions"><a class="button" href="${imagePath(work, image)}" download="${work.id}-${image.file}.svg">下载 SVG ↓</a>${external(sourceUrl(work, `images/${image.file}.svg`), '查看源文件 ↗')}</div></div>`;
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
viewer.addEventListener('click', event => {
  const rect = viewer.getBoundingClientRect();
  if (event.target === viewer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) viewer.close();
});
viewer.addEventListener('close', () => {
  $('.player')?.pause();
  $('#viewer-content').replaceChildren();
  const url = new URL(location.href); url.hash = ''; history.replaceState(null, '', url);
  if (opener?.isConnected) opener.focus();
});
$('#types').addEventListener('click', event => {
  const button = event.target.closest('[data-type]');
  if (!button) return;
  state.type = button.dataset.type;
  if (!works.some(work => (state.type === 'all' || typeOf(work) === state.type) && work.category === state.category)) state.category = 'all';
  updateUrl(); render();
  [...document.querySelectorAll('[data-type]')].find(item => item.dataset.type === state.type)?.focus();
});
$('#categories').addEventListener('click', event => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  const category = button.dataset.category;
  state.category = state.category === category ? 'all' : category; updateUrl(); render();
  [...document.querySelectorAll('[data-category]')].find(item => item.dataset.category === category)?.focus();
});
$('#search').addEventListener('input', event => { state.query = event.target.value; updateUrl(); render(); });
$('#sort').addEventListener('change', event => { state.sort = event.target.value; updateUrl(); render(); });
$('#reset').addEventListener('click', () => {
  state = {query: '', type: 'all', category: 'all', sort: 'latest'};
  $('#search').value = ''; $('#sort').value = 'latest'; updateUrl(); render(); $('#search').focus();
});
$('#works').addEventListener('click', event => {
  const button = event.target.closest('[data-play]');
  if (button) showWork(works.find(work => work.id === button.dataset.play), button);
});
$('#viewer-content').addEventListener('click', event => {
  const button = event.target.closest('[data-image]');
  if (button) showImage(works.find(work => work.id === button.dataset.work), Number(button.dataset.image));
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !viewer.open && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault(); $('#search').focus();
  }
});
function restoreNavigation() {
  state = readState(location.href);
  if (state.type !== 'all' && !works.some(work => typeOf(work) === state.type)) state.type = 'all';
  if (!works.some(work => (state.type === 'all' || typeOf(work) === state.type) && work.category === state.category)) state.category = 'all';
  $('#search').value = state.query; $('#sort').value = state.sort;
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
  $('#loading').innerHTML = `作品暂时未能载入，请刷新重试，或${external(REPO, '到 GitHub 浏览作品 ↗')}。`;
}
