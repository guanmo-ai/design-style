/**
 * 主角：一台“爆炸图”手机（纯 CSS 3D，没有任何图片素材）。
 * 五层从下到上：后壳（含中框）· 电池 · 主板 · 屏幕 · 玻璃。
 * explode = 0 合上，1 沿 Z 轴拆开 —— 苹果产品页最常见的那个镜头。
 */
import React from 'react';
import {C} from '../tokens';

export type DeviceProps = {
  x: number;
  y: number;
  scale?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  explode?: number;
  hi?: number; // 芯片高亮 0–1
  glow?: number; // 背后的光晕
  opacity?: number;
};

const DW = 300;
const DH = 620;
const R = 56;
const SPREAD = 132;

type PlateProps = {inset: number; z: number; style?: React.CSSProperties; children?: React.ReactNode; extra?: string};
const Plate: React.FC<PlateProps> = ({inset, z, style, children, extra = ''}) => (
  <div
    style={{
      position: 'absolute',
      left: -DW / 2 + inset,
      top: -DH / 2 + inset,
      width: DW - 2 * inset,
      height: DH - 2 * inset,
      borderRadius: R - inset * 0.85,
      transform: `translateZ(${z}px) ${extra}`,
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children}
  </div>
);

const WALL = [
  'radial-gradient(120% 75% at 15% 8%, #FF7A2F 0%, rgba(255,122,47,0) 58%)',
  'radial-gradient(110% 70% at 95% 42%, #8B3DFF 0%, rgba(139,61,255,0) 62%)',
  'radial-gradient(130% 80% at 25% 100%, #2997FF 0%, rgba(41,151,255,0) 62%)',
  '#FF2E7E',
].join(',');

const TI = 'linear-gradient(140deg, #6A6D75 0%, #3A3C43 32%, #55585F 58%, #26282D 100%)';

export const Device: React.FC<DeviceProps> = ({
  x,
  y,
  scale = 1,
  rx = 0,
  ry = 0,
  rz = 0,
  explode = 0,
  hi = 0,
  glow = 0,
  opacity = 1,
}) => {
  const e = explode;
  const zOf = (k: number, base: number) => base + (k - 2) * SPREAD * e;
  const zb = zOf(0, -15);
  const frameT = 30 - 22 * Math.min(1, e * 1.6); // 合上时中框包住整机，拆开后只剩后壳一圈
  const rings = 9;
  const spec = 115 + ry * 0.55 + rz * 0.4;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, perspective: 2600, opacity}}>
      {glow > 0 && (
        <div
          style={{
            position: 'absolute',
            left: -460 * scale,
            top: -460 * scale,
            width: 920 * scale,
            height: 920 * scale,
            borderRadius: '50%',
            background:
              'radial-gradient(closest-side, rgba(255,46,126,0.42), rgba(139,61,255,0.24) 45%, rgba(41,151,255,0.10) 70%, rgba(0,0,0,0) 100%)',
            opacity: glow,
            filter: 'blur(30px)',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformStyle: 'preserve-3d',
          transform: `scale(${scale}) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
        }}
      >
        {/* 后壳：朝外的一面带摄像头（单独一块，翻转 180° 朝后） */}
        <Plate inset={0} z={zb - 0.6} extra="rotateY(180deg)" style={{background: TI}}>
          <div
            style={{
              position: 'absolute',
              left: 22,
              top: 22,
              width: 128,
              height: 128,
              borderRadius: 38,
              background: 'linear-gradient(140deg, #4C4F57, #2A2C31)',
              boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.12)',
            }}
          >
            {[
              [14, 14],
              [66, 40],
              [14, 66],
            ].map(([lx, ly], i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: lx,
                  top: ly,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 40% 35%, #3B4A6B 0%, #0B0D12 55%, #000 100%)',
                  boxShadow: '0 0 0 5px #1A1B1F, 0 0 0 6.5px rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
        </Plate>
        <Plate inset={0} z={zb} style={{background: '#1E1F23'}} />
        {/* 中框：一圈圈叠出来的厚度 */}
        {Array.from({length: rings}, (_, i) => {
          const t = i / (rings - 1);
          return (
            <Plate
              key={`r${i}`}
              inset={0}
              z={zb + t * frameT}
              style={{border: `4px solid ${i === rings - 1 ? '#A3A6AE' : t > 0.5 ? '#6E7179' : '#575A61'}`}}
            />
          );
        })}
        {/* 电池 */}
        <Plate inset={24} z={zOf(1, -9) - 5} style={{background: '#111215'}} />
        <Plate inset={24} z={zOf(1, -9)} style={{background: 'linear-gradient(160deg, #2E3038, #1D1F24)'}}>
          <div style={{position: 'absolute', left: 36, right: 36, top: 230, height: 70, borderRadius: 10, background: 'rgba(255,255,255,0.06)'}} />
          <div style={{position: 'absolute', left: 36, width: 80, top: 316, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)'}} />
        </Plate>
        {/* 主板 */}
        <Plate inset={16} z={zOf(2, -1) - 3} style={{background: '#050806'}} />
        <Plate
          inset={16}
          z={zOf(2, -1)}
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(214,178,94,0.10) 0 1.5px, rgba(0,0,0,0) 1.5px 17px), repeating-linear-gradient(0deg, rgba(214,178,94,0.07) 0 1.5px, rgba(0,0,0,0) 1.5px 23px), #0E1512',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 134 - 48,
              top: 140,
              width: 96,
              height: 96,
              borderRadius: 14,
              background: hi > 0 ? `linear-gradient(135deg, ${C.accent}, #7CC4FF)` : 'linear-gradient(135deg, #D9B865, #8F7330)',
              boxShadow: `0 0 ${10 + 70 * hi}px ${hi * 18}px rgba(41,151,255,${0.55 * hi})`,
              opacity: 1,
            }}
          >
            <div style={{position: 'absolute', inset: 16, borderRadius: 8, background: hi > 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)'}} />
          </div>
          {[
            [40, 290, 70, 40],
            [150, 290, 80, 26],
            [40, 360, 40, 70],
            [110, 360, 120, 18],
            [110, 392, 90, 18],
          ].map(([l, t, w, h], i) => (
            <div key={i} style={{position: 'absolute', left: l, top: t, width: w, height: h, borderRadius: 4, background: '#1D2622', boxShadow: 'inset 0 0 0 1px rgba(214,178,94,0.25)'}} />
          ))}
        </Plate>
        {/* 屏幕 */}
        <Plate inset={4} z={zOf(3, 8) - 2} style={{background: '#000'}} />
        <Plate inset={4} z={zOf(3, 8)} style={{background: WALL, border: '8px solid #050505', backgroundClip: 'padding-box'}}>
          <div style={{position: 'absolute', left: '50%', top: 14, width: 96, height: 28, marginLeft: -48, borderRadius: 14, background: '#000'}} />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 92,
              textAlign: 'center',
              fontFamily: "'Inter Display', sans-serif",
              fontWeight: 600,
              fontSize: 64,
              color: 'rgba(255,255,255,0.92)',
              letterSpacing: -1,
            }}
          >
            9:41
          </div>
        </Plate>
        {/* 玻璃 */}
        <Plate
          inset={0}
          z={zOf(4, 15.5)}
          style={{
            background: `linear-gradient(${spec}deg, rgba(255,255,255,0) 30%, rgba(255,255,255,${0.1 + 0.1 * e}) 46%, rgba(255,255,255,0) 62%), rgba(255,255,255,${0.035 * e})`,
            border: `1.5px solid rgba(255,255,255,${0.14 + 0.2 * e})`,
          }}
        />
      </div>
    </div>
  );
};
