import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {build} from 'esbuild';

const script = path.resolve('scripts/new_style.mjs');
const baseRoot = `import React from 'react';\nimport {Composition} from 'remotion';\n// 保留现有 015 与 016 的注册\nexport const Root: React.FC = () => (\n  <>\n    <Composition id="S015-Futurism" component={Existing} />\n    <Composition id="S016-Other" component={Existing} />\n  </>\n);\n`;
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'new-style-'));
  t.after(() => fs.rm(root, {recursive: true, force: true}));
  await fs.mkdir(path.join(root, 'src'));
  await fs.mkdir(path.join(root, 'styles'));
  await fs.writeFile(path.join(root, 'src/Root.tsx'), baseRoot);
  await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({scripts: {'render:016': 'keep-me'}}));
  return root;
}
const run = (root, name) => spawnSync(process.execPath, [script, name], {cwd: root, encoding: 'utf8'});

test('生成完整一期并保留已有合成和命令，重复执行不覆盖', async (t) => {
  const root = await fixture(t);
  const result = run(root, '020-demo');
  assert.equal(result.status, 0, result.stderr);
  await fs.symlink(path.resolve('src/lib'), path.join(root, 'src/lib'), 'dir');
  await build({entryPoints: [path.join(root, 'styles/020-demo/video/Demo.tsx')], bundle: true, write: false, jsx: 'automatic', external: ['react', 'remotion', '@remotion/*'], logLevel: 'silent'});
  const registration = await fs.readFile(path.join(root, 'src/Root.tsx'), 'utf8');
  assert.match(registration, /S015-Futurism/);
  assert.match(registration, /S016-Other/);
  assert.match(registration, /S020-Demo-Preview/);
  assert.match(registration, /res: 0.5/);
  const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['render:016'], 'keep-me');
  for (const key of ['music:020', 'render:020', 'render:020:gpu', 'preview:020', 'images:020']) assert.ok(pkg.scripts[key], key);
  for (const file of ['video/Demo.tsx', 'video/timeline.ts', 'video/scenes.tsx', 'video/hud.tsx', 'audio/make_music.py', 'images/make_svgs.py', 'README.md', 'README.en.md', 'PROCESS.md', 'PROCESS.en.md']) {
    assert.ok((await fs.stat(path.join(root, 'styles/020-demo', file))).isFile(), file);
  }
  const before = await fs.readFile(path.join(root, 'src/Root.tsx'), 'utf8');
  assert.notEqual(run(root, '020-demo').status, 0);
  assert.equal(await fs.readFile(path.join(root, 'src/Root.tsx'), 'utf8'), before);
});

test('无效名字和已占用期号在写入前拒绝', async (t) => {
  for (const name of ['../escape', '000-demo', '20-demo', '020-Demo', '020-demo;touch', '016-another']) {
    const root = await fixture(t);
    const before = await fs.readFile(path.join(root, 'package.json'), 'utf8');
    const result = run(root, name);
    assert.notEqual(result.status, 0, name);
    assert.equal(await fs.readFile(path.join(root, 'src/Root.tsx'), 'utf8'), baseRoot);
    assert.equal(await fs.readFile(path.join(root, 'package.json'), 'utf8'), before);
    assert.deepEqual(await fs.readdir(path.join(root, 'styles')), []);
  }
});

test('同号不同名目录和未知 Root 格式均不产生半成品', async (t) => {
  const root = await fixture(t);
  await fs.mkdir(path.join(root, 'styles/020-reserved'));
  assert.notEqual(run(root, '020-demo').status, 0);
  await fs.rm(path.join(root, 'styles/020-reserved'), {recursive: true});
  await fs.writeFile(path.join(root, 'src/Root.tsx'), 'export const Root = () => null;');
  const before = await fs.readFile(path.join(root, 'package.json'), 'utf8');
  assert.notEqual(run(root, '020-demo').status, 0);
  assert.deepEqual(await fs.readdir(path.join(root, 'styles')), []);
  assert.equal(await fs.readFile(path.join(root, 'package.json'), 'utf8'), before);
});

test('字符串表达式 ID 也占用期号，Root 外的 Fragment 不能用作注册目标', async (t) => {
  for (const source of [
    baseRoot.replace('id="S015-Futurism"', "id={'S020-Demo'}"),
    `export const Root = () => null;\nexport const Other = () => (<> </>);\n`,
  ]) {
    const root = await fixture(t);
    await fs.writeFile(path.join(root, 'src/Root.tsx'), source);
    const before = await fs.readFile(path.join(root, 'package.json'), 'utf8');
    const result = run(root, '020-demo');
    assert.notEqual(result.status, 0, '必须在写入前拒绝');
    assert.equal(await fs.readFile(path.join(root, 'src/Root.tsx'), 'utf8'), source);
    assert.equal(await fs.readFile(path.join(root, 'package.json'), 'utf8'), before);
    assert.deepEqual(await fs.readdir(path.join(root, 'styles')), []);
  }
});
