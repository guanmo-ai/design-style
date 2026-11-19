// 达达 · 出图。不用浏览器：Node 里直接画，原始像素送进 ffmpeg。
//   node render.mjs still <出图目录> <帧号…>            全质量单帧（PNG）
//   node render.mjs sheet <out.jpg> <起> <止> <步长> [列数=6] [宽=480]   联系表
//   node render.mjs film  <out.mp4> [音乐.wav] [起=0] [止=END]         成片（4 个子帧做运动模糊）
//   node render.mjs events <events.json>
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, W, H } from './kit.mjs';
import { render, events, END } from './scene.mjs';

const cv = createCanvas(W, H), X = cv.getContext('2d'), tmp = createCanvas(W, H), TX = tmp.getContext('2d');
const grain = createCanvas(W, H);
{ const g = grain.getContext('2d'), im = g.createImageData(W, H); let s = 7;
  for (let i = 0; i < W * H; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = (s >> 8) & 255; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0); }
const SUB = +(process.env.SUB ?? 5), SHUTTER = .6;
const vig = createCanvas(W, H);
{ const g = vig.getContext('2d'), gr = g.createRadialGradient(W / 2, H / 2, 560, W / 2, H / 2, 1180); gr.addColorStop(0, 'rgba(18,10,0,0)'); gr.addColorStop(1, 'rgba(18,10,0,.24)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
function frame(f) {
  for (let i = 0; i < SUB; i++) {
    const t = f + (SUB > 1 ? SHUTTER * (i / (SUB - 1) - .5) : 0);
    if (i === 0) render(X, t);
    else { render(TX, t); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1 / (i + 1); X.drawImage(tmp, 0, 0); X.globalAlpha = 1; }
  }
  X.setTransform(1, 0, 0, 1, 0, 0); X.drawImage(vig, 0, 0); X.save(); X.globalCompositeOperation = 'overlay'; X.globalAlpha = .06; X.drawImage(grain, 0, 0); X.restore();   // 固定的胶片颗粒（不随帧变，压缩友好）
  return cv;
}

const [, , mode, out, ...rest] = process.argv;
if (mode === 'events') { fs.writeFileSync(out, JSON.stringify(events())); console.log('wrote', out); }
else if (mode === 'still') {
  fs.mkdirSync(out, { recursive: true });
  for (const f of rest.map(Number)) { fs.writeFileSync(path.join(out, String(f).padStart(4, '0') + '.png'), frame(f).toBuffer('image/png')); }
  console.log('wrote', rest.length, 'stills');
} else if (mode === 'sheet') {
  const [a, b, step, cols = 6, tw_ = 480] = rest.map(Number), fr = []; for (let f = a; f < b; f += step) fr.push(f);
  const th = Math.round(tw_ * H / W), rows = Math.ceil(fr.length / cols), sh = createCanvas(cols * tw_, rows * th), sx = sh.getContext('2d');
  fr.forEach((f, i) => { const X0 = (i % cols) * tw_, Y0 = Math.floor(i / cols) * th; sx.drawImage(frame(f), X0, Y0, tw_, th); sx.fillStyle = '#000'; sx.fillRect(X0, Y0, 62, 22); sx.fillStyle = '#fff'; sx.font = '16px Arch'; sx.fillText(String(f), X0 + 5, Y0 + 17); });
  fs.writeFileSync(out, sh.toBuffer('image/jpeg', 88)); console.log('wrote', out, fr.length, 'frames');
} else if (mode === 'grid') {          // node render.mjs grid <out.jpg> <列数> <单格宽> <帧号…>：挑几帧拼在一起看
  const [cols, tw_, ...fr] = rest.map(Number), th = Math.round(tw_ * H / W), rows = Math.ceil(fr.length / cols), sh = createCanvas(cols * tw_, rows * th), sx = sh.getContext('2d');
  fr.forEach((f, i) => { const X0 = (i % cols) * tw_, Y0 = Math.floor(i / cols) * th; sx.drawImage(frame(f), X0, Y0, tw_, th); sx.fillStyle = '#000'; sx.fillRect(X0, Y0, 70, 26); sx.fillStyle = '#fff'; sx.font = '19px Arch'; sx.fillText(String(f), X0 + 6, Y0 + 20); });
  fs.writeFileSync(out, sh.toBuffer('image/jpeg', 90)); console.log('wrote', out, fr.length, 'frames');
} else if (mode === 'film') {
  const wav = rest[0] && rest[0] !== '-' ? rest[0] : null, a = +(rest[1] ?? 0), b = +(rest[2] ?? END);
  const args = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-framerate', '60', '-i', 'pipe:0'];
  if (wav) args.push('-ss', String(a / 60), '-i', wav);
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', process.env.CRF ?? '17', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-vf', 'scale=out_color_matrix=bt709');
  if (wav) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push('-movflags', '+faststart', out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = a; f < b; f++) {
    const buf = Buffer.from(frame(f).data());
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - a + 1) % 120 === 0) console.log(`${f - a + 1}/${b - a}  ${((Date.now() - t0) / (f - a + 1)).toFixed(0)} ms/帧`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`wrote ${out} · ${b - a} 帧 · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
} else console.log('用法见文件开头');
