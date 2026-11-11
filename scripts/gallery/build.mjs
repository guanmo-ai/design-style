import {mkdir, rm, cp, writeFile, access, readFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {root, output, loadCatalog, sha256, videoSource, coverSource} from './catalog.mjs';
import {renderDocument, DOCUMENT_PAGES} from '../../gallery/render-documents.mjs';
import {workDir, isOverview} from '../../gallery/assets/model.mjs';

const works = await loadCatalog();
// One content version for the module graph keeps cached imports in the same build.
const assets = path.join(root, 'gallery/assets');
const assetFiles = (await readdir(assets)).filter(file => /\.(?:mjs|css)$/.test(file)).sort();
const assetVersion = createHash('sha256');
for (const file of assetFiles) assetVersion.update(file).update(await readFile(path.join(assets, file)));
const version = assetVersion.digest('hex');
const versionHtml = html => html.replace(/\b(src|href)="([^"?]+\.(?:mjs|css))"/g, `$1="$2?v=${version}"`);
// Render and validate documents before replacing the previous usable build.
const pages = [];
for (const work of works) {
  if (isOverview(work)) continue;
  for (const {kind, language, file, slug} of DOCUMENT_PAGES) {
    const document = renderDocument(await readFile(path.join(root, workDir(work), file), 'utf8'), work, kind, language);
    await Promise.all(document.assets.map(asset => access(path.join(root, workDir(work), asset))));
    pages.push({work, slug, ...document});
  }
}
for (const work of works) {
  const file = videoSource(work);
  if (!await access(file).then(() => true, () => false)) throw new Error(`缺少 ${work.asset}，请先运行 npm run gallery:sync`);
  if (await sha256(file) !== work.sha256) throw new Error(`${work.asset} 校验失败，请运行 npm run gallery:sync`);
}
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
for (const file of ['index.html', 'assets', 'LICENSE', 'NOTICE.md']) await cp(path.join(root, 'gallery', file), path.join(output, file), {recursive: true});
await writeFile(path.join(output, 'index.html'), versionHtml(await readFile(path.join(output, 'index.html'), 'utf8')));
for (const file of assetFiles.filter(file => file.endsWith('.mjs'))) {
  const module = await readFile(path.join(assets, file), 'utf8');
  await writeFile(path.join(output, 'assets', file), module.replace(/(from\s*['"])(\.\/[^'"?]+\.mjs)(['"])/g, `$1$2?v=${version}$3`));
}
await mkdir(path.join(output, 'data'), {recursive: true});
await writeFile(path.join(output, 'data/works.json'), JSON.stringify(works, null, 2) + '\n');
await mkdir(path.join(output, 'media'), {recursive: true});
for (const work of works) {
  const destination = path.join(output, workDir(work));
  await mkdir(path.join(destination, 'video'), {recursive: true});
  await cp(path.join(root, coverSource(work)), path.join(destination, 'video/cover.jpg'));
  if (work.images.length) await cp(path.join(root, workDir(work), 'images/preview'), path.join(destination, 'images/preview'), {recursive: true});
  await cp(videoSource(work), path.join(output, 'media', work.asset));
}
for (const page of pages) {
  const directory = path.join(output, 'read', page.work.id);
  await mkdir(directory, {recursive: true});
  await writeFile(path.join(directory, `${page.slug}.html`), versionHtml(page.html));
  for (const asset of page.assets) {
    const destination = path.join(output, workDir(page.work), asset);
    await mkdir(path.dirname(destination), {recursive: true});
    await cp(path.join(root, workDir(page.work), asset), destination);
  }
}
await writeFile(path.join(output, '.nojekyll'), '');
console.log(`画廊构建完成：${works.length} 期，输出至 dist/`);
