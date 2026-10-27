/**
 * 12—15 秒 · 05 应用：同一套规则放进真实的界面
 *   f706   整张纸从上面盖下来（带黑边和硬阴影）
 *   f720   浏览器窗口从高处落下；导航、两行巨型标题、贴纸、按钮、三张功能卡依次落进来；底部字幕条一直在走
 *   f786   手机从高处落到右边；余额从 0 数到 3,280；列表三条依次落下；“+ 记一笔”
 *   f832   光标在网页里按“开始使用”→ 吐司“✓ 已加入”
 *   f856   光标到手机里按“+ 记一笔”→ 新条目弹进来，余额跳到 3,262
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {E, clamp, tween} from '../../../src/lib/anim';
import {C, V} from '../tokens';
import {AT} from './timeline';
import {Box, Burst, Cursor, Dots, GLIDE, Star, WHIP, appear, disp, grot, land, lerp, mono, press, sc} from './ui';

const A = AT.apps;
const BR = {x: 96, y: 210, w: 1150, h: 790}; // 浏览器
const PH = {x: 1330, y: 112, w: 470, h: 960}; // 手机
const SC = {x: PH.x + 18, y: PH.y + 18, w: PH.w - 36}; // 手机屏幕
const START = A + 112; // 按“开始使用”
const ADD = A + 136; // 按“+ 记一笔”

/** 从高处落下：越高越大、阴影越长，落地时阴影略短一下再回来 */
const drop = (f: number, at: number, rest: number, from = 70) => ({
  z: land(f, at, rest, from),
  scale: lerp(1.2, 1, tween(f, at - 2, 10, 0, 1, E.out)),
  on: f >= at - 2,
});

const ICON: Record<string, string> = {
  cup: 'M-13 -7 H9 V7 A7 7 0 0 1 2 14 H-6 A7 7 0 0 1 -13 7 Z M9 -2 H13 A5 5 0 0 1 13 8 H9',
  train: 'M-12 -14 H12 V7 H-12 Z M-12 -2 H12 M-7 14 L-4 7 M7 14 L4 7',
  bowl: 'M-15 -1 H15 A15 15 0 0 1 -15 -1 Z M-5 -4 L9 -17 M1 -4 L14 -15',
  tea: 'M-10 -12 H10 L7 14 H-7 Z M-10 -5 H10 M2 -12 L6 -20',
};

const Item: React.FC<{x: number; y: number; w: number; icon: string; name: string; when: string; amt: string; col: string; z: number; scale?: number}> = ({x, y, w, icon, name, when, amt, col, z, scale = 1}) => (
  <Box x={x} y={y} w={w} h={88} fill={C.white} border={4} shadow={6} z={z} scale={scale}>
    <div style={{position: 'absolute', left: 14, top: 14, width: 56, height: 56, boxSizing: 'border-box', background: col, border: `4px solid ${C.ink}`}}>
      <svg width="48" height="48" style={{position: 'absolute', left: 0, top: 0}}>
        <path d={ICON[icon]} transform="translate(24 24)" fill="none" stroke={C.ink} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
    <div style={{position: 'absolute', left: 90, top: 14, ...sc(28, 700)}}>{name}</div>
    <div style={{position: 'absolute', left: 90, top: 52, ...mono(18, 400), opacity: 0.65}}>{when}</div>
    <div style={{position: 'absolute', right: 18, top: 22, ...grot(38, 700)}}>{amt}</div>
  </Box>
);

/** 网页：落地页 */
const Browser: React.FC<{f: number}> = ({f}) => {
  const win = drop(f, A + 2, 14, 110);
  const startP = press(f, START, 6);
  const item = (at: number, rest = 8, from = 60) => drop(f, at, rest, from);
  const nav = item(A + 14, 6, 40);
  const cta1 = item(A + 44, 10);
  const cta2 = item(A + 48, 10);
  const feats = [
    {t: A + 54, fill: C.lime, en: 'BORDER', zh: '黑框'},
    {t: A + 60, fill: C.blue, en: 'SHADOW', zh: '硬影'},
    {t: A + 66, fill: C.orange, en: 'PRESS', zh: '按下'},
  ];
  const tick = (f - A) * 4; // 字幕条一直往左走
  const line = (at: number) => tween(f, at, 12, 0, 1, GLIDE);
  const toast = drop(f, START + 6, 10, 70);
  return (
    <Box x={BR.x} y={BR.y} w={BR.w} h={BR.h} fill={C.white} shadow={14} z={win.z} scale={win.scale}>
      {/* 标题栏 */}
      <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: 64, background: C.yellow, borderBottom: `${V.border}px solid ${C.ink}`}}>
        {[C.orange, C.lime, C.blue].map((c, i) => (
          <div key={i} style={{position: 'absolute', left: 20 + i * 34, top: 18, width: 22, height: 22, boxSizing: 'border-box', background: c, border: `4px solid ${C.ink}`}} />
        ))}
        <div style={{position: 'absolute', left: '50%', top: 10, transform: 'translateX(-50%)', padding: '4px 22px', background: C.white, border: `4px solid ${C.ink}`, ...mono(24, 700)}}>neo-brutal.site</div>
      </div>
      {/* 导航 */}
      {nav.on && (
        <>
          <Box x={36} y={90} w={68} h={68} fill={C.ink} border={0} shadow={0} scale={nav.scale} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{...disp(30, 112, 0), color: C.yellow}}>NB</span>
          </Box>
          <div style={{position: 'absolute', left: 130, top: 106, display: 'flex', gap: 34, opacity: appear(f, A + 16), ...grot(32, 700)}}>
            {['Work', 'Price', 'Blog'].map((t) => (
              <span key={t} style={{borderBottom: `4px solid ${C.ink}`}}>
                {t}
              </span>
            ))}
          </div>
          <Box x={BR.w - 236} y={92} w={196} h={64} fill={C.pink} border={4} shadow={6} z={nav.z} scale={nav.scale} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{...grot(30, 700)}}>Sign up</span>
          </Box>
        </>
      )}
      {/* 标题：两行从下面滑上来 */}
      {[
        ['MAKE IT', A + 20],
        ['HONEST.', A + 26],
      ].map(([t, at], i) => (
        <div key={i} style={{position: 'absolute', left: 36, top: 186 + i * 118, height: 118, width: 720, overflow: 'hidden'}}>
          <div style={{transform: `translateY(${(1 - line(at as number)) * 130}px)`, ...disp(112, 112, -0.03), color: C.ink, lineHeight: '118px'}}>{t}</div>
        </div>
      ))}
      {f >= A + 30 && (
        <Star x={660} y={210} r={64} fill={C.orange} rot={lerp(-140, 14, tween(f, A + 30, 14, 0, 1, E.out))} shadow={8}>
          <span style={{...disp(28, 112, 0)}}>NEW!</span>
        </Star>
      )}
      <div style={{position: 'absolute', left: 40, top: 440, opacity: appear(f, A + 36), transform: `translateY(${(1 - appear(f, A + 36, 10)) * 20}px)`, ...sc(36, 900)}}>黑框、硬影、平涂——不讨好。</div>
      {cta1.on && (
        <Box x={40} y={512} w={340} h={100} fill={C.yellow} shadow={10} z={cta1.z * (1 - startP)} scale={cta1.scale} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span style={{...sc(40, 900)}}>开始使用 →</span>
        </Box>
      )}
      {cta2.on && (
        <Box x={410} y={512} w={190} h={100} fill={C.white} shadow={10} z={cta2.z} scale={cta2.scale} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span style={{...sc(40, 900)}}>文档</span>
        </Box>
      )}
      {/* 功能卡：从右边滑进来，落下 */}
      {feats.map((ft, i) => {
        if (f < ft.t - 12) return null;
        const m = tween(f, ft.t - 12, 12, 0, 1, GLIDE);
        const z = f < ft.t ? 40 : land(f, ft.t, 10, 40);
        return (
          <Box key={i} x={lerp(BR.w + 80, 790, m)} y={100 + i * 166} w={320} h={140} fill={ft.fill} shadow={10} z={z} rot={lerp(8, i === 1 ? 2 : 0, m)}>
            <div style={{position: 'absolute', left: 22, top: 18, ...grot(40, 700)}}>{ft.en}</div>
            <div style={{position: 'absolute', left: 22, top: 74, ...sc(36, 900)}}>{ft.zh}</div>
            <div style={{position: 'absolute', right: 20, top: 16, ...mono(24, 700)}}>{`0${i + 1}`}</div>
          </Box>
        );
      })}
      {/* 吐司 */}
      {toast.on && (
        <Box x={40} y={630} w={420} h={70} fill={C.lime} border={4} shadow={8} z={toast.z} scale={toast.scale} rot={-2} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span style={{...sc(34, 900)}}>✓ 已加入 · 欢迎</span>
        </Box>
      )}
      {/* 字幕条 */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, background: C.ink, overflow: 'hidden', opacity: appear(f, A + 10, 6)}}>
        <div style={{position: 'absolute', left: -(tick % 640), top: 14, display: 'flex', ...grot(36, 700), color: C.yellow, whiteSpace: 'nowrap'}}>
          {Array.from({length: 6}, (_, i) => (
            <span key={i} style={{width: 640}}>
              BORDER ✦ SHADOW ✦ FLAT ✦ GRID ✦
            </span>
          ))}
        </div>
      </div>
    </Box>
  );
};

/** 手机：记账 App */
const Phone: React.FC<{f: number}> = ({f}) => {
  const ph = drop(f, A + 68, 14, 120);
  if (!ph.on) return null;
  const rot = lerp(5, 0, tween(f, A + 66, 14, 0, 1, E.out));
  const count = Math.round(3280 * E.out(tween(f, A + 78, 16, 0, 1)));
  const added = f >= ADD + 4 ? clamp(tween(f, ADD + 4, 12, 0, 1, GLIDE) * 1.0) : 0;
  const balance = f >= ADD + 6 ? Math.round(lerp(3280, 3262, tween(f, ADD + 6, 10))) : count;
  const addP = press(f, ADD, 6);
  const W = SC.w - 52;
  const items = [
    {icon: 'cup', name: '咖啡', when: '今天 08:12', amt: '−32', col: C.pink},
    {icon: 'train', name: '地铁', when: '今天 08:40', amt: '−4', col: C.lime},
    {icon: 'bowl', name: '午饭', when: '昨天 12:30', amt: '−46', col: C.orange},
  ];
  const s = ph.z - 14; // 抬起来时整台手机往左上浮
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translate(${-s}px, ${-s}px) rotate(${rot}deg) scale(${ph.scale})`, transformOrigin: `${PH.x + PH.w / 2}px ${PH.y + PH.h / 2}px`}}>
      <div style={{position: 'absolute', left: PH.x + ph.z, top: PH.y + ph.z, width: PH.w, height: PH.h, borderRadius: 64, background: C.ink}} />
      <div style={{position: 'absolute', left: PH.x, top: PH.y, width: PH.w, height: PH.h, borderRadius: 64, background: C.ink}} />
      <div style={{position: 'absolute', left: SC.x, top: SC.y, width: SC.w, height: PH.h - 36, borderRadius: 48, background: C.paper, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 34, top: 26, ...mono(22, 700)}}>9:41</div>
        <div style={{position: 'absolute', left: 30, top: 76, ...sc(46, 900)}}>十月</div>
        <div style={{position: 'absolute', left: 132, top: 94, ...mono(24, 700)}}>/ 2026</div>
        <Box x={SC.w - 90} y={70} w={62} h={62} fill={C.white} border={4} shadow={5} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span style={{...grot(46, 700)}}>+</span>
        </Box>
        {(() => {
          const d = drop(f, A + 76, 10, 50);
          return d.on ? (
            <Box x={26} y={160} w={W} h={186} fill={C.yellow} shadow={10} z={d.z} scale={d.scale}>
              <div style={{position: 'absolute', left: 22, top: 20, ...mono(22, 700)}}>BALANCE · 本月可用</div>
              <div style={{position: 'absolute', left: 20, top: 58, ...grot(82, 700, -0.04)}}>{`¥${balance.toLocaleString('en-US')}`}</div>
              <div style={{position: 'absolute', left: 22, right: 22, top: 140, height: 26, boxSizing: 'border-box', border: `4px solid ${C.ink}`, background: C.white}}>
                <div style={{width: `${62 * tween(f, A + 78, 16, 0, 1, E.out)}%`, height: '100%', background: C.ink}} />
              </div>
            </Box>
          ) : null;
        })()}
        {['全部', '餐饮', '交通'].map((t, i) => {
          const d = drop(f, A + 82 + i * 2, i === 0 ? 0 : 5, 30);
          if (!d.on) return null;
          return (
            <Box key={t} x={26 + i * 128} y={380} w={116} h={56} fill={i === 0 ? C.ink : [C.ink, C.pink, C.lime][i]} border={4} shadow={i === 0 ? 0 : 5} z={d.z} r={28} scale={d.scale} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{...sc(26, 700), color: i === 0 ? C.paper : C.ink}}>{t}</span>
            </Box>
          );
        })}
        <div style={{position: 'absolute', left: 0, top: 466, width: SC.w, height: 3 * 104 + 8, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: -466, width: SC.w, height: 2000}}>
            {f >= ADD + 4 && <Item x={26} y={470} w={W} icon="tea" name="奶茶" when="刚刚" amt="−18" col={C.blue} z={land(f, ADD + 10, 6, 40)} scale={lerp(0.3, 1, added)} />}
            {items.map((it, i) => {
              const d = drop(f, A + 88 + i * 4, 6, 40);
              if (!d.on) return null;
              return <Item key={it.name} x={26} y={470 + i * 104 + 104 * added} w={W} {...it} z={d.z} scale={d.scale} />;
            })}
          </div>
        </div>
        {(() => {
          const d = drop(f, A + 102, 10, 50);
          return d.on ? (
            <Box x={26} y={800} w={W} h={92} fill={C.pink} shadow={10} z={d.z * (1 - addP)} scale={d.scale} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{...sc(40, 900)}}>+ 记一笔</span>
            </Box>
          ) : null;
        })()}
      </div>
    </div>
  );
};

export const Apps: React.FC<{f: number}> = ({f}) => {
  // 整张纸从上面盖下来
  const enter = tween(f, A - 14, 14, 0, 1, WHIP);
  const moving = enter < 1;
  const push = 1 + 0.025 * tween(f, A, 180, 0, 1, E.inOut);
  // 光标：进场 → 按“开始使用” → 飞到手机按“+ 记一笔”
  const startXY = {x: BR.x + 40 + 260, y: BR.y + 512 + 64};
  const addXY = {x: SC.x + 26 + (SC.w - 52) * 0.7, y: SC.y + 800 + 60};
  let cur = {x: 1980, y: 1140};
  if (f >= A + 98) {
    const k = tween(f, A + 98, 12, 0, 1, GLIDE);
    cur = {x: lerp(1980, startXY.x, k), y: lerp(1140, startXY.y, k)};
  }
  if (f >= START + 8) {
    const k = tween(f, START + 8, 14, 0, 1, GLIDE);
    cur = {x: lerp(startXY.x, addXY.x, k), y: lerp(startXY.y, addXY.y, k)};
  }
  const curP = Math.max(press(f, START, 6), press(f, ADD, 6));
  return (
    <AbsoluteFill style={{transform: `translateY(${(1 - enter) * -1150}px)`}}>
      <div style={{position: 'absolute', left: -V.border, top: -V.border, width: 1920 + 2 * V.border, height: 1080 + 2 * V.border, background: C.paper, border: `${V.border}px solid ${C.ink}`, boxShadow: moving ? `0 24px 0 ${C.ink}` : undefined, overflow: 'hidden'}}>
        <Dots />
      </div>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${push})`, transformOrigin: '50% 55%'}}>
        <div style={{position: 'absolute', left: 96, top: 116, height: 50, padding: '0 18px', display: 'flex', alignItems: 'center', background: C.ink, color: C.paper, transform: `translateX(${(1 - tween(f, A + 4, 12, 0, 1, GLIDE)) * -500}px)`, ...mono(24, 700, 0.06)}}>
          05 / IN USE
        </div>
        <div style={{position: 'absolute', left: 330, top: 104, opacity: appear(f, A + 8), ...sc(60, 900)}}>网页 · App</div>
        <Browser f={f} />
        <Phone f={f} />
        {f >= A + 98 && <Cursor x={cur.x} y={cur.y} p={curP} opacity={1 - tween(f, ADD + 24, 8)} />}
        <Burst x={startXY.x} y={startXY.y} f={f} at={START} />
        <Burst x={addXY.x} y={addXY.y} f={f} at={ADD} />
      </div>
    </AbsoluteFill>
  );
};
