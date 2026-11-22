#!/usr/bin/env node
// 公开仓库的私密内容检查：拦住提交说明、PR / Release 正文和公开文档里
// “转述主人的话、审片结论、本机路径、私人邮箱”这几类写法。
//
// 这里只放写法规则，不放任何真实原话；按原文逐句比对的深度检查在私有仓库。
//
// 用法：
//   node scripts/privacy/check.mjs --text [--scope message|doc] < 文本
//   node scripts/privacy/check.mjs --commits <base>..<head>   检查一段提交说明
//   node scripts/privacy/check.mjs --diff <base>              检查相对 base 新增的文档 / 注释行
//   node scripts/privacy/check.mjs --event                    在 GitHub Actions 里按事件检查
//   node scripts/privacy/check.mjs --hook                     Claude Code PreToolUse 钩子
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OWNER = '(?:主人|观默|老板|作者本人|guanmo)';
const OWNER_WIDE = '(?:主人|观默|老板|作者本人|guanmo|用户)';
const SAY = '(?:说|讲|觉得|认为|反馈|评价|点评|吐槽|嫌|夸|否决|否了|毙了|不满意|不喜欢|原话|拍板|点头|指出|提到|吐露)';
// 文档里“主人的原话 / 评价”常用来指类别，所以文档只认动词。
const SAY_DOC = '(?:说|讲|觉得|认为|吐槽|嫌|夸|否决|否了|毙了|不满意|不喜欢|拍板|点头|指出|提到)';
const DECIDE = '(?:确认|同意|认可|审片通过|看过|听过|希望|想要|要求|满意|喜欢|选了|选中)';

const RULES = [
  {
    id: 'owner-said',
    scopes: ['message'],
    re: new RegExp(`${OWNER}[^。\\n]{0,6}?${SAY}`, 'u'),
    why: '转述了主人的话或评价',
  },
  {
    id: 'owner-said',
    scopes: ['doc'],
    re: new RegExp(`${OWNER}[^。\\n]{0,6}?${SAY_DOC}`, 'u'),
    why: '转述了主人的话或评价',
  },
  {
    id: 'owner-decided',
    scopes: ['message'],
    re: new RegExp(`${OWNER_WIDE}[^。\\n]{0,6}?${DECIDE}`, 'u'),
    why: '写了主人的审片结论或个人意愿',
  },
  {
    id: 'rejected',
    scopes: ['message'],
    re: /(?:被否|被毙|否决|打回|驳回|没通过|未通过|不通过|退回重做)/u,
    why: '写了审片的否决或退回经过',
  },
  {
    id: 'quoted-feedback',
    scopes: ['message', 'doc'],
    re: /(?:反馈|意见|评价|点评|原话|审片|审稿)[^。\n]{0,8}?[：:]\s*[「“"『]/u,
    why: '直接引用了审片反馈',
  },
  {
    id: 'owner-said-en',
    scopes: ['message', 'doc'],
    re: /\b(?:the owner|owner|guanmo)\b[^.\n]{0,24}?\b(?:said|says|felt|feels|thinks|thought|complained|rejected|disliked|liked|approved|wants|wanted|asked for)\b/iu,
    why: 'quotes or reports the owner’s feedback',
  },
  {
    id: 'local-path',
    scopes: ['message', 'doc'],
    re: /(?:\/Users\/[A-Za-z0-9._-]+\/|[A-Za-z]:\\Users\\[A-Za-z0-9._-]+\\)/u,
    why: '含本机用户目录路径',
  },
  {
    id: 'email',
    scopes: ['message', 'doc'],
    re: /(?<![A-Za-z0-9._%+-])(?!(?:you|name|user|hello|someone|me|your\.name)@)[A-Za-z0-9._%+-]+@(?!(?:users\.)?noreply\.github\.com\b|anthropic\.com\b|cursor\.com\b|openai\.com\b|(?:example|site|domain|test)\.(?:com|org|net)\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/u,
    why: '含邮箱地址',
  },
];

// 这些文件里本来就写着规则与示例，不检查它们自己的新增行。
const DOC_SKIP = [/^scripts\/privacy\//, /^tests\/privacy\//, /(?:^|\/)package-lock\.json$/, /(?:^|\/)NOTICE\.md$/, /(?:^|\/)OFL[^/]*\.txt$/i, /(?:^|\/)LICENSE[^/]*$/i];
const DOC_EXT = /\.(?:md|mdx|txt|html?|js|mjs|cjs|ts|tsx|py|sh|json|ya?ml|css)$/i;

export function findIssues(text, scope = 'message') {
  const issues = [];
  const lines = String(text ?? '').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (!rule.scopes.includes(scope)) continue;
      const m = line.match(rule.re);
      if (m) issues.push({ rule: rule.id, why: rule.why, line: i + 1, match: m[0] });
    }
  });
  return issues;
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
}

function commitIssues(range) {
  const out = [];
  const log = git(['log', '--format=%H%x00%B%x01', range]);
  for (const chunk of log.split('\x01')) {
    const [sha, body] = chunk.replace(/^\n/, '').split('\x00');
    if (!sha || body === undefined) continue;
    for (const issue of findIssues(body, 'message')) out.push({ where: `提交 ${sha.slice(0, 8)} 的说明`, ...issue });
  }
  return out;
}

function diffIssues(diffArgs) {
  const out = [];
  const diff = git(['diff', '--unified=0', '--no-color', '--no-ext-diff', ...diffArgs]);
  let file = null;
  let lineNo = 0;
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++ ')) {
      file = raw.startsWith('+++ b/') ? raw.slice(6) : null;
      if (file && (!DOC_EXT.test(file) || DOC_SKIP.some((re) => re.test(file)))) file = null;
      continue;
    }
    const hunk = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (hunk) { lineNo = Number(hunk[1]); continue; }
    if (!file) continue;
    if (raw.startsWith('+')) {
      for (const issue of findIssues(raw.slice(1), 'doc')) out.push({ where: `${file}:${lineNo}`, ...issue, line: lineNo });
      lineNo += 1;
    }
  }
  return out;
}

function report(issues, { annotate = false } = {}) {
  if (!issues.length) {
    console.log('私密内容检查：没有发现问题。');
    return 0;
  }
  console.error(`私密内容检查：发现 ${issues.length} 处需要改写。`);
  for (const it of issues) {
    const msg = `${it.where}：${it.why}（${it.rule}：“${it.match}”）`;
    if (annotate) {
      const [file, line] = /^[^\s：]+:\d+$/.test(it.where) ? it.where.split(':') : [];
      console.error(file ? `::error file=${file},line=${line}::${msg}` : `::error::${msg}`);
    } else {
      console.error(`- ${msg}`);
    }
  }
  console.error('\n公开内容只写作品、做法和验证结果。主人的原话、评价、审片结论和发布授权记到私有仓库 design-style-private。说明见 docs/COLLAB.md。');
  return 1;
}

const ZERO = /^0+$/;

function eventIssues() {
  const name = process.env.GITHUB_EVENT_NAME;
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const issues = [];
  const text = (where, value) => {
    for (const issue of findIssues(value, 'message')) issues.push({ where, ...issue });
  };
  if (name === 'pull_request' || name === 'pull_request_target') {
    const pr = event.pull_request;
    text(`PR #${pr.number} 标题`, pr.title);
    text(`PR #${pr.number} 正文`, pr.body);
    const base = pr.base.sha;
    const head = pr.head.sha;
    issues.push(...commitIssues(`${base}..${head}`));
    issues.push(...diffIssues([`${base}...${head}`]));
  } else if (name === 'push') {
    const before = event.before;
    const after = event.after;
    if (ZERO.test(after)) return issues;
    let range = null;
    if (before && !ZERO.test(before)) {
      try { git(['cat-file', '-e', `${before}^{commit}`]); range = [before, after]; } catch { range = null; }
    }
    if (range) {
      issues.push(...commitIssues(`${range[0]}..${range[1]}`));
      issues.push(...diffIssues([range[0], range[1]]));
    } else {
      // 新分支或历史不全：检查事件里列出的提交说明，再看最新一个提交的改动。
      for (const c of event.commits ?? []) text(`提交 ${String(c.id).slice(0, 8)} 的说明`, c.message);
      let parent = null;
      try { parent = git(['rev-parse', '--verify', '--quiet', `${after}~1`]).trim(); } catch { parent = null; }
      if (parent) issues.push(...diffIssues([parent, after]));
    }
  } else if (name === 'release') {
    const rel = event.release;
    text(`Release ${rel.tag_name} 标题`, rel.name);
    text(`Release ${rel.tag_name} 正文`, rel.body);
  } else if (name === 'issue_comment' || name === 'pull_request_review_comment') {
    text('评论', event.comment?.body);
  } else if (name === 'pull_request_review') {
    text('审阅', event.review?.body);
  }
  return issues;
}

// ---- Claude Code 钩子 ----------------------------------------------------
// 在 Claude 执行 git commit / gh 写操作、或写公开仓库里的文件之前检查。

const PUBLISH_CMD = /\b(?:git\s+(?:-C\s+\S+\s+)?(?:commit|tag|notes)|gh\s+(?:api|pr|release|issue|gist))\b/u;

export function hookIssues(input, projectDir) {
  const tool = input.tool_name;
  const ti = input.tool_input ?? {};
  const cwd = input.cwd ?? projectDir;
  const issues = [];
  const isPrivate = (p) => /design-style-private/.test(p ?? '');
  if (tool === 'Bash') {
    const cmd = String(ti.command ?? '');
    if (!PUBLISH_CMD.test(cmd) || isPrivate(cmd) || isPrivate(cwd)) return issues;
    if (/\bgh\s+api\b/.test(cmd) && !/(?:-X|--method)\s*(?:POST|PATCH|PUT)|\s-[fF]\s|--field|--raw-field|--input/.test(cmd)) return issues;
    for (const issue of findIssues(cmd, 'message')) issues.push({ where: '命令里的说明文字', ...issue });
    const files = [...cmd.matchAll(/(?:--body-file|--notes-file|--file|-F|--input)\s*=?\s*(?:[\w.-]+=)?@?(['"]?)([^\s'"]+)\1/g)].map((m) => m[2]);
    for (const f of files) {
      const p = path.resolve(cwd, f);
      if (existsSync(p) && !isPrivate(p)) {
        try { for (const issue of findIssues(readFileSync(p, 'utf8'), 'message')) issues.push({ where: f, ...issue }); } catch { /* 二进制或不可读 */ }
      }
    }
  } else if (tool === 'Write' || tool === 'Edit' || tool === 'MultiEdit') {
    const file = path.resolve(cwd, String(ti.file_path ?? ''));
    const root = path.resolve(projectDir);
    if (isPrivate(file) || !file.startsWith(root + path.sep)) return issues;
    const rel = path.relative(root, file);
    if (!DOC_EXT.test(rel) || DOC_SKIP.some((re) => re.test(rel))) return issues;
    const text = tool === 'Write' ? ti.content : tool === 'Edit' ? ti.new_string : (ti.edits ?? []).map((e) => e.new_string).join('\n');
    for (const issue of findIssues(text, 'doc')) issues.push({ where: rel, ...issue });
  }
  return issues;
}

function runHook() {
  let input;
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { return 0; }
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const issues = hookIssues(input, projectDir);
  if (!issues.length) return 0;
  const lines = issues.map((it) => `- ${it.where}：${it.why}（“${it.match}”）`).join('\n');
  console.error(`这段要公开的文字里有私密内容，已拦下：\n${lines}\n改写成只写作品、做法和验证结果；主人的原话、评价和审片结论记到私有仓库 design-style-private（见 docs/COLLAB.md）。`);
  return 2;
}

function main(argv) {
  const has = (f) => argv.includes(f);
  const val = (f) => argv[argv.indexOf(f) + 1];
  if (has('--hook')) return runHook();
  if (has('--event')) return report(eventIssues(), { annotate: true });
  if (has('--commits')) return report(commitIssues(val('--commits')));
  if (has('--diff')) return report(diffIssues([val('--diff')]));
  if (has('--text')) {
    const scope = has('--scope') ? val('--scope') : 'message';
    return report(findIssues(readFileSync(0, 'utf8'), scope).map((it) => ({ where: `第 ${it.line} 行`, ...it })));
  }
  console.error('用法见文件开头的注释。');
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
