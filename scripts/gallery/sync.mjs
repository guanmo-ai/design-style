import {mkdir, rename, rm, access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {cache, loadCatalog, sha256} from './catalog.mjs';

await mkdir(cache, {recursive: true});
for (const work of await loadCatalog()) {
  const file = path.join(cache, work.asset);
  if (await access(file).then(() => true, () => false)) {
    if (await sha256(file) === work.sha256) { console.log(`${work.title}：已有视频，SHA-256 核验通过`); continue; }
  }
  const temporary = await import('node:fs/promises').then(fs => fs.mkdtemp(path.join(cache, '.download-')));
  try {
    console.log(`正在同步本仓库视频：${work.asset}`);
    execFileSync('gh', ['release', 'download', work.release, '--repo', 'guanmo-ai/motion-style', '--pattern', work.asset, '--dir', temporary], {stdio: 'inherit'});
    const downloaded = path.join(temporary, work.asset);
    if (await sha256(downloaded) !== work.sha256) throw new Error(`${work.asset} 校验失败；请核实 Release 是否更新`);
    await rename(downloaded, file);
    console.log(`${work.title}：下载完成，SHA-256 核验通过`);
  } finally { await rm(temporary, {recursive: true, force: true}); }
}
