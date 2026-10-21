export const REPO = 'https://github.com/guanmo-ai/design-style';
// 两个系列统一展示，类型用于卡片标签与筛选。
export const TYPES = {
  style: {name: '设计风格', dir: 'styles', id: /^\d{3}-[a-z0-9-]+$/, guide: '风格指南', images: '风格图解', label: number => `风格 ${number}`},
  layout: {name: '布局方式', dir: 'layouts', id: /^\d{2}-[a-z0-9-]+$/, guide: '布局指南', images: '布局图解', label: number => `布局 ${number}`}
};
export const typeOf = work => Object.hasOwn(TYPES, work.type ?? 'style') ? (work.type ?? 'style') : 'style';
export const typeInfo = work => TYPES[typeOf(work)];
export const workDir = work => `${typeInfo(work).dir}/${work.id}`;
export const workLabel = work => typeInfo(work).label(work.number);
export const sourceUrl = (work, file = '') => `${REPO}/${/\.[a-z0-9]+$/i.test(file) ? 'blob' : 'tree'}/main/${workDir(work)}/${file}`;
export const releaseUrl = work => `${REPO}/releases/tag/${work.release}`;
export const videoUrl = work => `./media/${work.asset}`;
export const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function selectWorks(works, {query = '', type = 'all', category = 'all', sort = 'latest'} = {}) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return works.filter(work => (type === 'all' || typeOf(work) === type) && (category === 'all' || work.category === category) &&
    terms.every(term => [work.title, work.titleEn, work.description, typeInfo(work).name, ...work.tags].join(' ').toLocaleLowerCase().includes(term)))
    .sort((a, b) => (sort === 'oldest' ? 1 : -1) * (a.publishedAt.localeCompare(b.publishedAt) || a.id.localeCompare(b.id)));
}
export function readState(url) {
  const params = new URL(url).searchParams;
  const type = params.get('type');
  return {query: params.get('q') || '', type: Object.hasOwn(TYPES, type ?? '') ? type : 'all', category: params.get('category') || 'all', sort: params.get('sort') === 'oldest' ? 'oldest' : 'latest'};
}
