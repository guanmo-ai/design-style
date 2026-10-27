/** 来历章的后两个世界：2009 Aero 玻璃桌面（窗口真的贴到左半 / 右半），2015 扁平的 iPad Split View（中缝可拖） */
import React from 'react';
import {Easing} from 'remotion';
import {Img, staticFile} from 'remotion';
import {Cursor, EXPO, SLIDE, clamp, lerp, tween} from './ui';
import {swiss} from './kit';

const W = 1920;
const H = 1080;
/** 贴边：落定得快、几乎不过冲（玻璃窗口不是果冻） */
const SNAP = Easing.bezier(0.2, 1, 0.34, 1.04);

// ═══════════════ 2009 · Aero ═══════════════
type R = {x: number; y: number; w: number; h: number};
const mixR = (a: R, b: R, t: number): R => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t)});

const Glass: React.FC<{r: R; title: string; children: React.ReactNode; z?: number; o?: number}> = ({r, title, children, z = 1, o = 1}) => (
  <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 10, zIndex: z, opacity: o, boxShadow: '0 0 0 1px rgba(0,0,0,0.55), 0 18px 50px rgba(0,20,60,0.45)', overflow: 'hidden'}}>
    {/* 玻璃边框：半透明白 + 模糊底下的壁纸 */}
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.62), rgba(196,226,255,0.42))', backdropFilter: 'blur(16px) saturate(1.4)'}} />
    <div style={{position: 'absolute', inset: 0, borderRadius: 10, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.85), inset 0 1px 0 rgba(255,255,255,0.95)'}} />
    <div style={{position: 'absolute', left: 14, top: 7, fontFamily: "'Noto Sans SC', sans-serif", fontSize: 17, fontWeight: 500, color: '#0A2A55', textShadow: '0 0 8px rgba(255,255,255,0.9)'}}>{title}</div>
    {/* 控制按钮 */}
    <div style={{position: 'absolute', right: 8, top: 0, display: 'flex', height: 22}}>
      {['–', '□'].map((s, i) => (
        <div key={i} style={{width: 28, height: 20, background: 'linear-gradient(180deg, rgba(255,255,255,0.8), rgba(150,190,235,0.6))', border: '1px solid rgba(0,0,0,0.35)', borderTop: 0, borderRadius: i === 0 ? '0 0 0 5px' : 0, fontSize: 13, textAlign: 'center', lineHeight: '18px', color: '#123'}}>{s}</div>
      ))}
      <div style={{width: 46, height: 20, background: 'linear-gradient(180deg, #E8A090, #C4301C 55%, #E55F3C)', border: '1px solid rgba(80,0,0,0.6)', borderTop: 0, borderRadius: '0 0 5px 0', color: '#fff', fontSize: 14, fontWeight: 700, textAlign: 'center', lineHeight: '18px'}}>×</div>
    </div>
    {/* 客户区 */}
    <div style={{position: 'absolute', left: 8, right: 8, top: 30, bottom: 8, background: '#F7FAFF', border: '1px solid rgba(0,0,0,0.4)', overflow: 'hidden'}}>{children}</div>
  </div>
);

const KeyCap: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span style={{display: 'inline-block', padding: '10px 22px', border: '2px solid #0A2A55', borderBottomWidth: 6, borderRadius: 10, background: '#fff', color: '#0A2A55', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 40}}>{children}</span>
);

export const World2: React.FC<{g: number; X: number}> = ({g, X}) => {
  const TB = 60;
  const aFinal: R = {x: 8, y: 8, w: X - 16, h: H - TB - 16};
  const bFinal: R = {x: X + 8, y: 8, w: W - X - 16, h: H - TB - 16};
  const aStart: R = {x: 330, y: 250, w: 600, h: 420};
  const aEdge: R = {...aStart, x: 8};
  const bStart: R = {x: 1160, y: 330, w: 560, h: 400};
  const bEdge: R = {...bStart, x: W - 8 - bStart.w};
  const pop = tween(g, 0, 16, 0, 1, EXPO);
  const aDrag = SLIDE(clamp((g - 12) / 14));
  const aSnap = SNAP(clamp((g - 28) / 14));
  const bDrag = SLIDE(clamp((g - 36) / 12));
  const bSnap = SNAP(clamp((g - 50) / 14));
  const A = mixR(mixR(aStart, aEdge, aDrag), aFinal, aSnap);
  const B = mixR(mixR(bStart, bEdge, bDrag), bFinal, bSnap);
  const ghostA = tween(g, 26, 4) * (1 - tween(g, 28, 3));
  const ghostB = tween(g, 48, 4) * (1 - tween(g, 50, 3));
  // 光标：A 的标题栏 → 左缘；B 的标题栏 → 右缘
  const cx = g < 34 ? lerp(lerp(aStart.x + 300, aEdge.x + 300, aDrag), 400, 0) : lerp(aEdge.x + 300, bStart.x + 280, SLIDE(clamp((g - 34) / 4))) + (bEdge.x - bStart.x) * bDrag;
  const cy = g < 34 ? aStart.y + 14 : bStart.y + 14;
  const press = (g >= 10 && g < 28) || (g >= 34 && g < 52) ? 1 : 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: 'linear-gradient(160deg, #0A3377 0%, #1470C4 52%, #4DB0EE 100%)'}}>
      {/* Aero 壁纸：右下角的光和几道斜光束 */}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 78% 105%, rgba(190,240,255,0.95) 0%, rgba(120,200,250,0.5) 28%, rgba(120,200,250,0) 62%)'}} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{position: 'absolute', left: 300 + i * 340, top: -200, width: 150 + (i % 2) * 90, height: 1700, background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.12) 40%, rgba(255,255,255,0))', transform: 'rotate(28deg)', transformOrigin: 'top'}} />
      ))}
      {/* 贴边预览：半透明的玻璃色块 */}
      <div style={{position: 'absolute', left: aFinal.x, top: aFinal.y, width: aFinal.w, height: aFinal.h, borderRadius: 10, background: 'rgba(160,210,255,0.35)', border: '2px solid rgba(255,255,255,0.8)', opacity: ghostA}} />
      <div style={{position: 'absolute', left: bFinal.x, top: bFinal.y, width: bFinal.w, height: bFinal.h, borderRadius: 10, background: 'rgba(160,210,255,0.35)', border: '2px solid rgba(255,255,255,0.8)', opacity: ghostB}} />
      {/* 窗口 B（右）与窗口 A（左） */}
      <Glass r={B} title="Aero Snap" z={2} o={pop}>
        <div style={{position: 'absolute', left: 0, top: 0, width: bFinal.w - 16, height: bFinal.h - 40}}>
          <Img src={staticFile('02-masonry/photos/stairs.jpg')} style={{position: 'absolute', left: 0, top: 0, width: bFinal.w - 18, height: 740, objectFit: 'cover'}} />
          <div style={{position: 'absolute', left: 40, top: 800, fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 900, fontSize: 70, color: '#0A2A55'}}>{'占满右半'}</div>
          <div style={{position: 'absolute', left: 40, top: 900}}><KeyCap>{'⊞ + →'}</KeyCap></div>
        </div>
      </Glass>
      <Glass r={A} title="2009 · 窗口贴边" z={3} o={pop}>
        <div style={{position: 'absolute', left: 0, top: 0, width: aFinal.w - 16, height: aFinal.h - 40}}>
          <div style={{position: 'absolute', left: 52, top: 36, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 400, letterSpacing: '-0.04em', lineHeight: 1, color: '#0A2A55', whiteSpace: 'nowrap'}}>{'2009'}</div>
          <div style={{position: 'absolute', left: 60, top: 500, fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 900, fontSize: 124, color: '#1470C4', whiteSpace: 'nowrap'}}>{'窗口贴边'}</div>
          <div style={{position: 'absolute', left: 64, top: 670, fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500, fontSize: 38, color: '#44546A', whiteSpace: 'nowrap'}}>{'Windows 7 Aero Snap：拖到屏幕边缘，'}</div>
          <div style={{position: 'absolute', left: 64, top: 724, fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500, fontSize: 38, color: '#44546A', whiteSpace: 'nowrap'}}>{'自动占满一半'}</div>
          <div style={{position: 'absolute', left: 64, top: 840}}><KeyCap>{'⊞ + ←'}</KeyCap></div>
        </div>
      </Glass>
      {/* 任务栏 */}
      <div style={{position: 'absolute', left: 0, bottom: 0, width: W, height: TB, background: 'linear-gradient(180deg, rgba(120,160,210,0.55), rgba(18,44,86,0.82) 50%, rgba(10,30,64,0.9))', borderTop: '1px solid rgba(255,255,255,0.55)', backdropFilter: 'blur(10px)', zIndex: 10}}>
        <div style={{position: 'absolute', left: 10, top: -6, width: 62, height: 62, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #BFF0FF, #2C9AE6 45%, #0B4C9A 100%)', border: '2px solid rgba(255,255,255,0.7)', boxShadow: '0 0 14px rgba(120,210,255,0.8)'}} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{position: 'absolute', left: 100 + i * 64, top: 8, width: 44, height: 44, borderRadius: 8, background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12))', border: '1px solid rgba(255,255,255,0.5)'}} />
        ))}
        <div style={{position: 'absolute', right: 26, top: 8, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, textAlign: 'right', lineHeight: 1.25}}>
          {'9:41'}
          <br />
          {'2009/10/22'}
        </div>
      </div>
      <Cursor x={cx} y={cy} press={press} ring={tween(g, 28, 12) * (g < 40 ? 1 : 0)} ringColor="#fff" />
    </div>
  );
};

// ═══════════════ 2015 · iPad Split View ═══════════════
export const World3: React.FC<{g: number; X: number}> = ({g, X}) => {
  const CX = (X + W) / 2;
  const CY = 560;
  const pw = 700;
  const ph = 520;
  const slide = tween(g, 0, 18, 0, 1, EXPO);
  // 中缝：50 → 72 → 50
  const r = 0.5 + 0.22 * (SLIDE(clamp((g - 22) / 14)) * (1 - SLIDE(clamp((g - 46) / 12))));
  const finger = tween(g, 18, 8) * (1 - tween(g, 60, 8));
  const dragging = g > 24 && g < 58;
  const sx = CX - pw / 2 + 14;
  const sw = pw - 28;
  const divX = 14 + sw * r; // 相对 iPad 左边
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: X, height: H, background: '#F2F2F7'}} />
      <div style={{position: 'absolute', left: X, top: 0, width: W - X, height: H, background: '#E5E5EA'}} />
      {/* 左半：扁平的标题 */}
      <div style={{position: 'absolute', left: 90, top: 150, color: '#1C1C1E', ...swiss(420, 400, -0.05), transform: `translateX(${(1 - slide) * -300}px)`, opacity: slide}}>{'2015'}</div>
      <div style={{position: 'absolute', left: 100, top: 620, fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 700, fontSize: 118, color: '#1C1C1E', opacity: tween(g, 8, 14)}}>{'分屏视图'}</div>
      <div style={{position: 'absolute', left: 104, top: 780, fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 400, fontSize: 38, lineHeight: 1.5, color: '#6C6C70', opacity: tween(g, 12, 14)}}>
        {'iPad Split View（iOS 9）与 OS X El Capitan'}
        <br />
        {'两个 App，中缝可拖'}
      </div>
      <div style={{position: 'absolute', left: 104, top: 960, padding: '10px 22px', borderRadius: 999, background: '#007AFF', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 28, opacity: tween(g, 16, 12)}}>{'Split View'}</div>
      {/* 右半：iPad */}
      <div style={{position: 'absolute', left: CX - pw / 2, top: CY - ph / 2 + (1 - slide) * 400, width: pw, height: ph, borderRadius: 40, background: '#1C1C1E', boxShadow: '0 30px 60px rgba(0,0,0,0.28)'}}>
        <div style={{position: 'absolute', left: 14, top: 14, width: sw, height: ph - 28, borderRadius: 26, overflow: 'hidden', background: '#fff'}}>
          {/* 左：备忘录 */}
          <div style={{position: 'absolute', left: 0, top: 0, width: sw * r - 3, height: '100%', background: '#FFFBEA', overflow: 'hidden'}}>
            <div style={{height: 46, background: '#F5C542', display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: '#3A2E00'}}>{'备忘录'}</div>
            <div style={{padding: 18, display: 'flex', flexDirection: 'column', gap: 12}}>
              {[0.92, 0.7, 0.84, 0.55, 0.78, 0.62, 0.8, 0.5].map((q, i) => (
                <div key={i} style={{height: 10, width: `${q * 100}%`, background: '#3A2E00', opacity: 0.18, borderRadius: 5}} />
              ))}
            </div>
          </div>
          {/* 右：Safari */}
          <div style={{position: 'absolute', left: sw * r + 3, top: 0, width: sw * (1 - r) - 3, height: '100%', background: '#fff', overflow: 'hidden'}}>
            <div style={{height: 46, background: '#F2F2F7', display: 'flex', alignItems: 'center', padding: '0 14px'}}>
              <div style={{height: 26, width: '100%', borderRadius: 13, background: '#E0E0E5'}} />
            </div>
            <Img src={staticFile('02-masonry/photos/stairs.jpg')} style={{width: sw * 0.5, height: ph - 28 - 46, objectFit: 'cover', objectPosition: '30% 50%'}} />
          </div>
          {/* 把手 */}
          <div style={{position: 'absolute', left: sw * r - 4, top: ph / 2 - 14 - 34, width: 8, height: 68, borderRadius: 4, background: '#8E8E93', opacity: 0.9}} />
        </div>
      </div>
      {/* 手指：半透明灰圆 */}
      {finger > 0.01 && (
        <div style={{position: 'absolute', left: divX + (CX - pw / 2) - 32, top: CY - 32 + (1 - slide) * 400, width: 64, height: 64, borderRadius: '50%', background: 'rgba(60,60,67,0.30)', border: '2px solid rgba(60,60,67,0.45)', transform: `scale(${(1 - 0.14 * (dragging ? 1 : 0)) * finger})`}} />
      )}
      <div style={{position: 'absolute', left: CX - pw / 2, top: CY + ph / 2 + 36, width: pw, textAlign: 'center', fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 28, color: '#007AFF', opacity: tween(g, 14, 12)}}>{`${Math.round(r * 100)} : ${100 - Math.round(r * 100)}  ·  中缝可拖`}</div>
    </div>
  );
};
