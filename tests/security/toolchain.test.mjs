import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm, symlink, lstat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import postcss from 'postcss';

const require = createRequire(import.meta.url);
const renderer = path.dirname(require.resolve('@remotion/renderer/package.json'));
const {extractZipArchive} = require(path.join(renderer, 'dist/browser/extract-zip-archive.js'));

async function fixture(t, entries) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'design-style-archive-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  const archive = path.join(directory, 'probe.zip');
  const destination = path.join(directory, 'extract');
  await mkdir(destination);
  execFileSync('python3', ['-c', `
import json, stat, sys, warnings, zipfile
warnings.filterwarnings('ignore', category=UserWarning)
with zipfile.ZipFile(sys.argv[1], 'w') as archive:
    for item in json.load(sys.stdin):
        entry = zipfile.ZipInfo(item['name'])
        entry.create_system = 3
        entry.external_attr = ((stat.S_IFLNK if 'target' in item else stat.S_IFREG) | 0o755) << 16
        archive.writestr(entry, item.get('target', item.get('data', '')))
`, archive], {input: JSON.stringify(entries)});
  return {directory, archive, destination};
}

test('CSS sourceMappingURL 不得读取相邻文件或通过符号链接逃逸', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'design-style-map-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  await mkdir(path.join(directory, 'css'));
  await writeFile(path.join(directory, 'canary.txt'), 'REVIEW_SYNTHETIC_CANARY');
  await writeFile(path.join(directory, 'canary.map'), 'REVIEW_SYNTHETIC_MAP');
  await symlink(path.join(directory, 'canary.map'), path.join(directory, 'css', 'link.map'));
  for (const [annotation, from] of [
    [path.join(directory, 'canary.txt'), undefined],
    [path.join(directory, 'canary.map'), undefined],
    ['../canary.map', path.join(directory, 'css', 'input.css')],
    ['link.map', path.join(directory, 'css', 'input.css')]
  ]) {
    const root = postcss.parse(`a{}/*# sourceMappingURL=${annotation} */`, from ? {from} : {});
    assert.equal(root.source.input.map, undefined);
  }
});

test('浏览器 ZIP 不得创建指向解压目录外的链接或写穿同名条目', async t => {
  const {directory, archive, destination} = await fixture(t, [
    {name: 'entry', target: '../outside.txt'},
    {name: 'entry', data: 'ATTACKER_WRITE'}
  ]);
  const outside = path.join(directory, 'outside.txt');
  await writeFile(outside, 'before');
  await assert.rejects(extractZipArchive(archive, destination));
  assert.equal(await readFile(outside, 'utf8'), 'before');
  await assert.rejects(lstat(path.join(destination, 'entry')), {code: 'ENOENT'});
});

test('浏览器 ZIP 不得写穿解压目录中已有的文件链接', async t => {
  const {directory, archive, destination} = await fixture(t, [{name: 'entry', data: 'ATTACKER_WRITE'}]);
  const outside = path.join(directory, 'outside.txt');
  await writeFile(outside, 'before');
  await symlink(outside, path.join(destination, 'entry'));
  await assert.rejects(extractZipArchive(archive, destination));
  assert.equal(await readFile(outside, 'utf8'), 'before');
});

test('浏览器 ZIP 校验路径后才创建目录，不能通过已有链接在外部建目录', async t => {
  const {directory, archive, destination} = await fixture(t, [{name: 'entry/new/file.txt', data: 'ATTACKER_WRITE'}]);
  const outside = path.join(directory, 'outside');
  await mkdir(outside);
  await symlink(outside, path.join(destination, 'entry'));
  await assert.rejects(extractZipArchive(archive, destination));
  await assert.rejects(lstat(path.join(outside, 'new')), {code: 'ENOENT'});
});

test('浏览器 ZIP 保留正常文件、执行权限与目录内相对链接', async t => {
  const {archive, destination} = await fixture(t, [
    {name: 'bin/browser', data: 'SAFE_BROWSER_FIXTURE'},
    {name: 'browser', target: 'bin/browser'}
  ]);
  await extractZipArchive(archive, destination);
  assert.equal(await readFile(path.join(destination, 'browser'), 'utf8'), 'SAFE_BROWSER_FIXTURE');
  assert.ok((await lstat(path.join(destination, 'browser'))).isSymbolicLink());
  assert.equal((await lstat(path.join(destination, 'bin/browser'))).mode & 0o777, 0o755);
});

test('浏览器 ZIP 允许安全链接向前引用尚未解压的目标', async t => {
  const {archive, destination} = await fixture(t, [
    {name: 'browser', target: 'bin/browser'},
    {name: 'bin/browser', data: 'SAFE_FORWARD_REFERENCE'}
  ]);
  await extractZipArchive(archive, destination);
  assert.equal(await readFile(path.join(destination, 'browser'), 'utf8'), 'SAFE_FORWARD_REFERENCE');
});

test('浏览器 ZIP 拒绝父路径条目', async t => {
  const {directory, archive, destination} = await fixture(t, [{name: '../outside.txt', data: 'ATTACKER_WRITE'}]);
  const outside = path.join(directory, 'outside.txt');
  await writeFile(outside, 'before');
  await assert.rejects(extractZipArchive(archive, destination));
  assert.equal(await readFile(outside, 'utf8'), 'before');
});

test('浏览器 ZIP 相对链接必须按真实父目录校验，不能借目录别名改变层级', async t => {
  const {directory, archive, destination} = await fixture(t, [{name: 'nested/alias/escape', target: '../../outside.txt'}]);
  await mkdir(path.join(destination, 'nested'));
  await mkdir(path.join(destination, 'safe'));
  await symlink('../safe', path.join(destination, 'nested', 'alias'));
  await writeFile(path.join(directory, 'outside.txt'), 'before');
  await assert.rejects(extractZipArchive(archive, destination));
  await assert.rejects(lstat(path.join(destination, 'safe', 'escape')), {code: 'ENOENT'});
});
