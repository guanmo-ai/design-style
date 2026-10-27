/**
 * 013 · Art Deco —— 五条规则：五块牌子从纵深里翻转着飞到面前（中间一块先到，再两边一对、一对），
 * 落稳时光顺着牌子的三线框跑一圈，牌子里的母题自己动起来。最后五块一起朝镜头冲过去，露出片尾。
 */
import React from 'react';
import {E, clamp, tween} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';
import {AT} from './timeline';
import {AX, Diamond, G, Streak, T, TripleRect, flareK, Flare, mirror, stepHalf, stepRect} from './ui';

const R0 = AT.rules;
const RULES: [string, string][] = [
  ['中轴', 'AXIS'],
  ['阶梯', 'ZIGGURAT'],
  ['放射', 'SUNBURST'],
  ['三线', 'TRIPLE LINE'],
  ['金线', 'GOLD LINE'],
];
const ORDER = [2, 1, 0, 1, 2];
const TW = 250;
const TH = 290;
const TY = 330;

const Motif: React.FC<{i: number; cx: number; cy: number; p: number}> = ({i, cx, cy, p}) => {
  if (p <= 0) return null;
  if (i === 0) {
    const d = tween(p, 0, 0.5);
    const sp = tween(p, 0.4, 0.4);
    return (
      <g>
        <path d={`M${cx} ${cy - 96} V${cy - 96 + 192 * d}`} stroke={G} strokeWidth={5} />
        {[-1, 1].map((s) => (
          <path key={s} d={`M${cx + s * 18 * sp} ${cy - 96} V${cy + 96}`} stroke={G} strokeWidth={1.8} opacity={sp} />
        ))}
        {[-1, 1].map((s) => (
          <path key={`c${s}`} d={`M${cx + s * 40} ${cy - 34} L${cx + s * (40 + 40 * sp)} ${cy} L${cx + s * 40} ${cy + 34}`} fill="none" stroke={G} strokeWidth={2} opacity={sp} />
        ))}
        <Diamond x={cx} y={cy} r={15 * sp} fill={C.goldLt} />
      </g>
    );
  }
  if (i === 1)
    return (
      <g>
        {[0, 1, 2, 3, 4].map((k) => {
          const g = clamp(p * 5.5 - k);
          const hw = 92 - k * 18;
          const y = cy + 80 - (k + 1) * 30;
          return g > 0 ? <rect key={k} x={cx - hw * (0.6 + 0.4 * g)} y={y + 30 * (1 - g)} width={2 * hw * (0.6 + 0.4 * g)} height={30 * g} fill="none" stroke={G} strokeWidth={k === 0 ? 3 : 1.6} /> : null;
        })}
      </g>
    );
  if (i === 2) {
    const R = 104;
    return (
      <g>
        {Array.from({length: 13}, (_, k) => {
          const g = E.out(clamp(p * 1.6 - Math.abs(k - 6) * 0.06));
          const a = -Math.PI / 2 + ((k - 6) / 6.5) * (Math.PI / 2) * g;
          return <path key={k} d={`M${cx} ${cy + 64} L${(cx + R * Math.cos(a)).toFixed(1)} ${(cy + 64 + R * Math.sin(a)).toFixed(1)}`} stroke={G} strokeWidth={1.5} />;
        })}
        <path d={`M${cx - 40} ${cy + 64} A40 40 0 0 1 ${cx + 40} ${cy + 64} Z`} fill="url(#goldFill)" opacity={clamp(p * 3)} />
        <path d={`M${cx - 112} ${cy + 64} H${cx + 112}`} stroke={G} strokeWidth={2} />
      </g>
    );
  }
  if (i === 3) {
    const ws = [5, 1.8, 1.8];
    return (
      <g>
        {ws.map((w, k) => {
          const d = stepHalf(cx, cy - 86 + k * 13, 74 - k * 13, 172 - k * 26, 12 - k * 3);
          const q = clamp(p * 1.6 - k * 0.2);
          return [0, 1].map((m) => <path key={`${k}${m}`} d={d} fill="none" stroke={G} strokeWidth={w} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - q} transform={m ? mirror(cx) : undefined} />);
        })}
      </g>
    );
  }
  return (
    <g>
      {[0, 1, 2, 3].map((k) => {
        const q = clamp(p * 2 - k * 0.2);
        return <path key={k} d={`M${cx - 82} ${cy - 40 + k * 26} L${cx} ${cy - 72 + k * 26} L${cx + 82} ${cy - 40 + k * 26}`} fill="none" stroke={G} strokeWidth={k === 0 ? 4 : 1.6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - q} />;
      })}
      <path d={stepRect(cx - 58, cy + 56, 116, 32, 5)} fill="url(#goldFill)" opacity={clamp(p * 2 - 1)} />
    </g>
  );
};

export const Rules: React.FC<{f: number}> = ({f}) => {
  if (f < R0 - 2 || f > AT.title + 2) return null;
  const exit = tween(f, AT.title - 26, 26, 0, 1, E.in);
  const head = tween(f, R0 + 4, 18, 0, 1, E.out) * (1 - exit);
  return (
    <g>
      <g transform={`translate(${AX} 0) scale(${head} 1) translate(${-AX} 0)`} opacity={head}>
        <T x={AX - 30} y={236} size={60} family={FONT.serif} weight={600} fill={G} ls={0.24} anchor="end">
          五条规则
        </T>
        <Diamond x={AX} y={216} r={9} />
        <T x={AX + 30} y={234} size={34} weight={600} fill={C.ivory} ls={0.36}>
          FIVE RULES
        </T>
      </g>
      {RULES.map(([zh, en], i) => {
        const cx = AX + (i - 2) * 312;
        const cy = TY + TH / 2;
        const at = R0 + 8 + ORDER[i] * 15;
        const fly = tween(f, at, 26, 0, 1, E.out);
        if (fly <= 0) return null;
        // 飞进来：从画面中心的纵深处，边转边放大
        const s = (0.12 + 0.88 * fly) * (1 + 2.6 * exit);
        const x = AX + (cx - AX) * fly * (1 + 2.4 * exit);
        const y = 540 + (cy - 540) * fly;
        const ang = (1 - fly) * 200;
        const sx = Math.cos((ang * Math.PI) / 180);
        const skew = Math.sin((ang * Math.PI) / 180) * 12;
        const back = sx < 0;
        const live = clamp(tween(f, at + 22, 40));
        const sp = tween(f, at + 18, 26, 0, 1, E.out);
        return (
          <g key={i} opacity={1 - exit} transform={`translate(${x} ${y}) scale(${s * sx} ${s}) skewY(${skew}) translate(${-cx} ${-cy})`}>
            <path d={stepRect(cx - TW / 2, TY, TW, TH, 12)} fill={back ? C.onyx2 : C.onyx} />
            <TripleRect x={cx - TW / 2} y={TY} w={TW} h={TH} s={12} k={0.6} />
            {back ? (
              <Diamond x={cx} y={cy} r={30} fill={C.goldDk} />
            ) : (
              <>
                <Motif i={i} cx={cx} cy={cy} p={live} />
                {[0, 1].map((m) => (
                  <Streak key={m} d={stepHalf(cx, TY, TW / 2, TH, 12)} p={sp} w={2.4} len={0.2} tf={m ? mirror(cx) : undefined} />
                ))}
                <g opacity={clamp(tween(f, at + 16, 14))}>
                  <T x={cx} y={TY + TH + 96} size={66} family={FONT.serif} weight={600} fill={G} ls={0.2} anchor="middle">
                    {zh}
                  </T>
                  <T x={cx} y={TY + TH + 140} size={22} weight={600} fill={C.smoke} ls={0.3} anchor="middle">
                    {en}
                  </T>
                </g>
              </>
            )}
          </g>
        );
      })}
      <Flare x={AX} y={TY + TH / 2} k={flareK(f, R0 + 30, 26) * 0.7} />
    </g>
  );
};
