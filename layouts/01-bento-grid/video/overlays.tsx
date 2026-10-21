/** 布局 01 · Bento Grid —— 卡片之外的东西：规则栏、标注、列网格、头像栏、后台标题、片尾 */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {ACCENT, C} from '../tokens';
import {HIT, RULES_AT, SCENE, TRANS} from './layout';
import {disp, gradText, mono, Pill, sc, Show} from './ui';

type P = {f: number};
const WO = SCENE.WIRE.out;

const RULES: [string, string][] = [
  ['一格一事', '每张卡片只讲一个信息'],
  ['大小分级', '面积就是优先级：一个主角，其余配角'],
  ['统一间距', '所有缝隙一样宽，常用 16–24px'],
  ['统一圆角', '嵌套时，内圆角 = 外圆角 − 内边距'],
  ['对齐网格', '卡片按整列整行拼合，不留零碎缝隙'],
];

export const RulesPanel: React.FC<P> = ({f}) => (
  <>
    <Show f={f} at={SCENE.WIRE.in - 8} out={WO} style={{left: 96, top: 100}}>
      <div style={{...disp(30, 600, -0.01), color: C.t2}}>Bento Grid</div>
    </Show>
    <Show f={f} at={SCENE.WIRE.in - 4} out={WO} dy={26} style={{left: 96, top: 146}}>
      <div style={{...sc(88, 900, 0.02), color: C.t1}}>五条规则</div>
    </Show>
    {RULES.map(([t, d], k) => (
      <Show key={t} f={f} at={RULES_AT[k]} out={WO} dy={22} style={{left: 96, top: 356 + k * 126, display: 'grid', gridTemplateColumns: '64px 1fr'}}>
        <div style={{...mono(24), lineHeight: '40px', ...gradText}}>{`0${k + 1}`}</div>
        <div>
          <div style={{...sc(36, 700, 0.03), lineHeight: '40px', color: C.t1}}>{t}</div>
          <div style={{...sc(22, 400, 0.03), lineHeight: 1.3, color: C.t2, marginTop: 12}}>{d}</div>
        </div>
      </Show>
    ))}
  </>
);

/** 规则 05：Figma 式的列网格，从上往下铺开 */
export const ColumnFills: React.FC<P> = ({f}) => {
  const s = tween(f, RULES_AT[4], 30, 0, 1, E.inOut);
  const o = 1 - tween(f, WO, 8);
  if (s <= 0 || o <= 0) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: o}}>
      {[760, 1031, 1302, 1573].map((x, k) => {
        const sk = tween(f, RULES_AT[4] + k * 3, 30, 0, 1, E.inOut);
        return <rect key={x} x={x} y={0} width={251} height={1080 * sk} fill="rgba(255,45,111,.075)" />;
      })}
    </svg>
  );
};

/** 规则 03 / 04 的测量标注 */
export const Annotations: React.FC<P> = ({f}) => {
  const g = tween(f, RULES_AT[2], 14) * (1 - tween(f, WO, 8));
  const r = tween(f, RULES_AT[3], 14) * (1 - tween(f, WO, 8));
  const dash = tween(f, RULES_AT[3], 30, 0, 1, E.inOut);
  const hero = tween(f, RULES_AT[1], 20) * (1 - tween(f, WO, 8));
  return (
    <>
      <svg width={1920} height={1080} fill="none" stroke="#FF2D6F" style={{position: 'absolute', inset: 0}}>
        {/* 规则 02：主角格淡淡染色 */}
        <rect x={760} y={100} width={522} height={620} rx={32} fill="rgba(255,45,111,.05)" stroke="none" opacity={hero} />
        <g opacity={g} strokeWidth={2}>
          <path d="M1282 570 H1302 M1282 562 V578 M1302 562 V578" />
          <path d="M1427 400 V420 M1419 400 H1435 M1419 420 H1435" />
          <path d="M1698 720 V740 M1690 720 H1706 M1690 740 H1706" />
        </g>
        <g opacity={r}>
          <rect x={772} y={112} width={498} height={596} rx={20} strokeDasharray="6 6" strokeWidth={1.5} strokeDashoffset={(1 - dash) * 60} opacity={dash} />
          <path d="M760 132 A32 32 0 0 1 792 100" strokeWidth={3} />
          <path d="M772 132 A20 20 0 0 1 792 112" strokeWidth={3} />
          <path d="M769.4 109.4 L742 82" strokeWidth={1.5} />
          <path d="M760 410 H772 M760 404 V416 M772 404 V416" strokeWidth={2} />
        </g>
      </svg>
      <Pill f={f} at={RULES_AT[2]} out={WO} x={1292} y={532}>20</Pill>
      <Pill f={f} at={RULES_AT[2] + 3} out={WO} x={1475} y={410}>20</Pill>
      <Pill f={f} at={RULES_AT[2] + 6} out={WO} x={1746} y={730}>20</Pill>
      <Pill f={f} at={RULES_AT[3]} out={WO} x={722} y={66}>r 32</Pill>
      <Pill f={f} at={RULES_AT[3] + 4} out={WO} x={840} y={160}>r 20</Pill>
      <Pill f={f} at={RULES_AT[3] + 8} out={WO} x={808} y={410}>12</Pill>
    </>
  );
};

/** 个人主页左侧：头像 + 名字 + 简介，底部一行网址和网格底边对齐 */
export const Profile: React.FC<P> = ({f}) => {
  const HO = SCENE.HOME.out;
  const a = SCENE.HOME.in;
  return (
    <>
      {/* 头像：品牌渐变做成一颗有体积的球——左上一点高光、右下一点暗部，外圈一道白边 */}
      <Show f={f} at={a - 12} out={HO} dy={24} style={{left: 96, top: 100}}>
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: 80,
            background: ['radial-gradient(circle at 30% 24%, rgba(255,255,255,.5), rgba(255,255,255,0) 40%)', 'radial-gradient(circle at 72% 80%, rgba(70,0,140,.28), rgba(70,0,140,0) 55%)', ACCENT].join(','),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...sc(70, 700, 0),
            color: '#fff',
            textShadow: '0 2px 10px rgba(90,0,120,.18)',
            boxShadow: '0 0 0 6px #fff, 0 18px 40px rgba(166,61,255,.16), 0 6px 14px rgba(255,45,111,.12)',
          }}
        >
          观
        </div>
      </Show>
      <Show f={f} at={a - 6} out={HO} dy={24} style={{left: 96, top: 318}}>
        <div style={{...sc(72, 700, 0.02), color: C.ink}}>观默</div>
        <div style={{...disp(28, 500, -0.005), color: '#86868B', marginTop: 20}}>@guanmo_ai</div>
      </Show>
      {/* 简介：苹果式的两段灰度——先一句黑字，后面的话用灰字接上，字号字重都不变 */}
      <Show f={f} at={a} out={HO} dy={24} style={{left: 96, top: 488, width: 470}}>
        <div style={{...sc(28, 500, 0.02), lineHeight: 1.6, color: '#86868B'}}>
          <span style={{color: C.ink}}>设计 × AI。</span>
          <br />
          每天拆解一个设计风格，
          <br />
          做成 15 秒短片和一套能用的规范。
        </div>
      </Show>
      <Show f={f} at={a + 6} out={HO} dy={12} style={{left: 96, top: 906}}>
        <div style={{display: 'flex', alignItems: 'center', padding: '15px 22px', borderRadius: 999, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,.05)'}}>
          <span style={{...mono(18, 500), color: C.ink}}>guanmo-ai.github.io/design-style</span>
          <svg width={14} height={14} viewBox="0 0 16 16" style={{marginLeft: 12}}><path d="M4 12 L12 4 M5.5 4 H12 V10.5" fill="none" stroke={C.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </Show>
    </>
  );
};

/** 后台顶栏 */
export const DashHeader: React.FC<P> = ({f}) => {
  const DO = SCENE.DASH.out;
  return (
    <>
      <Show f={f} at={SCENE.DASH.in - 12} out={DO} style={{left: 96, top: 104}}>
        <span style={{...sc(44, 700, 0.02), color: '#F7F8F8'}}>概览</span>
      </Show>
      <Show f={f} at={SCENE.DASH.in - 6} out={DO} style={{right: 96, top: 106}}>
        <div style={{...sc(22, 500), color: '#B4B8C0', padding: '12px 20px', borderRadius: 999, background: 'rgba(255,255,255,.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)'}}>过去 30 天</div>
      </Show>
    </>
  );
};

/** 片尾 */
export const EndTitle: React.FC<P> = ({f}) => {
  const at = SCENE.END.in;
  const o = 9999;
  const center: React.CSSProperties = {left: 0, right: 0, display: 'flex', justifyContent: 'center'};
  return (
    <>
      <Show f={f} at={at} out={o} dy={30} style={{...center, top: 456}}>
        <div style={{...disp(140, 600, -0.045), color: C.t1}}>Bento Grid</div>
      </Show>
      <Show f={f} at={at + 6} out={o} dy={24} style={{...center, top: 620}}>
        <div style={{...sc(46, 700, 0.12), color: 'rgba(245,245,247,.92)'}}>便当盒布局</div>
      </Show>
      <Show f={f} at={at + 14} out={o} style={{...center, top: 730}}>
        <div style={{...sc(30, 500, 0.12), color: C.t1}}>风格是皮，布局是骨。</div>
      </Show>
      <Show f={f} at={at + 18} out={o} style={{...center, top: 792}}>
        <div style={{...sc(22, 400, 0.08), color: C.t2}}>一格一事 · 大小分级 · 统一间距 · 统一圆角 · 对齐网格</div>
      </Show>
      <Show f={f} at={at + 24} out={o} style={{...center, top: 960}}>
        <span style={{...disp(22, 500, 0), color: 'rgba(245,245,247,.45)'}}>Design Style</span>
        <span style={{...sc(22, 500, 0.04), color: 'rgba(245,245,247,.8)', marginLeft: 12}}>布局</span>
        <span style={{...disp(22, 600, 0), color: 'rgba(245,245,247,.8)', marginLeft: 6}}>01</span>
        <span style={{...disp(22, 500, 0), color: 'rgba(245,245,247,.45)', marginLeft: 28}}>@guanmo_ai</span>
        <span style={{...mono(20, 400), color: 'rgba(245,245,247,.45)', marginLeft: 28}}>github.com/guanmo-ai/design-style</span>
      </Show>
    </>
  );
};

/** 底部目录条：全片的“章节号”，每次重排时翻到下一章 */
const CHAPTERS: [string, string, boolean][] = [
  ['KEY', '苹果发布会最爱的排版', false],
  ['BENTO', '名字的由来：日本便当', false],
  ['METRO', '前身 · 2010 Windows Phone 动态磁贴', false],
  ['IOS', '前身 · 2020 iOS 14 桌面小组件', false],
  ['WIRE', '五条规则', false],
  ['HOME', '用法 · 个人主页（bento.me 式）', true],
  ['DASH', '用法 · 产品后台（Linear 式）', false],
];
export const Hud: React.FC<P> = ({f}) => {
  const o = tween(f, 64, 16) * (1 - tween(f, TRANS[TRANS.length - 1].at, 10));
  if (o <= 0.001) return null;
  const at = (name: string) => TRANS.find((t) => t.to === name)!.at + HIT - 6;
  let k = 0;
  CHAPTERS.forEach(([name], j) => {
    if (f >= at(name) || j === 0) k = j;
  });
  const p = tween(f, at(CHAPTERS[k][0]), 14, 0, 1, E.out);
  const light = CHAPTERS[k][2] ? 1 : 0;
  const main = light > 0.5 ? 'rgba(29,29,31,.78)' : 'rgba(245,245,247,.78)';
  const dim = light > 0.5 ? 'rgba(29,29,31,.42)' : 'rgba(245,245,247,.4)';
  return (
    <div style={{position: 'absolute', left: 96, right: 96, top: 1022, height: 30, opacity: o, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{display: 'flex', alignItems: 'baseline'}}>
        <span style={{...disp(20, 600, -0.01), color: main}}>Bento Grid</span>
        <span style={{...sc(18, 500, 0.06), color: dim, marginLeft: 12}}>便当盒布局</span>
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', opacity: 0.25 + 0.75 * p, transform: `translateY(${(1 - p) * 14}px)`}}>
        <span style={{...mono(18, 500), ...gradText, marginRight: 14}}>{`0${k + 1} / 07`}</span>
        <span style={{...sc(19, 500, 0.04), color: main}}>{CHAPTERS[k][1]}</span>
      </div>
    </div>
  );
};
