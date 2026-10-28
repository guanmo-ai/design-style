/**
 * 014 · 液态玻璃 Liquid Glass —— 20 秒短片
 *
 * 三层画布，每帧从上一帧无关地重画（Remotion 可以乱序、多进程渲染）：
 *   content  Canvas2D：玻璃后面的一切（彩色场、网格、字、手机、网页），镜头甩动时做运动模糊
 *   glass    WebGL2：把 content 当贴图，按玻璃的形状真折射（gl.ts）
 *   overlay  Canvas2D：压在玻璃上面的字与图标；color = 'auto' 的字按玻璃后面的亮度自动选黑 / 白
 * 渲染要加 --gl=swangle（无显卡环境下的 WebGL）。
 */
import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {LIGHT} from '../tokens';
import {drawWorld} from './content';
import {GlassRenderer} from './gl';
import {Label, glassAt} from './glass';
import {DURATION, camV, camX, thumpY} from './timeline';

export const LIQUIDGLASS_DURATION = DURATION;
const W = 1920;
const H = 1080;

let fontsP: Promise<unknown> | null = null;
const loadFonts = () => {
  if (fontsP) return fontsP;
  const L = (family: string, file: string, weight: string) =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  fontsP = Promise.all([
    L('Inter Display', 'InterDisplay-Medium.ttf', '500'),
    L('Inter Display', 'InterDisplay-Bold.ttf', '700'),
    L('Inter', 'Inter-Regular.ttf', '400'),
    L('Inter', 'Inter-Medium.ttf', '500'),
    L('Geist Mono', 'GeistMono-Regular.ttf', '400'),
    L('Geist Mono', 'GeistMono-Medium.ttf', '500'),
    L('Noto Sans SC', 'NotoSansSC-Medium.otf', '500'),
    L('Noto Sans SC', 'NotoSansSC-Bold.otf', '700'),
    L('Noto Sans SC', 'NotoSansSC-Black.otf', '900'),
  ]);
  return fontsP;
};

const mk = (w = W, h = H) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

/** 内容层：镜头快时把 6 个子帧叠起来（第 k 层不透明度 1/k，结果是平均值；不动的像素逐像素不变） */
const paintContent = (content: HTMLCanvasElement, scratch: HTMLCanvasElement, f: number, ro: Record<string, number>) => {
  const ctx = content.getContext('2d')!;
  const v = Math.abs(camV(f));
  const n = v > 3 ? Math.min(8, 3 + Math.round(v / 10)) : 1;
  const dy = thumpY(f);
  const one = (c: CanvasRenderingContext2D, ff: number) => {
    const x = camX(ff);
    c.setTransform(1, 0, 0, 1, -x, dy);
    drawWorld(c, x, f, ro);
    c.setTransform(1, 0, 0, 1, 0, 0);
  };
  if (n === 1) {
    one(ctx, f);
    return;
  }
  const s = scratch.getContext('2d')!;
  for (let i = 0; i < n; i++) {
    const ff = f - 0.6 * (1 - i / (n - 1));
    one(s, ff);
    ctx.globalAlpha = 1 / (i + 1);
    ctx.drawImage(scratch, 0, 0);
  }
  ctx.globalAlpha = 1;
};

const lum = (data: Uint8ClampedArray) => {
  let s = 0;
  for (let i = 0; i < data.length; i += 4) s += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  return s / (data.length / 4) / 255;
};

const icon = (c: CanvasRenderingContext2D, kind: NonNullable<Label['icon']>, x: number, y: number, s: number) => {
  c.beginPath();
  if (kind === 'play') {
    c.moveTo(x - s * 0.3, y - s * 0.38);
    c.lineTo(x + s * 0.42, y);
    c.lineTo(x - s * 0.3, y + s * 0.38);
    c.closePath();
    c.fill();
  } else if (kind === 'prev') {
    c.moveTo(x + s * 0.36, y - s * 0.34);
    c.lineTo(x - s * 0.12, y);
    c.lineTo(x + s * 0.36, y + s * 0.34);
    c.closePath();
    c.fill();
    c.fillRect(x - s * 0.36, y - s * 0.34, s * 0.14, s * 0.68);
  } else if (kind === 'more') {
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.arc(x + i * s * 0.34, y, s * 0.1, 0, Math.PI * 2);
      c.fill();
    }
  } else if (kind === 'search') {
    c.lineWidth = s * 0.12;
    c.arc(x - s * 0.06, y - s * 0.06, s * 0.28, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.lineCap = 'round';
    c.moveTo(x + s * 0.15, y + s * 0.15);
    c.lineTo(x + s * 0.36, y + s * 0.36);
    c.stroke();
  } else if (kind === 'plus') {
    c.fillRect(x - s * 0.36, y - s * 0.06, s * 0.72, s * 0.12);
    c.fillRect(x - s * 0.06, y - s * 0.36, s * 0.12, s * 0.72);
  }
};

const paintOverlay = (ov: HTMLCanvasElement, content: HTMLCanvasElement, labels: Label[]) => {
  const c = ov.getContext('2d')!;
  c.clearRect(0, 0, W, H);
  const src = content.getContext('2d', {willReadFrequently: true})!;
  for (const l of labels) {
    const a = l.alpha ?? 1;
    if (a <= 0.001) continue;
    c.font = `${l.weight ?? 700} ${l.size}px ${l.family ?? "'Noto Sans SC'"}`;
    c.textAlign = l.align ?? 'left';
    let col = l.color ?? '#0B0C10';
    if (col === 'auto') {
      const w = l.icon ? l.size : c.measureText(l.text).width;
      const x0 = l.icon ? l.x - w / 2 : l.align === 'center' ? l.x - w / 2 : l.align === 'right' ? l.x - w : l.x;
      const y0 = l.icon ? l.y - l.size / 2 : l.y - l.size;
      const L = lum(src.getImageData(Math.max(0, Math.round(x0)), Math.max(0, Math.round(y0)), Math.max(1, Math.round(w)), Math.max(1, Math.round(l.size))).data);
      // 0.42 以下转白，0.55 以上转黑，中间按比例过渡
      const t = Math.min(1, Math.max(0, (L - 0.42) / 0.13));
      const v = Math.round(255 * (1 - t) + 11 * t);
      col = `rgb(${v},${v},${Math.round(255 * (1 - t) + 16 * t)})`;
    }
    c.globalAlpha = a;
    c.fillStyle = col;
    c.strokeStyle = col;
    if (l.icon) icon(c, l.icon, l.x, l.y, l.size);
    else c.fillText(l.text, l.x, l.y);
  }
  c.globalAlpha = 1;
};

export const LiquidGlass: React.FC<{music?: boolean}> = ({music = true}) => {
  const f = useCurrentFrame();
  const glRef = useRef<HTMLCanvasElement>(null);
  const ovRef = useRef<HTMLCanvasElement>(null);
  const [res] = useState(() => ({content: null as HTMLCanvasElement | null, scratch: null as HTMLCanvasElement | null, gl: null as GlassRenderer | null}));
  const [ready, setReady] = useState(false);
  const [fontHandle] = useState(() => delayRender('liquid-glass-fonts'));
  useEffect(() => {
    loadFonts().then(() => {
      setReady(true);
      continueRender(fontHandle);
    });
  }, [fontHandle]);
  useEffect(() => {
    if (!ready) return;
    const h = delayRender(`frame-${f}`);
    if (!res.content) {
      res.content = mk();
      res.scratch = mk();
      res.gl = new GlassRenderer(glRef.current!);
    }
    const dy = thumpY(f);
    const g = glassAt(f, dy);
    paintContent(res.content, res.scratch!, f, g.readout);
    // 高光跟着运动偏一点：镜头往右甩，光像是从左边被甩过去
    const a = Math.max(-0.35, Math.min(0.35, -camV(f) * 0.006));
    const lx = LIGHT.x * Math.cos(a) - LIGHT.y * Math.sin(a);
    const ly = LIGHT.x * Math.sin(a) + LIGHT.y * Math.cos(a);
    res.gl!.render(res.content, g.shapes, g.groups, [lx, ly]);
    paintOverlay(ovRef.current!, res.content, g.labels);
    continueRender(h);
  }, [f, ready, res]);
  return (
    <AbsoluteFill style={{background: '#EEEAF6'}}>
      <canvas ref={glRef} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <canvas ref={ovRef} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      {music && <Audio src={staticFile('014-liquid-glass/music.wav')} />}
    </AbsoluteFill>
  );
};
