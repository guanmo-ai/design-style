// Build a checked gallery, then use an unpublished local render for review.
// The release catalog and downloaded Release files remain authoritative for publishing.
import {cp, readFile, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
import {root, output, loadCatalog, sha256} from './catalog.mjs';
import {checkRelease} from './check-release.mjs';

const [id, input] = process.argv.slice(2);
const work = (await loadCatalog()).find(work => work.id === id);
if (!work || !input) throw new Error('用法：npm run gallery:preview -- <作品 ID> <本地 MP4 路径>');
const file = path.resolve(input);
const metadata = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], {encoding: 'utf8'}));
const video = metadata.streams.find(stream => stream.codec_type === 'video');
const [numerator, denominator] = (video?.avg_frame_rate ?? '').split('/').map(Number);
assert.ok(video && video.width === work.width && video.height === work.height, '本地视频尺寸与作品规格不一致');
assert.equal(numerator / denominator, work.fps, '本地视频帧率与作品规格不一致');
assert.ok(Math.abs(Number(video.duration ?? metadata.format.duration) - work.duration) < 1 / work.fps, '本地视频时长与作品规格不一致');
assert.ok(metadata.streams.some(stream => stream.codec_type === 'audio'), '本地视频缺少音轨');

execFileSync(process.execPath, [path.join(root, 'scripts/gallery/build.mjs')], {cwd: root, stdio: 'inherit'});
await checkRelease();
const catalog = JSON.parse(await readFile(path.join(output, 'data/works.json'), 'utf8'));
const previewWork = catalog.find(item => item.id === id);
const destination = path.join(output, 'media', previewWork.asset);
await cp(file, destination);
previewWork.sha256 = await sha256(file);
assert.equal(await sha256(destination), previewWork.sha256, '本地预览视频复制校验失败');
await writeFile(path.join(output, 'data/works.json'), JSON.stringify(catalog, null, 2) + '\n');
console.log(`本地预览已更新：${work.title}。源目录与 Release 缓存未修改；预览产物不可作为正式发布包。`);
