// 起一个新片子的空架子：node drafts/_lib/kit/new_film.mjs <英文短名> "<标题>"  →  drafts/<短名>/film/
// 生成的是一支能直接渲的 8 秒小片（时间轴、场景、HUD、配乐、出片脚本都接好了），把它改成你的片子。
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const [, , name, title = name] = process.argv;
if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) { console.error('用法：node drafts/_lib/kit/new_film.mjs <英文短名，小写字母 / 数字 / 连字符> "<标题>"'); process.exit(1); }
const here = dirname(fileURLToPath(import.meta.url)), src = join(here, 'template'), dst = join(here, '..', '..', name, 'film');
if (existsSync(dst)) { console.error(`已经有 ${dst} 了，不覆盖。`); process.exit(1); }
mkdirSync(dst, { recursive: true });
for (const f of readdirSync(src)) { writeFileSync(join(dst, f), readFileSync(join(src, f), 'utf8').replaceAll('__NAME__', name).replaceAll('__TITLE__', title)); if (f.endsWith('.sh')) chmodSync(join(dst, f), 0o755); }
console.log(`好了：drafts/${name}/film/\n  预览  PREVIEW=1 bash drafts/${name}/film/make.sh\n  出片  bash drafts/${name}/film/make.sh\n  组件说明  drafts/_lib/kit/README.md`);
