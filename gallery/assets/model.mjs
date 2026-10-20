export const REPO = 'https://github.com/guanmo-ai/motion-style';
export const sourceUrl = (work, file = '') => `${REPO}/${/\.[a-z0-9]+$/i.test(file) ? 'blob' : 'tree'}/main/styles/${work.id}/${file}`;
export const releaseUrl = work => `${REPO}/releases/tag/${work.release}`;
export const videoUrl = work => `./media/${work.asset}`;
export const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function selectWorks(works, {query = '', category = 'all', sort = 'latest'} = {}) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return works.filter(work => (category === 'all' || work.category === category) &&
    terms.every(term => [work.title, work.titleEn, work.description, ...work.tags].join(' ').toLocaleLowerCase().includes(term)))
    .sort((a, b) => (sort === 'oldest' ? 1 : -1) * (a.publishedAt.localeCompare(b.publishedAt) || a.id.localeCompare(b.id)));
}
export function readState(url) {
  const params = new URL(url).searchParams;
  return {query: params.get('q') || '', category: params.get('category') || 'all', sort: params.get('sort') === 'oldest' ? 'oldest' : 'latest'};
}
