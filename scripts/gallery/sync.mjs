import {mkdir, mkdtemp, rename, rm, access} from 'node:fs/promises';
import {openSync, closeSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {cache, loadCatalog, sha256} from './catalog.mjs';

export async function syncVideo(work, directory = cache, run = execFileSync) {
  await mkdir(directory, {recursive: true});
  const file = path.join(directory, work.asset);
  if (await access(file).then(() => true, () => false)) {
    if (await sha256(file) === work.sha256) { console.log(`${work.title}：已有视频，SHA-256 核验通过`); return; }
  }
  const temporary = await mkdtemp(path.join(directory, '.download-'));
  try {
    console.log(`正在同步本仓库视频：${work.asset}`);
    // 只用 REST，兼容禁止 GraphQL 的云端会话；不下载目录以外的附件。
    const release = JSON.parse(run('gh', ['api', `repos/guanmo-ai/design-style/releases/tags/${encodeURIComponent(work.release)}`], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit']}));
    const assets = release.assets?.filter(asset => asset.name === work.asset) ?? [];
    if (release.tag_name !== work.release || release.draft || assets.length !== 1 || !Number.isSafeInteger(assets[0].id) || assets[0].id <= 0) {
      throw new Error(`${work.asset} 在已发布的 ${work.release} 中没有唯一有效附件`);
    }
    const downloaded = path.join(temporary, work.asset);
    // 二进制直接写文件，避免 execFileSync 的 stdout 缓冲区截断大视频。
    const descriptor = openSync(downloaded, 'wx');
    try {
      run('gh', ['api', `repos/guanmo-ai/design-style/releases/assets/${assets[0].id}`, '-H', 'Accept: application/octet-stream'], {stdio: ['ignore', descriptor, 'inherit']});
    } finally { closeSync(descriptor); }
    if (await sha256(downloaded) !== work.sha256) throw new Error(`${work.asset} 校验失败；请核实 Release 是否更新`);
    await rename(downloaded, file);
    console.log(`${work.title}：下载完成，SHA-256 核验通过`);
  } finally { await rm(temporary, {recursive: true, force: true}); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const work of await loadCatalog()) await syncVideo(work);
}
