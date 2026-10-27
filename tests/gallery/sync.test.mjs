import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {syncVideo} from '../../scripts/gallery/sync.mjs';

const video = Buffer.alloc(2 * 1024 * 1024, 0x7f);
const work = {title: '测试作品', release: 'day-09', asset: '009-test.mp4', sha256: createHash('sha256').update(video).digest('hex')};
const release = {tag_name: work.release, draft: false, assets: [{name: work.asset, id: 123}]};

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'design-style-sync-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  return directory;
}

function restDownload(metadata = release, bytes = video) {
  const calls = [];
  const run = (command, args, options) => {
    assert.equal(command, 'gh');
    calls.push(args);
    if (calls.length === 1) {
      assert.deepEqual(args, ['api', 'repos/guanmo-ai/design-style/releases/tags/day-09']);
      return JSON.stringify(metadata);
    }
    assert.deepEqual(args, ['api', 'repos/guanmo-ai/design-style/releases/assets/123', '-H', 'Accept: application/octet-stream']);
    assert.equal(typeof options.stdio[1], 'number');
    writeFileSync(options.stdio[1], bytes);
  };
  return {run, calls};
}

test('REST 附件直接写文件，超过 stdout 默认缓冲区的视频仍完整且校验后才入缓存', async t => {
  const directory = await fixture(t);
  const {run, calls} = restDownload();
  await syncVideo(work, directory, run);
  assert.equal(calls.length, 2);
  assert.deepEqual(await readFile(path.join(directory, work.asset)), video);
  assert.deepEqual(await readdir(directory), [work.asset]);
  await syncVideo(work, directory, () => assert.fail('校验通过的缓存不应重复下载'));
});

test('附件哈希不符或下载失败时保留原缓存并清理临时文件', async t => {
  const directory = await fixture(t);
  const file = path.join(directory, work.asset);
  await writeFile(file, '原缓存');
  await assert.rejects(syncVideo(work, directory, restDownload(release, Buffer.from('损坏附件')).run), /校验失败/);
  const {run} = restDownload();
  await assert.rejects(syncVideo(work, directory, (command, args, options) => {
    if (args[2] === '-H') throw new Error('下载失败');
    return run(command, args, options);
  }), /下载失败/);
  assert.equal(await readFile(file, 'utf8'), '原缓存');
  assert.deepEqual(await readdir(directory), [work.asset]);
});

test('缺失、重名、非数字 ID、草稿或错误 tag 的附件不能进入下载', async t => {
  const directory = await fixture(t);
  for (const metadata of [
    {...release, assets: []},
    {...release, assets: [...release.assets, ...release.assets]},
    {...release, assets: [{name: work.asset, id: '../other'}]},
    {...release, draft: true},
    {...release, tag_name: 'day-08'}
  ]) {
    const {run, calls} = restDownload(metadata);
    await assert.rejects(syncVideo(work, directory, run), /没有唯一有效附件/);
    assert.equal(calls.length, 1);
    assert.deepEqual(await readdir(directory), []);
  }
});
