/**
 * 09:00–11:30 反差：明 / 暗 → 图 / 文 → 静 / 动。
 * 每次换一对，新的一对从中线向两边撕开；一次只选一对——三对都用，就什么都不突出了。
 */
import React from 'react';
import {Img, staticFile} from 'remotion';
import {C} from '../tokens';
import {ChProps, EXPO, Page, RuleTag, clamp, disp, mono, popEase, rgba, sc, tween} from './ui';
import type {SeamStyle} from './SplitScreen';

export const T1 = 56; // 明暗 → 图文 的撕开起点（局部帧）
export const T2 = 98; // 图文 → 静动
const OPEN = 18;

export const contrastSeam = (f: number): SeamStyle => (f < T1 + 8 ? {line: null, pillBg: C.blue, pillFg: C.paper} : f < T2 + 8 ? {line: null, pillBg: C.ink, pillFg: C.paper} : {line: null, pillBg: C.paper, pillFg: C.ink});

// WCAG 对比度（相对亮度）
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const CONTRAST = (lum(C.paper) + 0.05) / (lum(C.ink) + 0.05);

const Photo: React.FC<{src: string; pos?: string}> = ({src, pos = '50% 50%'}) => (
  <Img src={staticFile(`02-masonry/photos/${src}.jpg`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos}} />
);
const Label: React.FC<{x: number; y: number; fg: string; bg?: string; children: React.ReactNode}> = ({x, y, fg, bg, children}) => (
  <div style={{position: 'absolute', left: x, top: y, padding: bg ? '8px 14px' : 0, background: bg, color: fg, ...mono(22, 700, 0.14)}}>{children}</div>
);

/** 一对状态的一半：bg + 内容。坐标是整幅画面的坐标，X 是中线 */
const Half: React.FC<{k: number; L: boolean; f: number; X: number}> = ({k, L, f, X}) => {
  const cx = L ? X / 2 : X + (1920 - X) / 2;
  const base = k === 0 ? (L ? C.paper : C.ink) : k === 1 ? (L ? C.ink : C.paper) : L ? C.ink : C.ink;
  return (
    <div style={{position: 'absolute', inset: 0, background: base}}>
      {k === 0 && (
        <>
          <div style={{position: 'absolute', left: cx - 400, top: 150, width: 800, textAlign: 'center', color: L ? C.ink : C.paper, ...sc(780, 900), lineHeight: 1}}>{L ? '明' : '暗'}</div>
          <Label x={L ? 96 : X + 64} y={170} fg={L ? C.grey : C.peri}>{L ? 'LIGHT · #F1EDE4' : 'DARK · #0E0E10'}</Label>
        </>
      )}
      {k === 1 && (
        <>
          {L ? (
            <>
              <div style={{position: 'absolute', left: 0, top: 0, width: X, height: 1080, overflow: 'hidden'}}>
                <Photo src="cat" pos="50% 40%" />
              </div>
              <Label x={96} y={170} fg={C.ink} bg={C.paper}>{'IMAGE'}</Label>
            </>
          ) : (
            <>
              <div style={{position: 'absolute', left: X + 64, top: 150, color: C.ink, ...disp(560, 100, -0.05)}}>{'Aa'}</div>
              <div style={{position: 'absolute', left: X + 72, top: 760, width: 1920 - X - 144, color: C.ink, ...sc(36, 500), lineHeight: 1.6}}>{'一个字，就能把话说出声。'}</div>
              <Label x={X + 64} y={170} fg={C.grey}>{'TYPE'}</Label>
            </>
          )}
        </>
      )}
      {k === 2 && (
        <>
          {L ? (
            <>
              <div style={{position: 'absolute', left: 0, top: 0, width: X, height: 1080, overflow: 'hidden'}}>
                <Photo src="bread" pos="50% 50%" />
              </div>
              <Label x={96} y={170} fg={C.ink} bg={C.paper}>{'STILL'}</Label>
            </>
          ) : (
            <>
              {[0, 1, 2, 3].map((r) => {
                const dir = r % 2 === 0 ? -1 : 1;
                const sp = 3.2 + r * 0.9;
                const per = 340;
                const off = ((f * sp * dir) % per) - per;
                return (
                  <div key={r} style={{position: 'absolute', left: X + off, top: 250 + r * 160, width: 3400, height: 150, display: 'flex', whiteSpace: 'nowrap', color: r % 2 === 0 ? C.paper : C.blue, ...sc(150, 900), lineHeight: '150px'}}>
                    {Array.from({length: 11}).map((_, i) => (
                      <span key={i} style={{width: per / 2, textAlign: 'center', flexShrink: 0}}>{'动'}</span>
                    ))}
                  </div>
                );
              })}
              <Label x={X + 64} y={170} fg={C.ink} bg={C.paper}>{'MOTION'}</Label>
            </>
          )}
        </>
      )}
    </div>
  );
};

export const Contrast: React.FC<ChProps> = (p) => {
  const {f, side, X} = p;
  const L = side === 'L';
  const k = f >= T2 ? 2 : f >= T1 ? 1 : 0;
  const prev = Math.max(0, k - 1);
  const t0 = k === 2 ? T2 : T1;
  const t = k === 0 ? 1 : tween(f, t0, OPEN, 0, 1, EXPO);
  // 新的一对从中线向两边撕开
  const inset = L ? `inset(0 0 0 ${X * (1 - t)}px)` : `inset(0 ${(1920 - X) * (1 - t)}px 0 0)`;
  const front = L ? X * (1 - t) : X + (1920 - X) * t;
  const edgeColor = k === 1 ? C.blue : k === 2 ? C.peri : C.blue;
  const act = k;
  const names = ['明暗', '图文', '静动'];
  const tag = k === 1 ? C.ink : C.paper;
  return (
    <Page p={p} bg={L ? C.paper : C.ink}>
      {/* 旧的一对在底下，新的一对从中线撕开 */}
      <Half k={k === 0 ? 0 : prev} L={L} f={f} X={X} />
      {k > 0 && (
        <div style={{position: 'absolute', inset: 0, clipPath: inset}}>
          <Half k={k} L={L} f={f} X={X} />
        </div>
      )}
      {k > 0 && t < 1 && <div style={{position: 'absolute', left: front - 5, top: 0, width: 10, height: 1080, background: edgeColor}} />}

      {/* 规则角标：放在一块纸色底上，照片上也看得清 */}
      {L && (
        <div style={{position: 'absolute', left: 96, top: 62, padding: k === 0 ? 0 : '12px 18px', background: k === 0 ? 'transparent' : C.paper, marginLeft: k === 0 ? 0 : -18, marginTop: k === 0 ? 0 : -12}}>
          <RuleTag f={f} n={3} title="两边要有反差" fg={C.ink} sub={C.grey} />
        </div>
      )}
      {!L && (
        <div style={{position: 'absolute', right: 64, top: 62, color: tag, ...mono(22, 700, 0.14), opacity: tween(f, 10, 12)}}>{'一次只选一对'}</div>
      )}

      {/* 对比度读数（只在明暗这一对出现） */}
      {k === 0 && (
        <div style={{position: 'absolute', left: X - 150, top: 880, width: 300, height: 64, background: C.blue, color: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${tween(f, 22, 12, 0, 1, popEase)})`, ...mono(26, 700), zIndex: 20}}>{`${CONTRAST.toFixed(1)} : 1`}</div>
      )}

      {/* 三对的进度：跨过中线的一条蓝色药丸 */}
      <div style={{position: 'absolute', left: X - 260, top: 968, width: 520, height: 72, background: C.blue, display: 'flex', zIndex: 20, transform: `scaleX(${tween(f, 14, 12, 0, 1, EXPO)})`}}>
        {names.map((n, i) => (
          <div key={i} style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i === act ? C.paper : 'transparent', color: i === act ? C.blue : C.paper, ...sc(32, 900)}}>
            {n}
          </div>
        ))}
      </div>
    </Page>
  );
};
