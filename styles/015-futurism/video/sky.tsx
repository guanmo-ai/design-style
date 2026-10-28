/**
 * 06 天空 · 克拉利《俯冲进城市》1939（598—706）
 *
 *   598—612  上一章冲上天的蒸汽长成一朵云，盖满画面
 *   612—626  云中间破开一个洞，往外扩：底下是城市，正对着往下看
 *   614—690  镜头一路俯冲（高度 7000 → 880，按对数走 = 每帧放大同样的倍数）：
 *            楼顶从灭点往外冲，楼的边全部收向灭点——楼本身就是力线
 *            飞机比镜头冲得更快、越来越远：它的残影是“刚才更近的自己”，所以越近越大
 *   668—690  飞机拉起：先刹住（残影收拢），再冲回镜头、滑出右边
 *   690—706  镜头冲进灭点那栋楼的楼顶——它是一块手机屏幕 → 下一章
 */
import React from 'react';
import {C} from '../tokens';
import {Echoes, H, W, echoCount, mixHex, wdthOf} from './kit';
import {clamp, ease, lerp, path1, prog, vel} from './motion';

const F = 1000; // 焦距
const VP = {x: 960, y: 540};
const f1 = (v: number) => v.toFixed(1);

/** 镜头高度 */
export const camZ = (t: number) => Math.exp(lerp(Math.log(7000), Math.log(880), ease.inOut(prog(t, 612, 92))));

/* ───────── 城市：13 × 13 的街区，中间那栋楼的顶是手机屏幕 ───────── */
type B = {x: number; y: number; w: number; d: number; h: number; roof: string; side: string; phone?: boolean};
const ROOFS = [C.paperHi, C.silver, C.orange, C.cobalt, C.paper, mixHex(C.silver, C.paper, 0.5)];
const BLD: B[] = (() => {
  const out: B[] = [];
  const S = 860;
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      if (i === 0 && j === 0) {
        out.push({x: 0, y: 0, w: 380, d: 820, h: 700, roof: C.ink, side: mixHex(C.ink, C.silver, 0.3), phone: true});
        continue;
      }
      const r = Math.max(Math.abs(i), Math.abs(j));
      const n = Math.abs(i * 7919 + j * 104729 + 13) % 997;
      const h = r <= 1 ? 280 + (n % 300) : 500 + (n % 1900);
      const roof = ROOFS[n % ROOFS.length];
      out.push({x: i * S + ((n % 9) - 4) * 20, y: j * S + ((n % 7) - 3) * 20, w: 420 + (n % 220), d: 420 + ((n * 3) % 220), h, roof, side: mixHex(roof, C.ink, 0.45)});
    }
  }
  return out.sort((a, b) => a.h - b.h);
})();

const proj = (x: number, y: number, z: number, Z: number) => {
  const s = F / Math.max(30, Z - z);
  return [VP.x + x * s, VP.y + y * s];
};
const City: React.FC<{t: number}> = ({t}) => {
  const Z = camZ(t);
  return (
    <g>
      <rect width={W} height={H} fill={C.ink} />
      {BLD.map((b, i) => {
        const h = Math.min(b.h, Z - 40);
        const corners: [number, number][] = [
          [b.x - b.w / 2, b.y - b.d / 2],
          [b.x + b.w / 2, b.y - b.d / 2],
          [b.x + b.w / 2, b.y + b.d / 2],
          [b.x - b.w / 2, b.y + b.d / 2],
        ];
        const base = corners.map(([x, y]) => proj(x, y, 0, Z));
        const top = corners.map(([x, y]) => proj(x, y, h, Z));
        // 屏幕外的楼不画
        const xs = top.map((p) => p[0]).concat(base.map((p) => p[0]));
        const ys = top.map((p) => p[1]).concat(base.map((p) => p[1]));
        if (Math.max(...xs) < -50 || Math.min(...xs) > W + 50 || Math.max(...ys) < -50 || Math.min(...ys) > H + 50) return null;
        const sides = [0, 1, 2, 3].map((k) => {
          const a = k;
          const c = (k + 1) % 4;
          return `${f1(base[a][0])},${f1(base[a][1])} ${f1(base[c][0])},${f1(base[c][1])} ${f1(top[c][0])},${f1(top[c][1])} ${f1(top[a][0])},${f1(top[a][1])}`;
        });
        return (
          <g key={i}>
            {sides.map((s, k) => (
              <polygon key={k} points={s} fill={k % 2 ? b.side : mixHex(b.side, C.ink, 0.25)} />
            ))}
            <polygon points={top.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' ')} fill={b.roof} />
            {b.phone && (
              <polygon
                points={corners
                  .map(([x, y]) => proj(x * 0.86, y * 0.92, h, Z))
                  .map((p) => `${f1(p[0])},${f1(p[1])}`)
                  .join(' ')}
                fill={mixHex(C.ink, C.silver, 0.1)}
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

/* ───────── 飞机：俯视，机头朝灭点 ───────── */
const planeD = (t: number) =>
  path1(t, [
    [612, 520, 0],
    [640, 1200, 40],
    [668, 2600, 0],
    [684, 1300, -60],
  ]);
const planeOX = (t: number) => path1(t, [[666, 0, 0], [684, 1700, 200]]);
const planeOY = (t: number) => 220 + Math.sin((t - 612) / 9) * 40;
const planeRoll = (t: number) => 8 * Math.sin((t - 612) / 14) + (t > 668 ? (t - 668) * 1.6 : 0);
const Plane: React.FC<{t: number; k: number}> = ({t, k}) => {
  if (t < 610 || t > 690) return null;
  const D = planeD(t);
  const s = F / D;
  const x = VP.x + planeOX(t) * s;
  const y = VP.y + planeOY(t) * s;
  const ink = k ? C.orange : C.silver;
  const dark = k ? C.orange : mixHex(C.silver, C.ink, 0.35);
  const sc = s * 1.0;
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(planeRoll(t))}) scale(${sc.toFixed(4)})`}>
      {/* 机翼 */}
      <path d="M-560,-40 L560,-40 L520,60 L-520,60 Z" fill={ink} />
      {!k && <rect x={-470} y={-40} width={90} height={100} fill={C.orange} />}
      {!k && <rect x={380} y={-40} width={90} height={100} fill={C.orange} />}
      {/* 机身：机尾在上、机头朝下（冲向灭点） */}
      <path d="M-55,-420 L55,-420 L70,260 L0,360 L-70,260 Z" fill={dark} />
      <path d="M-210,-420 L210,-420 L190,-350 L-190,-350 Z" fill={ink} />
      {!k && <ellipse cx={0} cy={60} rx={34} ry={60} fill={C.ink} />}
    </g>
  );
};

/* ───────── 云：盖满，再从中间破开 ───────── */
const Cloud: React.FC<{t: number}> = ({t}) => {
  if (t > 630) return null;
  const R = 151 * Math.pow(1.32, Math.max(0, t - 600)); // 指数长大
  const hole = t < 612 ? 0 : 60 * Math.pow(1.38, t - 612);
  const cx = lerp(1360, VP.x, ease.inOut(prog(t, 598, 14)));
  const cy = lerp(540, VP.y, ease.inOut(prog(t, 598, 14)));
  if (hole <= 0) return <circle cx={f1(cx)} cy={f1(cy)} r={f1(R)} fill={C.paperHi} />;
  const big = Math.max(R, 3000);
  return <path d={`M${f1(cx - big)},${f1(cy)} a${big},${big} 0 1,0 ${2 * big},0 a${big},${big} 0 1,0 ${-2 * big},0 Z M${f1(cx - hole)},${f1(cy)} a${f1(hole)},${f1(hole)} 0 1,1 ${f1(2 * hole)},0 a${f1(hole)},${f1(hole)} 0 1,1 ${f1(-2 * hole)},0 Z`} fill={C.paperHi} fillRule="evenodd" />;
};

export const Sky: React.FC<{t: number}> = ({t}) => (
  <g>
    {t >= 610 ? <City t={t} /> : <rect width={W} height={H} fill={C.cobalt} />}
    <Echoes t={t} state={(u) => [planeD(u) / 10, planeOX(u) / 10]} render={(u, k) => <Plane t={u} k={k} />} />
    <Cloud t={t} />
  </g>
);

export const skyProbe = (t: number) => {
  const v = Math.abs(vel(planeD, t)) * 0.4 + Math.abs(vel(planeOX, t)) * 0.2;
  return {v, wdth: wdthOf(v), n: echoCount(t, (u) => [F / planeD(u) * 100, planeOX(u) / 10], 3)};
};
export const skySpeed = (t: number) => {
  const z0 = camZ(t - 0.5);
  const z1 = camZ(t + 0.5);
  return clamp(Math.abs(Math.log(z1 / z0)) * 900, 0, 60);
};
