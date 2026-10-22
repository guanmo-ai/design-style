import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {root, loadCatalog} from './catalog.mjs';
import {escapeHtml, selectWorks, workDir} from '../../gallery/assets/model.mjs';

const works = selectWorks(await loadCatalog());
const rows = [];
for (let index = 0; index < works.length; index += 3) {
  const cells = works.slice(index, index + 3).map(work => {
    const url = `https://guanmo-ai.github.io/design-style/#work-${work.id}`;
    return `    <td align="center" valign="top" width="33%">
      <a href="${url}"><img src="${workDir(work)}/video/cover.jpg" width="240" alt="${escapeHtml(work.title)} ${escapeHtml(work.titleEn)} 视频封面" /></a><br />
      <a href="${url}"><b>${escapeHtml(work.title)}</b></a><br />
      <sub>${escapeHtml(work.titleEn)} · ${work.duration} 秒</sub>
    </td>`;
  });
  rows.push(`  <tr>\n${cells.join('\n')}\n  </tr>`);
}

const begin = '<!-- BEGIN WORK PREVIEWS -->';
const end = '<!-- END WORK PREVIEWS -->';
const file = path.join(root, 'README.md');
const readme = await readFile(file, 'utf8');
const start = readme.indexOf(begin);
const finish = readme.indexOf(end);
if (start < 0 || finish < start || readme.indexOf(begin, start + begin.length) !== -1 || readme.indexOf(end, finish + end.length) !== -1) {
  throw new Error('README 需要且只能有一组 WORK PREVIEWS 标记');
}
const previews = `${begin}\n<!-- 由 npm run gallery:readme 根据 gallery/data/works.json 生成，请勿手动修改此区域。 -->\n<table>\n${rows.join('\n')}\n</table>\n${end}`;
const updated = readme.slice(0, start) + previews + readme.slice(finish + end.length);
if (updated !== readme) await writeFile(file, updated);
console.log(`README 预览已同步：${works.length} 个视频，每行最多 3 个`);
