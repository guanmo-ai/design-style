export const messages = {
  zh: {
    pageTitle:'Design Style · 设计参考库', description:'用短片认识设计风格与布局方式，探索图解、设计规则、AI 提示词与完整源码。',
    home:'Design Style 首页', subtitle:'设计参考库', navigation:'网站导航', language:'语言 / Language', chooseLanguage:'选择语言', creator:'观默',
    skip:'跳到作品', collection:'全部作品', search:'搜索风格、布局、关键词', placeholder:'搜索作品或关键词', filters:'作品标签筛选',
    all:'全部', style:'设计风格', layout:'布局方式', resultCount:'共 {total} 期，显示 {count} 期',
    emptyTitle:'还没有找到相关作品', emptyHint:'试试「包豪斯」「便当盒」或其他关键词。', reset:'查看全部作品', loading:'正在载入短片…',
    loadError:'作品暂时未能载入，请刷新重试，或', githubBrowse:'到 GitHub 浏览作品 ↗',
    credit:'创作 · 视频与图片转载请注明出处', by:'由', openSource:'源码开放，灵感流动 ↗',
    view:'查看 {title}', cover:'{title}短片封面', styleLabel:'风格 {number}', layoutLabel:'布局 {number}',
    styleGuide:'风格指南', layoutGuide:'布局指南', process:'制作过程', source:'源代码 ↗',
    styleImages:'风格图解', layoutImages:'布局图解', imageHint:'可放大查看与下载 SVG', zoom:'放大查看：{title}', sourceFile:'源文件 ↗',
    previous:'← 上一条', next:'下一条 →', previousLabel:'上一条作品', nextLabel:'下一条作品', close:'关闭预览', closeImage:'关闭图片预览',
    outside:'不在当前筛选结果中', noOther:'当前列表没有其他影片', previousTitle:'上一条：{title}', nextTitle:'下一条：{title}',
    playbackError:'暂时无法加载视频。可以', release:'前往本仓库 Release 观看或下载 ↗',
    imagePreview:'图解预览', editable:'可编辑 SVG', download:'下载 SVG ↓', viewSource:'查看源文件 ↗',
    mediaNote:'视频与图解保留原版中文标注。', contents:'本页目录', chapters:'章节目录', documents:'作品文档',
    skipArticle:'跳到正文', back:'← 返回作品', original:'查看仓库原文 ↗', table:'可横向滚动的表格'
  },
  en: {
    pageTitle:'Design Style · Design references', description:'Explore design styles and layouts through short films, visual guides, practical rules, AI prompts, and editable source code.',
    home:'Design Style home', subtitle:'Design references', navigation:'Site navigation', language:'Language / 语言', chooseLanguage:'Change language', creator:'Guanmo',
    skip:'Skip to works', collection:'All works', search:'Search styles, layouts, or keywords', placeholder:'Search works or keywords', filters:'Filter works',
    all:'All', style:'Design styles', layout:'Layouts', resultCount:'Showing {count} of {total} films',
    emptyTitle:'No matching works', emptyHint:'Try “Bauhaus”, “Bento”, or another keyword.', reset:'View all works', loading:'Loading films…',
    loadError:'Could not load the works. Refresh to try again, or ', githubBrowse:'browse on GitHub ↗',
    credit:'· Please credit the creator when sharing videos or artwork', by:'By', openSource:'Explore the source ↗',
    view:'View {title}', cover:'{title} short film cover', styleLabel:'Style {number}', layoutLabel:'Layout {number}',
    styleGuide:'Style guide', layoutGuide:'Layout guide', process:'Making of', source:'Source code ↗',
    styleImages:'Visual guide', layoutImages:'Layout diagrams', imageHint:'Enlarge or download SVG', zoom:'Enlarge: {title}', sourceFile:'SVG source ↗',
    previous:'← Previous', next:'Next →', previousLabel:'Previous film', nextLabel:'Next film', close:'Close preview', closeImage:'Close image preview',
    outside:'Outside the current filter', noOther:'No other films in this list', previousTitle:'Previous: {title}', nextTitle:'Next: {title}',
    playbackError:'The video could not be loaded. ', release:'Watch or download on GitHub Releases ↗',
    imagePreview:'Image preview', editable:'Editable SVG', download:'Download SVG ↓', viewSource:'View SVG source ↗',
    mediaNote:'Videos and artwork retain their original Chinese labels.', contents:'On this page', chapters:'Sections', documents:'Film documents',
    skipArticle:'Skip to article', back:'← Back to film', original:'View Markdown source ↗', table:'Horizontally scrollable table'
  }
};

export function text(language, key, values = {}) {
  return messages[language][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
}
export function resolveLanguage(url) {
  const explicit = new URL(url).searchParams.get('lang');
  if (explicit === 'en' || explicit === 'zh') return explicit;
  return 'zh';
}
export function languageUrl(url, language) {
  if (!Object.hasOwn(messages, language)) throw new Error('语言无效');
  const result = new URL(url);
  result.searchParams.set('lang', language);
  return result.href;
}
export function documentHref(work, kind, language, state = {}) {
  const query = new URLSearchParams({lang:language});
  if (state.query) query.set('q', state.query);
  if (state.type && state.type !== 'all') query.set('type', state.type);
  return `./read/${work.id}/${kind}${language === 'en' ? '.en' : ''}.html?${query}`;
}
export const content = (value, key, language) => value[language === 'en' ? `${key}En` : key];
