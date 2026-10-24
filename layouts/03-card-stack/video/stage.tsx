/**
 * 取景框：字幕钉在画布上，不跟镜头飞。Swiss HUD 语法。
 */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {BEATS, DURATION, SCENE} from './layout';
import {gro, mono, Pill, Rise, RiseBox, sc, Show, Swap} from './ui';

type CSS = React.CSSProperties;
const inkOn = (f: number) => {
  if (f >= SCENE.END.in || (f >= SCENE.LAYER.in && f < SCENE.PROOF.in) || f < 78 || (f >= SCENE.TEACH.in && f < SCENE.PIT.in)) return C.cream;
  return C.ink;
};

export const Hud: React.FC<{f: number}> = ({f}) => {
  const o = tween(f, 36, 14) * (1 - tween(f, SCENE.END.in + 20, 16, 0, 1, E.in));
  if (o <= 0.001) return null;
  const ch: [string, number][] = [
    ['刊 · 抽', SCENE.COVER.in],
    ['层 · 提', SCENE.LAYER.in],
    ['样 · 压', SCENE.PROOF.in],
    ['拆解', SCENE.TEACH.in],
    ['坏 → 好', SCENE.PIT.in],
  ];
  let k = 0;
  ch.forEach(([, at], j) => {
    if (f >= at) k = j;
  });
  const color = inkOn(f);
  return (
    <div style={{position: 'absolute', left: 72, right: 72, top: 1020, height: 32, opacity: o, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', color}}>
      <div>
        <span style={{...gro(20, 700, -0.02)}}>Card Stack</span>
        <span style={{...sc(16, 500, 0.08), marginLeft: 12, opacity: 0.55}}>卡片层叠</span>
      </div>
      <div>
        <span style={{...gro(18, 700), color: C.red, marginRight: 12}}>{`0${k + 1} / 05`}</span>
        <span style={{...sc(18, 500, 0.04)}}>{ch[k][0]}</span>
      </div>
    </div>
  );
};

export const Rail: React.FC<{f: number}> = ({f}) => {
  const o = tween(f, 48, 12) * (1 - tween(f, SCENE.END.in, 18));
  if (o <= 0.001) return null;
  const word = f >= SCENE.PROOF.in ? '样' : f >= SCENE.LAYER.in ? '层' : f >= SCENE.COVER.in ? '刊' : '叠';
  return (
    <div style={{position: 'absolute', left: 48, top: 120, opacity: o, color: inkOn(f), writingMode: 'vertical-rl', ...gro(22, 700, 0.18)}}>
      {word}
    </div>
  );
};

export const CoverCaption: React.FC<{f: number}> = ({f}) => {
  const color = inkOn(f);
  return (
    <>
      <Show f={f} at={BEATS.cover - 18} out={BEATS.pull2 + 8} style={{left: 64, top: 72, color}}>
        <Rise f={f} at={BEATS.cover - 12} out={BEATS.pull2} text="刊 · 抽" style={{...gro(56, 700, -0.05), color}} />
      </Show>
      <Show f={f} at={BEATS.pull1 - 6} out={BEATS.layer - 12} style={{left: 64, top: 148, color}}>
        <Swap
          f={f}
          at={BEATS.land2}
          h={36}
          a={<span style={{...sc(22, 500), color}}>抽走正在看的</span>}
          b={<span style={{...sc(22, 500), color}}>下一本接手</span>}
        />
      </Show>
      <Pill f={f} at={BEATS.pull1} out={BEATS.land2} x={420} y={200}>抽</Pill>
      <Pill f={f} at={BEATS.pull2} out={BEATS.land3 + 20} x={400} y={210}>再抽</Pill>
    </>
  );
};

export const LayerCaption: React.FC<{f: number}> = ({f}) => (
  <>
    <Show f={f} at={BEATS.layer - 16} out={BEATS.fan - 8} style={{left: 64, top: 72, color: C.cream}}>
      <Rise f={f} at={BEATS.layer - 8} out={BEATS.fan} text="层 · 提" style={{...gro(56, 700, -0.05), color: C.cream}} />
    </Show>
    <Show f={f} at={BEATS.mark} out={BEATS.fan - 4} style={{left: 64, top: 148, color: C.cream}}>
      <Swap
        f={f}
        at={BEATS.rise}
        h={34}
        a={<span style={{...sc(22, 500), color: C.cream}}>后层被点名</span>}
        b={<span style={{...sc(22, 500), color: C.cream}}>提到最前才可编辑</span>}
      />
    </Show>
    <Pill f={f} at={BEATS.rise} out={BEATS.front + 24} x={360} y={220}>提</Pill>
  </>
);

export const ProofCaption: React.FC<{f: number}> = ({f}) => (
  <>
    <Show f={f} at={BEATS.fan - 16} out={BEATS.explode - 12} style={{left: 64, top: 72, color: C.ink}}>
      <Rise f={f} at={BEATS.fan - 8} out={BEATS.explode - 10} text="样 · 压" style={{...gro(56, 700, -0.05)}} />
    </Show>
    <Show f={f} at={BEATS.pick - 4} out={BEATS.explode - 4} style={{left: 64, top: 148, color: C.ink}}>
      <Swap
        f={f}
        at={BEATS.press}
        h={34}
        a={<span style={{...sc(22, 500)}}>选定一张</span>}
        b={<span style={{...sc(22, 500)}}>其余压回后面</span>}
      />
    </Show>
    <Pill f={f} at={BEATS.press} out={BEATS.explode - 8} x={520} y={200}>压</Pill>
  </>
);

export const TeachCaption: React.FC<{f: number}> = ({f}) => (
  <>
    <Show f={f} at={BEATS.explode - 14} out={BEATS.noise - 8} style={{left: 64, top: 64, color: C.cream}}>
      <Rise f={f} at={BEATS.explode - 8} out={BEATS.noise - 6} text="这叠怎么构成" style={{...gro(48, 700, -0.04), color: C.cream}} />
    </Show>
    <Show f={f} at={BEATS.r1} out={BEATS.noise} style={{left: 64, top: 140, color: C.cream}}>
      <div style={{...sc(20, 500), opacity: 0.8}}>规则落在运动上，不是静图</div>
    </Show>
  </>
);

export const PitCaption: React.FC<{f: number}> = ({f}) => (
  <Show f={f} at={BEATS.noise - 18} out={BEATS.end - 8} style={{left: 64, top: 72, color: C.ink}}>
    <Swap
      f={f}
      at={BEATS.flat}
      h={56}
      a={<span style={{...gro(48, 700, -0.04)}}>叠太多</span>}
      b={
        <Swap
          f={f}
          at={BEATS.fix}
          h={56}
          a={<span style={{...gro(48, 700, -0.04)}}>没有焦点</span>}
          b={<span style={{...gro(48, 700, -0.04)}}>这样就对了</span>}
        />
      }
    />
  </Show>
);

export const EndTitle: React.FC<{f: number}> = ({f}) => {
  if (f < SCENE.END.in - 4) return null;
  return (
    <>
      <RiseBox f={f} at={SCENE.END.in} out={DURATION} h={90} style={{left: 72, top: 720}}>
        <div style={{...gro(84, 700, -0.05), color: C.cream}}>Card Stack</div>
      </RiseBox>
      <Show f={f} at={SCENE.END.in + 10} out={DURATION} style={{left: 76, top: 820, color: C.cream}}>
        <div style={{...sc(22, 500, 0.08), opacity: 0.7}}>卡片层叠</div>
      </Show>
      <Show f={f} at={SCENE.END.in + 22} out={DURATION} style={{left: 76, top: 868, display: 'flex', gap: 28, color: C.cream}}>
        {['3–4 张', '只读一张', '抽 / 提 / 压'].map((t) => (
          <span key={t} style={{...sc(18, 500)}}>{t}</span>
        ))}
      </Show>
      <Show f={f} at={SCENE.END.in + 40} out={DURATION} style={{left: 76, top: 920, color: C.red, ...gro(22, 700, 0.02)}}>
        @guanmo_ai
      </Show>
    </>
  );
};

export const Axis: React.FC<{f: number}> = ({f}) => {
  const o = tween(f, BEATS.explode - 8, 12) * (1 - tween(f, BEATS.noise - 6, 10));
  if (o <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: 168, top: 80, width: 2, height: 920, background: 'rgba(246,240,228,0.28)', opacity: o, zIndex: 6}}>
      <div style={{position: 'absolute', left: 10, top: 0, ...mono(12), color: C.cream}}>z</div>
      <div style={{position: 'absolute', left: 10, bottom: 0, ...mono(12), color: C.cream}}>0</div>
    </div>
  );
};

export const LightTable: React.FC<{f: number}> = ({f}) => {
  const o = tween(f, SCENE.PROOF.in - 10, 14) * (1 - tween(f, SCENE.TEACH.in, 12));
  if (o <= 0.001) return null;
  const lines: CSS = {position: 'absolute', inset: 80, opacity: o * 0.35, backgroundImage: 'linear-gradient(rgba(17,17,17,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.18) 1px, transparent 1px)', backgroundSize: '80px 80px'};
  return <div style={lines} />;
};

export const LayerTicks: React.FC<{f: number}> = ({f}) => {
  const o = tween(f, BEATS.layer - 6, 10) * (1 - tween(f, BEATS.fan - 8, 10));
  if (o <= 0.001) return null;
  return (
    <div style={{position: 'absolute', right: 72, top: 160, opacity: o, color: C.cream, zIndex: 12}}>
      {['L1 封面', 'L2 正文', 'L3 专色', 'L4 印张'].map((t, i) => (
        <div key={t} style={{...mono(14), marginBottom: 14, color: i === 3 && f >= BEATS.mark ? C.red : C.cream}}>
          {t}
        </div>
      ))}
    </div>
  );
};
