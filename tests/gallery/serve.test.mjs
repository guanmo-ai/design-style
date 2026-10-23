import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import os from 'node:os';
import path from 'node:path';

test('空文件的 GET、HEAD 和 Range 请求不会终止预览服务', {timeout: 10000}, async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'design-style-empty-'));
  await writeFile(path.join(directory, 'empty.txt'), '');
  await writeFile(path.join(directory, 'healthy.txt'), '服务正常');
  // Isolate the process so a regression reports the original crash as a test failure.
  const module = new URL('../../scripts/gallery/serve.mjs', import.meta.url).href;
  const child = spawn(process.execPath, ['--input-type=module', '--eval', `
    import {createGalleryServer} from ${JSON.stringify(module)};
    const server = createGalleryServer(${JSON.stringify(directory)});
    server.listen(0, '127.0.0.1', () => process.send(server.address().port));
  `], {stdio: ['ignore', 'ignore', 'pipe', 'ipc']});
  let errors = '';
  child.stderr.on('data', chunk => { errors += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    await rm(directory, {recursive: true, force: true});
  });
  const [port] = await once(child, 'message');
  const base = `http://127.0.0.1:${port}`;
  let response;
  try { response = await fetch(`${base}/empty.txt`); }
  catch (error) { assert.fail(`空文件请求失败：${error.message}\n${errors}`); }
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-length'), '0');
  assert.equal(await response.text(), '');
  const head = await fetch(`${base}/empty.txt`, {method: 'HEAD'});
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('content-length'), '0');
  assert.equal(await head.text(), '');
  for (const range of ['bytes=0-0', 'bytes=-1', 'bytes=1-']) {
    const invalid = await fetch(`${base}/empty.txt`, {headers: {Range: range}});
    assert.equal(invalid.status, 416);
    assert.equal(invalid.headers.get('content-range'), 'bytes */0');
    assert.equal(await invalid.text(), '');
  }
  const healthy = await fetch(`${base}/healthy.txt`);
  assert.equal(healthy.status, 200);
  assert.equal(await healthy.text(), '服务正常');
  assert.equal(errors, '');
});
