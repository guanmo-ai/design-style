// 把剧本（scene.ts）在每一帧的镜头与玻璃形状导出成 JSON，再画曲线检查起势、过冲、节奏：
//   node scripts/motion_curves.mjs styles/014-liquid-glass/video/scene.ts out.json
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const [, , entry, out] = process.argv;
const tmp = path.resolve('out/.curves.mjs');
fs.mkdirSync('out', {recursive: true});
await build({entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: tmp, logLevel: 'error', external: ['remotion']});
const m = await import(tmp + '?' + Date.now());
const rows = [];
for (let f = 0; f < m.DURATION; f++) {
  const F = m.frameAt(f);
  rows.push({f, cam: F.main, shapes: F.shapes, groups: F.groups.map((g) => ({op: g.opacity, h: g.height, bevel: g.bevel})), ripples: F.ripples.length, devices: F.devices.length});
}
fs.writeFileSync(out, JSON.stringify(rows));
console.log('frames', rows.length);
