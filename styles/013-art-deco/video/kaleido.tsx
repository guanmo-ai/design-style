/**
 * 013 · Art Deco —— 02 放射：十二瓣万花筒（1930 年代巴斯比·伯克利歌舞片的俯拍）。
 * 只画半个扇区（15°），镜像 + 旋转复制成 24 份：规矩还是“镜像”。
 * 扇、人字、菱形从中心按指数往外流（无限放大的错觉），每拍一次脉冲；转满一个扇区（30°）停下，竖直中轴回来；
 * 然后射线从中心射出去；最后整片塌成地平线上的太阳——下一章的天际线从它前面升起来。
 */
import React from 'react';
import {E, SNAP, clamp, spr, tween} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';
import {AT} from './timeline';
import {AX, Diamond, Flare, G, H, Plaque, T, W, flareK, mix} from './ui';

const K = AT.kaleido;
const CY = 540;
const DEG = Math.PI / 180;
const P = (r: number, a: number) => `${(r * Math.sin(a * DEG)).toFixed(1)} ${(-r * Math.cos(a * DEG)).toFixed(1)}`;

/** 一个元素：放在半径 r、扇区中线上；大小跟 r 成正比 */
const Elem: React.FC<{j: number; r: number}> = ({j, r}) => {
  const s = r * 0.24;
  const kind = ((j % 3) + 3) % 3;
  const open = clamp((r - 70) / 140);
  const fade = clamp((1500 - r) / 400);
  if (kind === 0) {
    // 扇：从一根线打开成半圆，扇骨 7 根
    const half = 80 * open;
    return (
      <g transform={`translate(0 ${-r})`} opacity={fade}>
        <path d={`M0 0 L${P(s, -half)} A${s} ${s} 0 0 1 ${P(s, half)} Z`} fill={mix(C.emerald, C.onyx, 0.75)} stroke={G} strokeWidth={Math.max(1, s * 0.03)} />
        {Array.from({length: 7}, (_, k) => {
          const a = -half + (2 * half * (k + 0.5)) / 7;
          return <path key={k} d={`M0 0 L${P(s, a)}`} stroke={G} strokeWidth={Math.max(0.6, s * 0.012)} />;
        })}
        <path d={`M${P(s * 0.45, -half)} A${s * 0.45} ${s * 0.45} 0 0 1 ${P(s * 0.45, half)}`} fill="none" stroke={G} strokeWidth={Math.max(0.6, s * 0.012)} />
      </g>
    );
  }
  if (kind === 1) {
    // 人字：三道，一粗两细，尖朝外
    return (
      <g transform={`translate(0 ${-r})`} opacity={fade}>
        {[0, 1, 2].map((k) => {
          const y = -k * s * 0.22;
          const w = s * 0.75;
          return <path key={k} d={`M${-w} ${y + w * 0.45} L0 ${y} L${w} ${y + w * 0.45}`} fill="none" stroke={G} strokeWidth={Math.max(0.8, s * (k === 0 ? 0.05 : 0.02))} />;
        })}
      </g>
    );
  }
  // 菱形 + 一段弧：漆红只在这里出现
  return (
    <g opacity={fade}>
      <path d={`M${P(r, -15)} A${r} ${r} 0 0 1 ${P(r, 15)}`} fill="none" stroke={G} strokeWidth={Math.max(0.8, s * 0.025)} />
      <g transform={`translate(${r * Math.sin(15 * DEG)} ${-r * Math.cos(15 * DEG)}) rotate(15)`}>
        <Diamond x={0} y={0} r={s * 0.16} fill={C.lacquer} />
        <Diamond x={0} y={0} r={s * 0.08} fill={C.goldLt} />
      </g>
      <circle cx={0} cy={-r} r={s * 0.06} fill={C.ivory} />
    </g>
  );
};

/** 半个扇区（0—15°，中线朝上） */
const Half: React.FC<{f: number}> = ({f}) => {
  const u = (f - K) * 0.0125; // 每 55 帧半径翻一倍
  const du = 0.42;
  const flow = 1 - tween(f, K + 150, 30);
  const items: React.ReactNode[] = [];
  if (flow > 0) {
    const j0 = Math.floor((u - Math.log(1600 / 50)) / du);
    for (let j = j0; j < j0 + 12; j++) {
      const r = 50 * Math.exp(u - j * du);
      if (r < 40 || r > 1600) continue;
      items.push(<Elem key={j} j={j} r={r} />);
    }
  }
  // 射线：从中心射出去，三条一组，相隔一个十六分音符
  const rays = [2.5, 7.5, 12.5].map((a, i) => ({a, p: tween(f, K + 150 + i * 4, 22, 0, 1, E.out)}));
  return (
    <g>
      <path d={`M0 0 L${P(1500, 0)} L${P(1500, 7.5)} Z`} fill={mix(C.gold, C.onyx, 0.05)} />
      <path d={`M${P(60, 15)} L${P(1500, 15)}`} stroke={G} strokeWidth={2.4} />
      <g opacity={flow}>{items}</g>
      {rays.map(({a, p}) =>
        p > 0 ? <path key={a} d={`M${P(70, a)} L${P(70 + 1400 * p, a)}`} stroke={a === 7.5 ? C.goldLt : C.gold} strokeWidth={a === 7.5 ? 2.6 : 1.4} /> : null,
      )}
    </g>
  );
};

export const Kaleido: React.FC<{f: number}> = ({f}) => {
  if (f < K - 2 || f > AT.city + 4) return null;
  const reveal = tween(f, K, 30, 90, 1500, E.out);
  const rot = 30 * tween(f, K + 30, 120, 0, 1, E.inOut);
  const ph = ((f - K) % 30 + 30) % 30;
  const pulse = 1 + 0.03 * Math.exp(-ph / 6) * (f < K + 150 ? 1 : 0);
  // 塌缩：整片缩成太阳，地面从下面升到地平线
  const col = tween(f, K + 180, 30, 0, 1, E.inOut);
  const scale = pulse * (1 - 0.88 * col);
  const ground = tween(f, K + 178, 26, H, CY, E.inOut);
  const med = (f < K + 26 ? 0 : spr(f, K + 26, SNAP)) * (1 - tween(f, K + 168, 12, 0, 1, E.in));
  const sun = tween(f, K + 186, 24, 0, 1, E.out);
  const uses: React.ReactNode[] = [];
  for (let k = 0; k < 12; k++) {
    uses.push(<use key={`a${k}`} href="#kHalf" transform={`rotate(${30 * k})`} />);
    uses.push(<use key={`b${k}`} href="#kHalf" transform={`rotate(${30 * k}) scale(-1 1)`} />);
  }
  return (
    <g>
      <defs>
        <g id="kHalf">
          <Half f={f} />
        </g>
        <clipPath id="kReveal">
          <circle cx={0} cy={0} r={reveal} />
        </clipPath>
      </defs>
      <g transform={`translate(${AX} ${CY}) scale(${scale}) rotate(${rot})`} opacity={1 - tween(f, K + 196, 14) * 0.7}>
        <g clipPath="url(#kReveal)">{uses}</g>
      </g>
      {sun > 0 && <circle cx={AX} cy={CY} r={170 * sun} fill="url(#sunDisc)" />}
      {/* 中心的圆牌 */}
      {med > 0.01 && (
        <g transform={`translate(${AX} ${CY}) scale(${med})`}>
          <circle r={150} fill={C.onyx} />
          {[0, 1, 2].map((k) => (
            <circle key={k} r={150 - k * 10} fill="none" stroke={G} strokeWidth={k ? 1.6 : 4} />
          ))}
          <T x={0} y={14} size={72} family={FONT.serif} weight={600} fill={G} ls={0.12} anchor="middle">
            放射
          </T>
          <T x={0} y={62} size={18} weight={600} fill={C.smoke} ls={0.4} anchor="middle">
            SUNBURST
          </T>
        </g>
      )}
      {/* 地面：从下面升到地平线，把太阳的下半截藏起来 */}
      {ground < H && (
        <g>
          <rect x={0} y={ground} width={W} height={H - ground + 2} fill={C.onyx} />
          <path d={`M${AX - 960 * tween(f, K + 196, 20, 0, 1, E.out)} ${ground} H${AX + 960 * tween(f, K + 196, 20, 0, 1, E.out)}`} stroke={G} strokeWidth={3} />
        </g>
      )}
      <Flare x={AX} y={CY} k={flareK(f, K + 150, 30) * 1.2} />
      <Plaque f={f} at={K + 60} out={K + 170} title="放射光芒" sub="光源藏在主体后面，射线要细、要稀" />
    </g>
  );
};
