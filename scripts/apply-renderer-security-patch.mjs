import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const version = '4.0.538';
const renderer = JSON.parse(await readFile(path.join(root, 'node_modules/@remotion/renderer/package.json'), 'utf8'));
if (renderer.version !== version) throw new Error('Remotion 版本已变化，请复核浏览器 ZIP 安全补丁后再安装。');
const patch = path.join(root, 'patches', `@remotion+renderer+${version}.patch`);
const apply = args => spawnSync('git', ['apply', '--whitespace=error', ...args, patch], {cwd: root, encoding: 'utf8'});

if (apply(['--reverse', '--check']).status === 0) {
  console.log('Remotion 浏览器 ZIP 安全补丁：已应用并校验。');
} else {
  const check = apply(['--check']);
  if (check.status !== 0) throw new Error(`Remotion 安全补丁校验失败；请确认 Git 已安装，且依赖来自锁文件。\n${check.error?.message || check.stderr}`);
  const result = apply([]);
  if (result.status !== 0) throw new Error(`Remotion 安全补丁应用失败：${result.error?.message || result.stderr}`);
  console.log('Remotion 浏览器 ZIP 安全补丁：已应用。');
}
