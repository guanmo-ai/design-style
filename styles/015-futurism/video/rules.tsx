/**
 * 五条规则（850—1100）+ 片尾的一句话（1100—1176）
 *
 * 一张卡 = 一条规则，每张卡用自己的方法演示自己。换卡是动量交接（牛顿摆）：
 *   新卡从左边匀减速冲进来，碰到正中那张的一瞬间，旧卡以 1.15 倍的速度被撞出右边，新卡接着刹停在正中。
 *   第一张撞走的是“今天”那一章的手机和网页；片尾那张卡自己起步冲出右边，FUTURISM 再从左边冲进来 = 第 0 帧。
 */
import React from 'react';
import {C, ONOMA} from '../tokens';
import {Echoes, ForceLines, Txt, W, Word, echoCount, layout, wdthOf} from './kit';
import {clamp, ease, kin, land, path1, prog, vel} from './motion';

export const CW = 1440;
export const CH = 680;
const CX = 960;
const CY = 560;
const IN = 28; // 进场用时
const N = 6; // 5 条规则 + 片尾一句
export const STOPS = [0, 1, 2, 3, 4, 5].map((i) => 872 + 50 * i);
const FROM = -900;

/** 第 i 张卡的中心 x */
const enterX = (i: number, t: number) => path1(t, [[STOPS[i] - IN, FROM, (2 * (CX - FROM)) / IN], [STOPS[i], CX, 0]]);
// 新卡在 STOPS[i] − IN 从画面左外侧出发
/** 新卡的右边碰到旧卡左边（中心 −CW）的时刻与速度 */
const contact = (i: number) => {
  const edge = (i === 0 ? 150 : CX - CW / 2) - CW / 2;
  let t = STOPS[i] - IN;
  while (t < STOPS[i] && enterX(i, t) < edge) t += 0.02;
  return {t, v: 1.15 * vel((u) => enterX(i, u), t)};
};
const CONTACT = [0, 1, 2, 3, 4, 5].map(contact);
/** 片尾那张卡：1148 起势，1156 起以 a = 6 冲出右边（1182 前连残影一起离开画面） */
const LAUNCH = 1148;
export const cardX = (i: number, t: number) => {
  if (i === N - 1) {
    if (t < LAUNCH) return enterX(i, t);
    if (t < LAUNCH + 8) return CX - 30 * ease.sine(prog(t, LAUNCH, 8));
    return kin(t, CX - 30, 0, [[LAUNCH + 8, 6]]);
  }
  const next = CONTACT[i + 1];
  if (t < next.t) return enterX(i, t);
  return CX + next.v * (t - next.t);
};
/** “今天”那一章被第一张卡撞走的位移 */
export const pushToday = (t: number) => (t < CONTACT[0].t ? 0 : CONTACT[0].v * (t - CONTACT[0].t));
const alive = (i: number, t: number) => t >= STOPS[i] - IN - 1 && cardX(i, t) - CW / 2 < W + 40;

/* ───────── 卡上的演示（ta = 卡停下之后过了几帧） ───────── */
type Demo = React.FC<{ta: number}>;
const Clip: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg x={-CW / 2 + 40} y={-70} width={CW - 80} height={380} viewBox={`${-CW / 2 + 40} -70 ${CW - 80} 380`} overflow="hidden">
    {children}
  </svg>
);
const sqX = (u: number) => path1(u, [[4, -600, 2 * 1000 / 18], [22, 400, 0]]);
const Demo1: Demo = ({ta}) => (
  <Clip>
    <Echoes t={ta} state={(u) => [sqX(u)]} render={(u, k) => <rect x={sqX(u) - 70} y={40} width={140} height={140} fill={k ? C.orange : C.paperHi} />} />
    <Txt x={sqX(ta) + 110} y={128} size={34} fam="mono" w={700} fill={C.orange}>
      {`残影 ${echoCount(ta, (u) => [sqX(u)], 2)} 层`}
    </Txt>
  </Clip>
);
const ballX = (u: number) => path1(u, [[-30, -1300, 30], [24, 320, 0]]);
const Demo2: Demo = ({ta}) => {
  const lbl = ['1', '.6', '.36', '.22', '.13', '.08', '.05'];
  return (
    <Clip>
      <Echoes t={ta} state={(u) => [ballX(u)]} render={(u, k) => <circle cx={ballX(u)} cy={150} r={62} fill={k ? C.orange : C.paperHi} />} />
      {lbl.map((l, k) => {
        const x = ballX(ta - 3 * k);
        if (k > 0 && Math.abs(x - ballX(ta)) < 30) return null;
        return (
          <Txt key={k} x={x} y={52} size={28} fam="mono" w={700} anchor="middle" fill={k ? C.orange : C.paperHi} opacity={Math.pow(0.6, k) * 0.6 + 0.4}>
            {l}
          </Txt>
        );
      })}
    </Clip>
  );
};
const goX = (u: number) => kin(u, -600, 0, [[2, 2.4], [27, 0]]);
const Demo3: Demo = ({ta}) => {
  const v = Math.abs(vel(goX, ta));
  return (
    <Clip>
      <Echoes t={ta} state={(u) => [goX(u)]} render={(u, k) => <Word text="GO" x={goX(u)} y={230} size={240} wdth={wdthOf(vel(goX, u))} fill={k ? C.orange : C.paperHi} />} />
      <Txt x={-CW / 2 + 60} y={296} size={30} fam="mono" w={700} fill={C.silver}>
        {`v ${v.toFixed(0).padStart(2, ' ')} px/帧  →  wdth ${wdthOf(v).toFixed(0)}`}
      </Txt>
    </Clip>
  );
};
const dotX = (u: number) => path1(u, [[-6, -900, 90], [24, 520, 0]]);
const Demo4: Demo = ({ta}) => (
  <Clip>
    <ForceLines
      front={{x: dotX(ta) + 40, y: 150}}
      dir={0}
      v={vel(dotX, ta)}
      spec={[
        {off: -220, w: 70, fill: C.orange},
        {off: -130, w: 30, fill: C.paperHi},
        {off: -50, w: 56, fill: C.cobalt},
        {off: 40, w: 24, fill: C.paperHi},
        {off: 130, w: 60, fill: C.orange},
        {off: 220, w: 34, fill: C.silver},
      ]}
      kLen={14}
      gap={30}
    />
    <circle cx={dotX(ta)} cy={150} r={44} fill={C.paperHi} />
  </Clip>
);
const Demo5: Demo = ({ta}) => {
  const words = ['ZANG', 'TUMB', 'TUMB', 'tumb'];
  const sizes = ONOMA.sizes.map((s) => Math.round(s * 0.5));
  let x = -CW / 2 + 70;
  return (
    <Clip>
      {words.map((w, i) => {
        const at = 2 + i * 6;
        const g = land(ta, at, 10);
        const L = layout(w, sizes[i], 100, 900);
        const x0 = x;
        x += L.width + 34;
        if (g <= 0.001) return null;
        return (
          <g key={i}>
            <g transform={`translate(${x0} 230) scale(${(1.5 - 0.5 * Math.min(1, g)).toFixed(3)}) translate(${-x0} -230)`} opacity={clamp(g * 3)}>
              <Word text={w} x={x0} y={230} size={sizes[i]} wdth={100} fill={i === 0 ? C.orange : C.paperHi} />
            </g>
            <Txt x={x0} y={296} size={28} fam="mono" w={700} fill={C.silver} opacity={clamp(g * 3)}>
              {`${sizes[i]}${i < 3 ? '  ÷1.5' : ''}`}
            </Txt>
          </g>
        );
      })}
    </Clip>
  );
};

const CARDS: {n: string; a: string; b: string; D?: Demo}[] = [
  {n: '01', a: '动的才有残影', b: '停下就一层都不剩', D: Demo1},
  {n: '02', a: '第 k 层 = k·Δt 前的样子', b: 'Δt = 3 帧 · 不透明度 0.6^k', D: Demo2},
  {n: '03', a: '字宽 = 速度', b: 'Archivo wdth 62（停）→ 125（全速）', D: Demo3},
  {n: '04', a: '力线收向前方', b: '楔形 · 最多 6 条 · 长度 ∝ 速度', D: Demo4},
  {n: '05', a: '拟声：越响越大', b: '每远一级，字号 ÷ 1.5', D: Demo5},
  {n: '', a: '动的东西，留下它刚才的样子。', b: '015 · 未来主义 FUTURISM · 1909—1944'},
];

const Card: React.FC<{i: number; t: number; k: number}> = ({i, t, k}) => {
  if (!alive(i, t)) return null;
  const x = cardX(i, t);
  const c = CARDS[i];
  if (k) return <rect x={x - CW / 2} y={CY - CH / 2} width={CW} height={CH} fill={C.orange} />;
  const ta = t - STOPS[i];
  const end = i === N - 1;
  return (
    <g transform={`translate(${x.toFixed(1)} ${CY})`}>
      <rect x={-CW / 2} y={-CH / 2} width={CW} height={CH} fill={C.ink} />
      {end ? (
        <>
          <Txt x={0} y={-10} size={82} anchor="middle" fill={C.paperHi}>
            {c.a}
          </Txt>
          <Txt x={0} y={80} size={30} fam="mono" w={700} anchor="middle" fill={C.orange} ls={0.06}>
            {c.b}
          </Txt>
          <Txt x={0} y={250} size={24} fam="mono" w={400} anchor="middle" fill={C.silver} ls={0.04}>
            Design Style · @guanmo_ai
          </Txt>
        </>
      ) : (
        <>
          <Txt x={-CW / 2 + 60} y={-232} size={44} fam="mono" w={700} fill={C.orange}>
            {c.n}
          </Txt>
          <Txt x={-CW / 2 + 160} y={-226} size={68} fill={C.paperHi}>
            {c.a}
          </Txt>
          <Txt x={-CW / 2 + 162} y={-166} size={32} w={500} fill={C.silver}>
            {c.b}
          </Txt>
          {c.D && <c.D ta={ta} />}
        </>
      )}
    </g>
  );
};

export const Rules: React.FC<{t: number}> = ({t}) => (
  <g>
    {[0, 1, 2, 3, 4, 5].map((i) =>
      alive(i, t) || alive(i, t - 18) ? <Echoes key={i} t={t} state={(u) => [cardX(i, u)]} render={(u, k) => <Card i={i} t={u} k={k} />} /> : null,
    )}
  </g>
);

const current = (t: number) => {
  let c = 0;
  for (let i = 0; i < N; i++) if (t >= STOPS[i] - IN) c = i;
  return c;
};
export const rulesProbe = (t: number) => {
  const i = current(t);
  const v = vel((u) => cardX(i, u), t);
  return {v, wdth: wdthOf(v), n: echoCount(t, (u) => [cardX(i, u)], 3)};
};
export const rulesSpeed = (t: number) => {
  let v = 0;
  for (let i = 0; i < N; i++) if (alive(i, t)) v = Math.max(v, Math.abs(vel((u) => cardX(i, u), t)));
  return v;
};
