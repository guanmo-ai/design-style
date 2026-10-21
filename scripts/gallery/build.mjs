import {mkdir, rm, cp, writeFile, access, readFile} from 'node:fs/promises';
import path from 'node:path';
import {root, cache, output, loadCatalog, sha256} from './catalog.mjs';
import {renderDocument} from '../../gallery/render-documents.mjs';
import {workDir} from '../../gallery/assets/model.mjs';

const works = await loadCatalog();
// Render and validate documents before replacing the previous usable build.
const pages = [];
for (const work of works) {
  for (const [kind, file] of [['guide', 'README.md'], ['process', 'PROCESS.md']]) {
    const document = renderDocument(await readFile(path.join(root, workDir(work), file), 'utf8'), work, kind);
    await Promise.all(document.assets.map(asset => access(path.join(root, workDir(work), asset))));
    pages.push({work, kind, ...document});
  }
}
for (const work of works) {
  const file = path.join(cache, work.asset);
  if (!await access(file).then(() => true, () => false)) throw new Error(`缺少 ${work.asset}，请先运行 npm run gallery:sync`);
  if (await sha256(file) !== work.sha256) throw new Error(`${work.asset} 校验失败，请运行 npm run gallery:sync`);
}
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
for (const file of ['index.html', 'assets', 'LICENSE', 'NOTICE.md']) await cp(path.join(root, 'gallery', file), path.join(output, file), {recursive: true});
await mkdir(path.join(output, 'data'), {recursive: true});
await writeFile(path.join(output, 'data/works.json'), JSON.stringify(works, null, 2) + '\n');
await mkdir(path.join(output, 'media'), {recursive: true});
for (const work of works) {
  const destination = path.join(output, workDir(work));
  await mkdir(path.join(destination, 'video'), {recursive: true});
  await cp(path.join(root, workDir(work), 'video/cover.jpg'), path.join(destination, 'video/cover.jpg'));
  await cp(path.join(root, workDir(work), 'images/preview'), path.join(destination, 'images/preview'), {recursive: true});
  await cp(path.join(cache, work.asset), path.join(output, 'media', work.asset));
}
for (const page of pages) {
  const directory = path.join(output, 'read', page.work.id);
  await mkdir(directory, {recursive: true});
  await writeFile(path.join(directory, `${page.kind}.html`), page.html);
  for (const asset of page.assets) {
    const destination = path.join(output, workDir(page.work), asset);
    await mkdir(path.dirname(destination), {recursive: true});
    await cp(path.join(root, workDir(page.work), asset), destination);
  }
}
await writeFile(path.join(output, '.nojekyll'), '');
console.log(`画廊构建完成：${works.length} 期，输出至 dist/`);
