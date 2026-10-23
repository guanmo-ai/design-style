/**
 * 一台“设备”：浏览器窗口（标题栏 + 网址栏）⇄ 手机（边框 + 灵动岛），q = 0 → 1 连续变形。
 * 里面装的是真网页（Web.tsx 的 iframe）；children 画在“视口坐标”里（原点 = 网页视口左上角，单位 = 网页 px），可以有 3D。
 */
import React from 'react';
import {FONT} from '../tokens';
import {Pose, boxOf, c01, lerp, poseCss} from './page';

export const Device: React.FC<{
  pose: Pose;
  vw: number;
  vh: number;
  q: number;
  /** 0 → 1：X 光里外壳退掉，只剩视口 */
  bare?: number;
  url?: string;
  children: React.ReactNode;
}> = ({pose, vw, vh, q, bare = 0, url = 'design-style.dev/layouts/03-scrollytelling', children}) => {
  const {bw, bh, ox, oy, th} = boxOf(vw, vh, q);
  const R = lerp(12, 60, q);
  const shell = 1 - bare;
  const chromeOp = c01(1 - q * 2.2) * shell;
  const flat = bare < 0.001 && pose.op < 1; // 透明度会把 3D 压平，只在开场（没有 3D 子层）时用
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: bw,
        height: bh,
        transformOrigin: '0 0',
        transform: poseCss(pose, bw, bh),
        transformStyle: flat ? undefined : 'preserve-3d',
        opacity: flat ? pose.op : 1,
      }}
    >
      {/* 外壳：浏览器是深灰标题栏 + 细边；手机是黑边框 + 钛金属边 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: R,
          background: q < 0.5 ? '#1d1d20' : '#050506',
          opacity: shell,
          boxShadow: [
            `0 0 0 ${lerp(1, 2.5, q)}px ${q < 0.5 ? 'rgba(255,255,255,0.13)' : '#4a4a50'}`,
            `0 0 0 ${lerp(1, 4, q)}px rgba(0,0,0,${0.6 * q})`,
            '0 50px 120px rgba(0,0,0,0.65)',
            '0 0 160px rgba(139,61,255,0.10)',
          ].join(', '),
        }}
      />
      {/* 手机侧键 */}
      {q > 0.3 &&
        [
          [-1, 150, 34],
          [-1, 210, 62],
          [-1, 284, 62],
          [1, 236, 96],
        ].map(([side, y, h], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: side < 0 ? -4.5 : bw + 0.5,
              top: y,
              width: 4,
              height: h,
              borderRadius: 2,
              background: 'linear-gradient(90deg,#2a2a2e,#56565c,#2a2a2e)',
              opacity: c01((q - 0.3) / 0.4) * shell,
            }}
          />
        ))}
      {/* 标题栏：红黄绿 + 网址 */}
      {chromeOp > 0.01 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: bw, height: th, opacity: chromeOp, overflow: 'hidden'}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => (
            <div key={c} style={{position: 'absolute', left: 18 + i * 20, top: th / 2 - 6, width: 12, height: 12, borderRadius: 6, background: c}} />
          ))}
          <div
            style={{
              position: 'absolute',
              left: bw / 2 - 270,
              top: th / 2 - 14,
              width: 540,
              height: 28,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              font: `500 14px ${FONT.text}`,
              color: '#A1A1A6',
            }}
          >
            <svg width="10" height="12" viewBox="0 0 10 12">
              <rect x="0.5" y="5" width="9" height="6.5" rx="1.5" fill="#A1A1A6" />
              <path d="M2.5 5V3.5a2.5 2.5 0 0 1 5 0V5" fill="none" stroke="#A1A1A6" strokeWidth="1.3" />
            </svg>
            {url}
          </div>
        </div>
      )}
      {/* 视口（网页 px），可以有 3D 子层 */}
      <div style={{position: 'absolute', left: ox, top: oy, width: vw, height: vh, transformStyle: 'preserve-3d'}}>{children}</div>
      {/* 灵动岛 */}
      {q > 0.55 && (
        <div
          style={{
            position: 'absolute',
            left: bw / 2 - 62,
            top: oy + 11,
            width: 124,
            height: 36,
            borderRadius: 18,
            background: '#000',
            opacity: c01((q - 0.55) / 0.35) * shell,
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04)',
          }}
        />
      )}
    </div>
  );
};

/** 视口里的覆盖式滚动条（macOS 样式）：滚动时变亮 */
export const Scrollbar: React.FC<{vw: number; vh: number; y: number; max: number; act: number}> = ({vw, vh, y, max, act}) => {
  const track = vh - 16;
  const len = Math.max(48, (track * vh) / (max + vh));
  const top = 8 + (track - len) * c01(y / max);
  return (
    <div
      style={{
        position: 'absolute',
        left: vw - 11,
        top,
        width: 7,
        height: len,
        borderRadius: 4,
        background: `rgba(245,245,247,${0.12 + 0.55 * act})`,
        transform: 'translateZ(1px)',
      }}
    />
  );
};
