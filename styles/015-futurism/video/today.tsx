/**
 * 07 今天 · App 与网页（698—900）
 *
 *   698—724  镜头从手机屏幕里退出来（上一章俯冲的灭点就是这块屏幕）
 *   724—790  骑行页：速度 0 → 48 km/h —— 数字越来越宽（wdth 跟速度走）、残影越拉越开（间距 = 速度 × Δt）、
 *            背后的力线变长；路线上只有“现在”那个点拖残影；758 按下冲刺键：按钮往前一冲，留下 3 层残影
 *   768—780  网页从右边冲进来刹停
 *   786—814  网页快速滚动再刹停：吸顶的大标题字宽 = 滚动速度，残影沿滚动方向拖；停下压窄
 *   812—     代码从遮罩里升起：font-variation-settings + text-shadow 两行就能做
 *   ~860     第一张规则卡撞进来，把手机和网页一起撞出右边
 */
import React from 'react';
import {C} from '../tokens';
import {Echoes, Rise, Txt, W, Word, Wedge, echoCount, mixHex, wdthOf, zoomLerp} from './kit';
import {clamp, ease, kin, lerp, path1, prog, vel} from './motion';
import {pushToday} from './rules';

const PH = {x: 200, y: 60, w: 480, h: 960};
const PS = 0.86; // 手机整体缩小，给左上角的署名让位
const PT = {x: 150, y: 214}; // 缩小后手机左上角
const BR = {x: 700, y: 214, w: 1080, h: 790};
const f1 = (v: number) => v.toFixed(1);

/** 速度（km/h）：起步 → 48 → 冲刺到 56 → 回到 48 */
const kmh = (t: number) => {
  const a = 48 * ease.inOut(prog(t, 726, 30));
  const b = 8 * Math.sin(Math.PI * clamp((t - 758) / 26));
  return a + b;
};
const numWdth = (t: number) => wdthOf(kmh(t) * 1.15);
const scrollY = (t: number) => kin(t, 0, 0, [[786, 3.2], [800, -3.2], [814, 0]]);
const scrollV = (t: number) => vel(scrollY, t);
const browserDX = (t: number) => path1(t, [[766, 1300, -2 * 1300 / 14], [780, 0, 0]]);
const btnDX = (t: number) => 22 * Math.sin(Math.PI * clamp((t - 758) / 8)) * (t < 762 ? 1 : 1);

/** 镜头：从屏幕里退出来（以屏幕中心为原点，4.6 倍 → 1 倍） */
const zoomOut = (t: number) => zoomLerp(5.2, 1, ease.out(prog(t, 698, 26)));

/* ───────── 手机：骑行页 ───────── */
const route = (p: number) => {
  // 一段 S 形路线（手机局部坐标）
  const x = 50 + p * 360;
  const y = 700 - 90 * Math.sin(p * Math.PI * 1.6) - p * 120;
  return [x, y];
};
const routeP = (t: number) => clamp(0.15 + 0.0011 * Math.max(0, t - 726) * (kmh(t) / 30 + 0.2));
const Phone: React.FC<{t: number}> = ({t}) => {
  const s = kmh(t);
  const L = s / 48;
  const gap = s * 0.55;
  const wd = numWdth(t);
  const n = String(Math.round(s));
  return (
    <g transform={`translate(${PH.x} ${PH.y})`}>
      <rect x={-6} y={-6} width={PH.w + 12} height={PH.h + 12} rx={70} fill={mixHex(C.ink, C.silver, 0.35)} />
      <rect width={PH.w} height={PH.h} rx={64} fill={C.ink} />
      <svg x={14} y={14} width={PH.w - 28} height={PH.h - 28} viewBox={`14 14 ${PH.w - 28} ${PH.h - 28}`} overflow="hidden">
        <Wedge a={{x: 0, y: 200}} b={{x: 40 + 430 * L, y: 420}} w0={190} fill={C.cobalt} />
        <Wedge a={{x: 0, y: 560}} b={{x: 40 + 430 * L, y: 450}} w0={150} fill={C.orange} />
        <Wedge a={{x: 0, y: 650}} b={{x: 40 + 430 * L, y: 490}} w0={60} fill={C.silver} opacity={0.35} />
        <Txt x={48} y={70} size={22} fam="mono" w={700} fill={C.paperHi}>
          07:42
        </Txt>
        <Txt x={48} y={136} size={22} w={700} fill={C.silver} ls={0.08}>
          RIDE · 第 12 公里
        </Txt>
        {[6, 5, 4, 3, 2, 1, 0].map((k) =>
          k > 0 && gap * k < 0.6 ? null : (
            <Word key={k} text={n} x={440 - gap * k} y={470} size={236} wdth={wd} anchor="end" fill={k ? C.orange : C.paperHi} opacity={Math.pow(0.6, k)} />
          ),
        )}
        <Txt x={440} y={516} size={22} fam="mono" w={700} anchor="end" fill={C.paperHi}>
          {`KM/H · wdth ${wd.toFixed(0)}`}
        </Txt>
        <path d={Array.from({length: 41}, (_, i) => route(i / 40)).map((p, i) => `${i ? 'L' : 'M'}${f1(p[0])},${f1(p[1])}`).join(' ')} fill="none" stroke={C.silver} strokeOpacity={0.5} strokeWidth={6} strokeLinecap="round" />
        <Echoes
          t={t}
          state={(u) => route(routeP(u))}
          render={(u, k) => {
            const p = route(routeP(u));
            return <circle cx={p[0]} cy={p[1]} r={16} fill={k ? C.orange : C.paperHi} />;
          }}
        />
        {[
          ['平均', '31.6', 90],
          ['爬升', '412', 75],
          ['心率', '152', 105],
        ].map(([l, v, w], i) => (
          <g key={i}>
            <Txt x={48 + i * 146} y={790} size={18} w={700} fill={C.silver}>
              {l as string}
            </Txt>
            <Word text={v as string} x={48 + i * 146} y={846} size={50} wdth={w as number} fill={C.paperHi} />
          </g>
        ))}
        <Echoes
          t={t}
          n={3}
          state={(u) => [btnDX(u)]}
          render={(u, k) => (
            <g opacity={k ? 1 : 1}>
              <rect x={48 + btnDX(u)} y={872} width={384} height={70} rx={35} fill={C.orange} />
              {!k && (
                <Txt x={240 + btnDX(u)} y={918} size={26} anchor="middle" fill={C.ink} ls={0.06}>
                  冲刺 SPRINT
                </Txt>
              )}
            </g>
          )}
        />
      </svg>
    </g>
  );
};

/* ───────── 网页：滚得越快，标题越宽 ───────── */
const Browser: React.FC<{t: number; k: number}> = ({t, k}) => {
  if (t < 766) return null;
  const dx = browserDX(t);
  if (k) return <rect x={BR.x + dx} y={BR.y} width={BR.w} height={BR.h} rx={18} fill={C.orange} />;
  const sv = scrollV(t);
  const sy = scrollY(t);
  const wd = wdthOf(sv);
  const g = Math.abs(sv) * 0.7;
  return (
    <g transform={`translate(${f1(BR.x + dx)} ${BR.y})`}>
      <rect width={BR.w} height={BR.h} rx={18} fill={C.paperHi} stroke={C.ink} strokeWidth={6} />
      <rect x={3} y={3} width={BR.w - 6} height={56} rx={15} fill={mixHex(C.paper, C.silver, 0.3)} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={34 + i * 30} cy={31} r={9} fill={i === 0 ? C.orange : C.ink} opacity={i === 0 ? 1 : 0.5} />
      ))}
      <rect x={150} y={14} width={520} height={34} rx={17} fill={C.paperHi} />
      <Txt x={172} y={39} size={20} fam="mono" w={400} fill={C.mute}>
        futurism.design/manifesto
      </Txt>
      <svg x={3} y={62} width={BR.w - 6} height={BR.h - 65} viewBox={`3 62 ${BR.w - 6} ${BR.h - 65}`} overflow="hidden">
        {/* 滚动的内容 */}
        <g transform={`translate(0 ${f1(-sy)})`}>
          {Array.from({length: 14}, (_, i) => {
            const y = 300 + i * 120;
            return (
              <g key={i}>
                <rect x={60} y={y} width={i % 3 === 0 ? 300 : 0} height={96} fill={[C.orange, C.cobalt, C.ink][i % 3]} />
                <rect x={i % 3 === 0 ? 390 : 60} y={y + 12} width={i % 3 === 0 ? 560 : 880} height={18} fill={C.ink} opacity={0.75} />
                <rect x={i % 3 === 0 ? 390 : 60} y={y + 48} width={i % 3 === 0 ? 470 : 760} height={14} fill={C.mute} opacity={0.5} />
                <rect x={i % 3 === 0 ? 390 : 60} y={y + 74} width={i % 3 === 0 ? 380 : 620} height={14} fill={C.mute} opacity={0.5} />
              </g>
            );
          })}
        </g>
        {/* 吸顶的标题：字宽 = 滚动速度，残影沿滚动方向 */}
        <rect x={3} y={62} width={BR.w} height={210} fill={C.paperHi} />
        {[6, 5, 4, 3, 2, 1, 0].map((kk) =>
          kk > 0 && g * kk < 0.6 ? null : (
            <Word key={kk} text="VELOCITÀ" x={60} y={232 + g * kk} size={150} wdth={wd} fill={kk ? C.orange : C.ink} opacity={Math.pow(0.6, kk)} />
          ),
        )}
        <rect x={3} y={272} width={BR.w} height={4} fill={C.ink} />
        <Txt x={BR.w - 40} y={110} size={22} fam="mono" w={700} anchor="end" fill={C.orange}>
          {`scroll ${Math.abs(sv).toFixed(0)} px/帧 · wdth ${wd.toFixed(0)}`}
        </Txt>
      </svg>
      <Rise t={t} at={814} box={[30, 490, BR.w - 60, 270]}>
        <rect x={30} y={490} width={BR.w - 60} height={270} rx={10} fill={C.ink} />
        {[
          ['h1 {', C.orange],
          ["  font-variation-settings: 'wdth' calc(62 + 63 * var(--v));", C.paperHi],
          ['  text-shadow: 0 calc(var(--v) * 12px) #F2501C99,', C.paperHi],
          ['               0 calc(var(--v) * 24px) #F2501C5C;', C.paperHi],
          ['}  /* --v = |滚动速度| ÷ 60，每帧由 JS 写入 */', C.silver],
        ].map(([l, c], i) => (
          <Txt key={i} x={58} y={538 + i * 46} size={25} fam="mono" w={700} fill={c}>
            {l}
          </Txt>
        ))}
      </Rise>
    </g>
  );
};

export const Today: React.FC<{t: number}> = ({t}) => {
  const z = zoomOut(t);
  const cx = PH.x + PH.w / 2;
  const cy = PH.y + PH.h / 2;
  const push = pushToday(t);
  return (
    <g transform={`translate(${f1(push)} 0)`}>
      <Echoes
        t={t}
        state={(u) => [pushToday(u)]}
        render={(u, k) =>
          k ? (
            <g transform={`translate(${f1(pushToday(u) - push)} 0)`}>
              <rect x={PT.x} y={PT.y} width={PH.w * PS} height={PH.h * PS} rx={56} fill={C.orange} />
              {u >= 766 && <rect x={BR.x + browserDX(u)} y={BR.y} width={BR.w} height={BR.h} rx={18} fill={C.orange} />}
            </g>
          ) : null
        }
      />
      <g transform={`translate(${f1(lerp(W / 2, PT.x + (PH.w * PS) / 2, ease.out(prog(t, 698, 26))))} ${f1(lerp(540, PT.y + (PH.h * PS) / 2, ease.out(prog(t, 698, 26))))}) scale(${(z * PS).toFixed(4)}) translate(${-cx} ${-cy})`}>
        <Phone t={t} />
      </g>
      {push === 0 ? <Echoes t={t} state={(u) => [browserDX(u)]} render={(u, k) => <Browser t={u} k={k} />} /> : <Browser t={t} k={0} />}
    </g>
  );
};

export const todayProbe = (t: number) => {
  if (t < 784) {
    const v = kmh(t) * 1.15;
    return {v, wdth: wdthOf(v), n: Math.round(6 * clamp(kmh(t) / 10))};
  }
  if (t < 850) {
    const v = scrollV(t);
    return {v, wdth: wdthOf(v), n: echoCount(t, (u) => [scrollV(u) * 4], 3)};
  }
  const v = vel(pushToday, t);
  return {v, wdth: wdthOf(v), n: echoCount(t, (u) => [pushToday(u)], 3)};
};
export const todaySpeed = (t: number) => Math.max(Math.abs(vel(pushToday, t)), Math.abs(vel(browserDX, t)) * (t > 766 ? 1 : 0), t < 712 ? 40 : 0);
