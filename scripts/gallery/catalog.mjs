import {readFile, access} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {TYPES, typeOf, workDir} from '../../gallery/assets/model.mjs';
export const root = path.resolve(import.meta.dirname, '../..');
export const cache = path.join(root, '.gallery-cache');
export const output = path.join(root, 'dist');
export async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
export function validateEntries(works) {
  if (!Array.isArray(works) || !works.length) throw new Error('作品目录不能为空');
  const ids = new Set();
  for (const work of works) {
    if (!Object.hasOwn(TYPES, work.type)) throw new Error(`${work.id} 的类型必须是 ${Object.keys(TYPES).join(' / ')}`);
    if (!TYPES[work.type].id.test(work.id) || ids.has(work.id)) throw new Error('作品 ID 无效或重复');
    ids.add(work.id);
    if (work.videoDir !== undefined && !['video', 'video3d'].includes(work.videoDir)) throw new Error(`${work.id} 的视频源码目录无效`);
    if (!/^[\w.-]+$/.test(work.release) || work.asset !== `${work.id}.mp4` || !/^[a-f0-9]{64}$/.test(work.sha256)) throw new Error(`${work.id} 的 Release 配置无效`);
    for (const key of ['number', 'title', 'titleEn', 'years', 'category', 'categoryEn', 'description', 'descriptionEn']) if (typeof work[key] !== 'string' || !work[key].trim()) throw new Error(`${work.id} 缺少 ${key}`);
    if (!Number.isFinite(Date.parse(work.publishedAt))) throw new Error('发布日期无效');
    if (!Array.isArray(work.tags) || work.tags.some(tag => typeof tag !== 'string')) throw new Error('标签格式无效');
    if (!Array.isArray(work.tagsEn) || !work.tagsEn.length || work.tagsEn.some(tag => typeof tag !== 'string' || !tag.trim())) throw new Error('英文标签格式无效');
    if (!Array.isArray(work.images) || work.images.length !== 4 || new Set(work.images.map(image => image.file)).size !== 4 || work.images.some(image => !/^[a-z0-9-]+$/.test(image.file) || !image.title || !image.kind)) throw new Error('风格图配置无效');
    if (work.images.some(image => !['titleEn','kindEn'].every(key => typeof image[key] === 'string' && image[key].trim()))) throw new Error('英文图解配置不完整');
  }
  for (const type of Object.keys(TYPES)) {
    const numbers = works.filter(work => work.type === type).map(work => work.number).sort((a, b) => Number(a) - Number(b));
    const width = type === 'style' ? 3 : 2;
    if (numbers.some((number, index) => number !== String(index + 1).padStart(width, '0'))) {
      throw new Error(`${TYPES[type].name}的上架期号必须从 ${'1'.padStart(width, '0')} 开始连续编号，不能重复或跳号`);
    }
  }
}
export async function loadCatalog() {
  const works = JSON.parse(await readFile(path.join(root, 'gallery/data/works.json'), 'utf8'));
  validateEntries(works);
  return Promise.all(works.map(async work => {
    const base = path.join(root, workDir(work));
    const tokens = JSON.parse(await readFile(path.join(base, 'tokens.json'), 'utf8'));
    const timeline = JSON.parse(await readFile(path.join(base, 'process/timeline.json'), 'utf8'));
    const {fps, durationFrames, size} = tokens.motion;
    if (!(fps > 0 && durationFrames > 0 && size?.length === 2 && size.every(n => n > 0)) || timeline.fps !== fps || timeline.frames !== durationFrames) throw new Error(`${work.id} 的视频规格与时间轴不一致`);
    let end = 0;
    for (const segment of timeline.segments) {
      if (segment.start !== end || !(segment.dur > 0) || typeof segment.label !== 'string') throw new Error(`${work.id} 时间轴存在空隙或重叠`);
      end = segment.start + segment.dur;
    }
    if (end !== durationFrames) throw new Error(`${work.id} 时间轴未覆盖完整视频`);
    await Promise.all([work.videoDir || 'video', 'video/cover.jpg', 'README.md', 'PROCESS.md', 'README.en.md', 'PROCESS.en.md', ...work.images.flatMap(image => [`images/preview/${image.file}.svg`, `images/${image.file}.svg`])].map(file => access(path.join(base, file))));
    return {...work, type: typeOf(work), duration: durationFrames / fps, fps, width: size[0], height: size[1], chapters: timeline.segments.map(segment => ({label: segment.label, start: segment.start / fps}))};
  }));
}
