import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { findIssues, hookIssues } from '../../scripts/privacy/check.mjs';

// 示例都是编出来的句子，不是任何人的原话。
const rules = (text, scope) => findIssues(text, scope).map((it) => it.rule);

test('提交说明和 PR 正文：拦住转述、审片结论和否决经过', () => {
  assert.ok(rules('主人说开头太慢，改成第 0 帧就动').includes('owner-said'));
  assert.ok(rules('三改被否：「示例句子」').includes('rejected'));
  assert.ok(rules('主人已确认第二版，交给 Codex 上架').includes('owner-decided'));
  assert.ok(rules('观默觉得配乐太吵').includes('owner-said'));
  assert.ok(rules('审片反馈：“示例句子”').includes('quoted-feedback'));
  assert.ok(rules('The owner said the intro drags').includes('owner-said-en'));
  assert.ok(rules('备份在 /Users/someone/backups').includes('local-path'));
  assert.ok(rules('联系 real.person@gmail.com').includes('email'));
});

test('提交说明和 PR 正文：只写改动的说明可以通过', () => {
  for (const ok of [
    'feat: 收录达达动效短片第二版与配套源码',
    '开头改成第 0 帧就有纸片落下；smooth.py 跳变 9、死区 0',
    '结尾署名“观默”落在最后一击上',
    'release: 上架马克笔手绘 v4 为风格 020',
    'Co-Authored-By: Claude <noreply@anthropic.com>',
    'Co-authored-by: 观默 <12345+guanmo-ai@users.noreply.github.com>',
  ]) assert.deepEqual(findIssues(ok, 'message'), [], ok);
});

test('公开文档：规则性的写法不算转述', () => {
  for (const ok of [
    '上架、发布要主人审片通过。',
    '最后一帧能看到署名“观默”。',
    '用户点按后卡片回弹 5%',
    '输入框占位文字 you@site.com',
    '乔布斯的原话放英文',
  ]) assert.deepEqual(findIssues(ok, 'doc'), [], ok);
  assert.ok(rules('主人看完说节奏太赶', 'doc').includes('owner-said'));
});

const project = path.resolve('/repo/design-style');

test('钩子：git commit 的说明里有转述就拦下', () => {
  const issues = hookIssues({ tool_name: 'Bash', cwd: project, tool_input: { command: 'git commit -m "主人说太慢，加快"' } }, project);
  assert.ok(issues.length > 0);
});

test('钩子：只读的 gh api 和普通命令不检查', () => {
  assert.deepEqual(hookIssues({ tool_name: 'Bash', cwd: project, tool_input: { command: 'gh api repos/x/y/pulls/8 --jq .body | grep 主人说' } }, project), []);
  assert.deepEqual(hookIssues({ tool_name: 'Bash', cwd: project, tool_input: { command: 'grep -rn 主人说 docs' } }, project), []);
});

test('钩子：gh api 写 PR 正文要检查', () => {
  const cmd = 'gh api -X PATCH repos/x/y/pulls/8 -f body="二改被否，重做"';
  assert.ok(hookIssues({ tool_name: 'Bash', cwd: project, tool_input: { command: cmd } }, project).length > 0);
});

test('钩子：私有仓库里的提交和文件不拦', () => {
  const priv = '/repo/design-style-private';
  assert.deepEqual(hookIssues({ tool_name: 'Bash', cwd: priv, tool_input: { command: 'git commit -m "记录：主人说开头太慢"' } }, project), []);
  assert.deepEqual(hookIssues({ tool_name: 'Bash', cwd: project, tool_input: { command: 'git -C ../design-style-private commit -m "主人说开头太慢"' } }, project), []);
  assert.deepEqual(hookIssues({ tool_name: 'Write', cwd: project, tool_input: { file_path: `${priv}/works/dada.md`, content: '主人说开头太慢' } }, project), []);
});

test('钩子：写公开文档时检查新内容', () => {
  const write = { tool_name: 'Write', cwd: project, tool_input: { file_path: `${project}/drafts/x/PROCESS.md`, content: '主人看完觉得太慢' } };
  assert.ok(hookIssues(write, project).length > 0);
  const edit = { tool_name: 'Edit', cwd: project, tool_input: { file_path: `${project}/drafts/x/PROCESS.md`, old_string: 'a', new_string: '开头改成 0.2 秒内落下第一张纸' } };
  assert.deepEqual(hookIssues(edit, project), []);
});
