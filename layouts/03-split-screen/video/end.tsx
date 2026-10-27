/**
 * 17:30–20:00 片尾：海报被横着切开 → 中线转回竖直 → 五个词，每个词穿一种风格。
 * 进片尾时中线还是横的：上半是瑞士的“Spli”，下半是波普的“t”和爆炸框；中线转回竖直的 40 帧里，海报一点点“正”过来。
 * 最后一拍之后，五个词一个接一个落到海报下面：包豪斯（转着缩进来）· 瑞士（平滑滑入）· 波普（啪地拍上）· 新粗野（阴影从长变短）· 孟菲斯（掉下来压扁回弹）。
 */
import React from 'react';
import {ChProps, EXPO, clamp, mono, tween} from './ui';
import {BH, MC, Mem, NC, NV, Neo, PC, Pop, SW} from './kit';
import {Poster} from './intro';
import type {SeamStyle} from './SplitScreen';

export const endSeam = (_f: number): SeamStyle => ({line: '#111111', width: 6, pillBg: '#111111', pillFg: '#F5F4F0'});

const WORD_AT = 62;
const WORD_STEP = 14;
const ROW_Y = 944;
const BOX = [
  {x: 760, w: 200, text: '一条中线'},
  {x: 984, w: 170, text: '比例'},
  {x: 1178, w: 190, text: '反差!'},
  {x: 1392, w: 260, text: '固定与滚动'},
  {x: 1676, w: 200, text: '上下叠'},
];
const font = "'Noto Sans SC', sans-serif";
const H = 86;

export const End: React.FC<ChProps> = (p) => {
  const {f, side} = p;
  const L = side === 'L';
  const at = (i: number) => WORD_AT + i * WORD_STEP;
  const [b, sw, po, ne, me] = BOX;
  // 1 包豪斯：转着缩进来
  const kb = tween(f, at(0), 20, 0, 1, EXPO);
  // 2 瑞士：平滑滑入
  const ks = tween(f, at(1), 16, 0, 1, EXPO);
  // 3 波普：啪地拍上去
  const kp = Pop.slapS(f, at(2));
  // 4 新粗野：阴影长度 = 高度
  const zn = Neo.land(f, at(3), NV.shadow[1], 90);
  // 5 孟菲斯：掉下来压扁回弹
  const dm = Mem.drop(f, at(4), 12, -700);
  const credit = tween(f, at(4) + 16, 14);
  return (
    <>
      <Poster p={p} f={f + 200} end />
      <div style={{position: 'absolute', inset: 0, transform: `translate(${p.dir[0] * 0}px, 0)`}}>
        {/* 包豪斯：黄底黑框，红圆点 */}
        <div style={{position: 'absolute', left: b.x, top: ROW_Y, width: b.w, height: H, background: BH.yellow, border: `5px solid ${BH.ink}`, display: kb > 0 ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', gap: 12, transform: `scale(${kb}) rotate(${(1 - kb) * -120}deg)`}}>
          <div style={{width: 24, height: 24, borderRadius: '50%', background: BH.red}} />
          <span style={{fontFamily: font, fontWeight: 900, fontSize: 38, color: BH.ink}}>{b.text}</span>
        </div>
        {/* 瑞士：红块白字 */}
        <div style={{position: 'absolute', left: sw.x - (1 - ks) * 140, top: ROW_Y, width: sw.w, height: H, background: SW.red, color: SW.paper, opacity: ks, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, fontWeight: 900, fontSize: 40}}>{sw.text}</div>
        {/* 波普：白底粗黑框 + 硬阴影，歪一点 */}
        {kp > 0 && (
          <div style={{position: 'absolute', left: po.x, top: ROW_Y, width: po.w, height: H, background: PC.white, border: `5px solid ${PC.ink}`, boxShadow: `8px 8px 0 ${PC.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(-3deg) scale(${kp})`, opacity: clamp((f - at(2)) / 3)}}>
            <span style={{fontFamily: font, fontWeight: 900, fontSize: 40, color: PC.red, WebkitTextStroke: `1.5px ${PC.ink}`}}>{po.text}</span>
          </div>
        )}
        {/* 新粗野：黑框 + 同形黑块往右下偏移 */}
        {f >= at(3) - 2 && (
          <Neo.Box x={ne.x} y={ROW_Y} w={ne.w} h={H} fill={NC.pink} z={zn} border={NV.border} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{fontFamily: font, fontWeight: 900, fontSize: 40, color: NC.ink}}>{ne.text}</span>
          </Neo.Box>
        )}
        {/* 孟菲斯：糖果色胶囊，掉下来压扁 */}
        {dm.on && (
          <div style={{position: 'absolute', left: me.x, top: ROW_Y, width: me.w, height: H, borderRadius: 999, background: MC.pink, border: `5px solid ${MC.ink}`, boxShadow: `8px 8px 0 ${MC.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${dm.dy}px) rotate(3deg) scale(${dm.sx}, ${dm.sy})`, transformOrigin: '50% 100%'}}>
            <span style={{fontFamily: "'Fredoka', 'Noto Sans SC', sans-serif", fontWeight: 700, fontSize: 40, color: MC.ink}}>{me.text}</span>
          </div>
        )}
      </div>
      {!L && (
        <div style={{position: 'absolute', right: 64, top: 124, padding: '8px 16px', background: '#FFFFFF', border: '4px solid #111', boxShadow: '6px 6px 0 #111', ...mono(24, 700, 0.02), color: '#111', opacity: credit, transform: `translateY(${(1 - credit) * 16}px)`}}>{'@guanmo_ai · github.com/guanmo-ai/design-style'}</div>
      )}
    </>
  );
};
