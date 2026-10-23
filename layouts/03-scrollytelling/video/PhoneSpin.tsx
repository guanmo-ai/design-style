/**
 * 演示网页（demo/index.html）“逐帧”一段用的图片序列：同一台 3D 手机转一整圈、中途拆开再合上。
 * 这正是苹果产品页的做法——预先渲染好 N 张图，滚到哪就画第几张。
 * 导出：COMP=L03-PhoneSpin SCALE=1 node scripts/stills.mjs out/bundle out/spin 0 1 2 … 71
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Phone3D} from './Phone3D';

export const SPIN_FRAMES = 72;
export const PhoneSpin: React.FC = () => {
  const f = useCurrentFrame();
  const p = f / SPIN_FRAMES;
  const pop = Math.pow(Math.sin(p * Math.PI), 2);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Phone3D w={720} h={900} ss={1.5} st={{x: 360, y: 450, h: 640, rx: 10 - 8 * Math.sin(p * Math.PI), ry: -28 + 360 * p, rz: -6 * pop, explode: 0.75 * pop, hi: pop, sweep: (p * 2) % 1}} />
    </AbsoluteFill>
  );
};
