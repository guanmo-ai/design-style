/**
 * 014 · 液态玻璃 Liquid Glass —— 20 秒短片（第三版）
 *
 * 每一帧（运动快时取 2—6 个子帧求平均 = 运动模糊）：
 *   1. 按镜头画世界（planes.ts）；穿过玻璃时再画一张“下一个世界”给镜片取样
 *   2. 有设备时：手机 / 浏览器屏幕各画一张，各自过一遍玻璃着色器进离屏缓冲，压上自适应颜色的字，
 *      再用单应矩阵以 3D 透视贴进内容（gl.ts 的 QUAD）
 *   3. 主玻璃着色器：涟漪、光池（影子 + 焦散）、折射、色散、磨砂、高光
 *   4. 最上面一层画布：压在主玻璃上的字与图标
 * 剧本见 scene.ts，分镜见 STORYBOARD.md。渲染要加 --gl=swangle。
 */
import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Renderer} from './gl';
import {BROWSER, PHONE, drawBrowser, drawPhone, drawPlane} from './planes';
import {DURATION, DeviceFrame, Frame, Label, frameAt, speedAt} from './scene';

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

const mk = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const lum = (d: Uint8ClampedArray) => {
  let s = 0;
  for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  return s / (d.length / 4) / 255;
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
  } else if (kind === 'home') {
    c.moveTo(x - s * 0.36, y - s * 0.02);
    c.lineTo(x, y - s * 0.36);
    c.lineTo(x + s * 0.36, y - s * 0.02);
    c.lineTo(x + s * 0.24, y - s * 0.02);
    c.lineTo(x + s * 0.24, y + s * 0.32);
    c.lineTo(x - s * 0.24, y + s * 0.32);
    c.lineTo(x - s * 0.24, y - s * 0.02);
    c.closePath();
    c.fill();
  }
};

/** 压在玻璃上的字：color = 'auto' 时读“玻璃后面”（src）在字底下的亮度，0.42 以下转白、0.55 以上转黑 */
const paintLabels = (ov: HTMLCanvasElement, src: HTMLCanvasElement, labels: Label[]) => {
  const c = ov.getContext('2d')!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, ov.width, ov.height);
  const s = src.getContext('2d', {willReadFrequently: true})!;
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
      const bx = Math.max(0, Math.min(src.width - 1, Math.round(x0)));
      const by = Math.max(0, Math.min(src.height - 1, Math.round(y0)));
      const L = lum(s.getImageData(bx, by, Math.max(1, Math.min(src.width - bx, Math.round(w))), Math.max(1, Math.min(src.height - by, Math.round(l.size)))).data);
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

type Res = {
  r: Renderer;
  main: HTMLCanvasElement;
  alt: HTMLCanvasElement;
  phone: HTMLCanvasElement;
  browser: HTMLCanvasElement;
  phoneOv: HTMLCanvasElement;
  browserOv: HTMLCanvasElement;
};

const renderSample = (R: Res, F: Frame, t: number, blend: number) => {
  const st = {bend: F.bend, merge: F.merge, rule: F.rule};
  drawPlane(R.main.getContext('2d')!, F.main, t, st);
  let src = R.r.upload('main', R.main);
  let altTex: WebGLTexture | null = null;
  if (F.alt) {
    drawPlane(R.alt.getContext('2d')!, F.alt, t, st);
    altTex = R.r.upload('alt', R.alt);
  }
  const phase = (t / DURATION) * Math.PI * 2;
  if (F.devices.length) {
    const comp = R.r.target('comp', W, H);
    R.r.drawQuad(comp, src, null, null);
    F.devices.forEach((d: DeviceFrame) => {
      const isPhone = d.kind === 'phone';
      const cv = isPhone ? R.phone : R.browser;
      const ov = isPhone ? R.phoneOv : R.browserOv;
      const size = isPhone ? PHONE : BROWSER;
      (isPhone ? drawPhone : drawBrowser)(cv.getContext('2d', {willReadFrequently: true})!, t, d.scroll);
      const tex = R.r.upload(d.kind, cv);
      const fb = R.r.target(`${d.kind}FB`, size.w, size.h);
      R.r.drawGlass(fb, tex, null, d.shapes, d.groups, d.ripples, d.light, phase);
      R.r.mip(fb);
      paintLabels(ov, cv, d.labels);
      const ovTex = R.r.upload(`${d.kind}Ov`, ov);
      R.r.drawQuad(comp, fb.tex!, ovTex, d.dev);
    });
    R.r.mip(comp);
    src = comp.tex!;
  }
  R.r.drawGlass(R.r.screen(), src, altTex, F.shapes, F.groups, F.ripples, F.light, phase, blend);
};

export const LiquidGlass: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 6}) => {
  const f = useCurrentFrame();
  const glRef = useRef<HTMLCanvasElement>(null);
  const ovRef = useRef<HTMLCanvasElement>(null);
  const [res] = useState<{R: Res | null}>(() => ({R: null}));
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
    if (!res.R) {
      res.R = {
        r: new Renderer(glRef.current!),
        main: mk(W, H),
        alt: mk(W, H),
        phone: mk(PHONE.w, PHONE.h),
        browser: mk(BROWSER.w, BROWSER.h),
        phoneOv: mk(PHONE.w, PHONE.h),
        browserOv: mk(BROWSER.w, BROWSER.h),
      };
    }
    const R = res.R;
    // 运动模糊：快门半帧，按这一帧最快的东西决定取几个子帧
    const v = blur > 1 ? speedAt(f) : 0;
    const n = v > 3 ? Math.min(blur, 2 + Math.round(v / 14)) : 1;
    for (let i = 0; i < n; i++) {
      let t = n === 1 ? f : f - 0.5 * (1 - i / (n - 1));
      // 子帧不跨过换平面的那一刻
      if (frameAt(t).main.plane !== frameAt(f).main.plane) t = f;
      renderSample(R, frameAt(t), t, 1 / (i + 1));
    }
    paintLabels(ovRef.current!, R.main, frameAt(f).labels);
    continueRender(h);
  }, [f, ready, res, blur]);
  return (
    <AbsoluteFill style={{background: '#EEEAF6'}}>
      <canvas ref={glRef} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      <canvas ref={ovRef} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      {music && <Audio src={staticFile('014-liquid-glass/music.wav')} />}
    </AbsoluteFill>
  );
};
