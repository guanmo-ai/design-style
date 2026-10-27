/**
 * 0—2 秒 · 开场：键帽。第一帧就是片尾那张海报（首尾同一帧，循环无缝）
 *   f0     海报：NEO / BRUTAL / ISM
 *   f8     光标一按——所有阴影一起归零
 *   f14    海报炸开；13 颗巨型键帽 N·E·O-B·R·U·T·A·L·I·S·M 从下面浮上来（抬着，阴影很长），由中间向两边依次落稳
 *   f42    打字：一道按键的波从左按到右
 *   f58    「新粗野主义」贴纸落下；f66 小标签
 *   f75    十三颗键一起按到底；f84 一起弹起来，再落一次
 *   f96    镜头钻进 O 的孔里，黄色铺满全屏 → 01 黑框
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {E, clamp, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {POSTER_PRESS, Poster} from './finale';
import {Box, Burst, Cursor, Dots, GLIDE, disp, land, lerp, mono, press, sc} from './ui';

const KEYS = 'NEO-BRUTALISM'.split('');
const KW = 124;
const KH = 180;
const KG = 14;
const X0 = (1920 - (KEYS.length * KW + (KEYS.length - 1) * KG)) / 2;
const Y0 = 290;
const KEY_FILL = [C.pink, C.lime, C.yellow, C.white, C.blue, C.orange, C.yellow, C.pink, C.lime, C.blue, C.white, C.orange, C.yellow];
const O = 2; // 镜头要钻进去的那颗
const REST = 14;

const keyX = (i: number) => X0 + i * (KW + KG);
const arrive = (i: number) => 12 + Math.abs(i - 6) * 1.0 + 12; // 中间先到，两边后到；最晚 f30 落稳

export const KEY_O = {x: keyX(O) + KW / 2, y: Y0 + KH / 2 - 4};

export const Opening: React.FC<{f: number}> = ({f}) => {
  const hookP = press(f, 8, 99, false);
  const ex = tween(f, 14, 10, 0, 1, E.in);
  const cur = tween(f, 0, 7, 0, 1, E.out);
  // 钻进 O：指数缩放，越往里越快
  const dive = tween(f, 96, 22, 0, 1, E.in);
  const zoom = Math.exp(Math.log(90) * dive);
  const all = press(f, 75, 99, false) * (f < 84 ? 1 : 0);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: `${KEY_O.x}px ${KEY_O.y}px`}}>
        <Dots />
        {KEYS.map((ch, i) => {
          const t0 = arrive(i) - 12;
          if (f < t0) return null;
          const k = tween(f, t0, 12, 0, 1, GLIDE);
          let z = land(f, arrive(i), REST, 70);
          if (f >= 84) z = land(f, 84, REST, 46); // 一起弹起来，再落一次
          const wave = press(f, 42 + i * 2.2, 2);
          const p = Math.max(wave, all);
          return (
            <Box
              key={i}
              x={keyX(i)}
              y={lerp(1150, Y0, k)}
              w={KW}
              h={KH}
              fill={KEY_FILL[i]}
              shadow={REST}
              z={z * (1 - p)}
              rot={lerp((i - 6) * 4, 0, k)}
              style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
            >
              <span style={{...disp(ch === '-' ? 100 : 128, 100, 0), marginTop: 8}}>{ch === '-' ? '–' : ch}</span>
            </Box>
          );
        })}
        {/* 贴纸 */}
        {f >= 56 && (
          <Box x={560} y={570} w={800} h={160} fill={C.ink} shadow={14} z={land(f, 58, 14, 60)} rot={-2} scale={lerp(1.15, 1, tween(f, 56, 8, 0, 1, E.out))} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{...sc(104, 900, 0.06), color: C.yellow}}>新粗野主义</span>
          </Box>
        )}
        {f >= 64 && (
          <Box x={700} y={790} w={520} h={80} fill={C.white} border={4} shadow={8} z={land(f, 66, 8, 36)} rot={1.5} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{...mono(30, 700)}}>border · shadow · press</span>
          </Box>
        )}
      </div>
      {/* 钻到最里面：O 的孔（黄色）铺满全屏 */}
      {f >= 110 && <AbsoluteFill style={{background: C.yellow, opacity: tween(f, 110, 7, 0, 1, E.in)}} />}
      {/* 第一帧的海报：按下 → 炸开 */}
      {ex < 1 && <Poster p={hookP} ex={ex} bg={1 - clamp(ex * 3)} />}
      {f < 16 && <Cursor x={lerp(1960, POSTER_PRESS.x, cur)} y={lerp(1140, POSTER_PRESS.y, cur)} p={hookP} opacity={1 - tween(f, 12, 4)} />}
      <Burst x={POSTER_PRESS.x} y={POSTER_PRESS.y} f={f} at={8} />
    </AbsoluteFill>
  );
};
