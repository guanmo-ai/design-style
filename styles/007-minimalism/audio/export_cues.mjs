// 把 video/cues.ts 里的所有时间点打包成 audio/cues.json，供 make_music.py 对位使用
// 用法：node styles/007-minimalism/audio/export_cues.mjs
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = path.join(here, '.cues.tmp.mjs');
await build({
  entryPoints: [path.join(here, '..', 'video', 'cues.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: tmp,
  jsx: 'automatic',
  logLevel: 'error',
});
const {CUES} = await import(pathToFileURL(tmp).href);
fs.rmSync(tmp);
fs.writeFileSync(path.join(here, 'cues.json'), JSON.stringify(CUES) + '\n');
console.log('wrote', path.join(here, 'cues.json'));
