import type React from 'react';

export type Scene<P = unknown> = {
  from: number;
  to: number;
  C: React.FC<{t: number}>;
  shift?: number;
  probe?: (t: number) => P | null;
  speed?: (t: number) => number;
  bg?: string;
  dark?: boolean;
};

/** 重叠场景仍按登记顺序合成，最后一个活跃场景提供背景和读数。 */
export const createSceneSampler = <P,>(scenes: Scene<P>[], background: string) => {
  if (!scenes.length) throw new Error('场景表不能为空');
  const sceneIndex = (t: number) => {
    let k = -1;
    for (let i = 0; i < scenes.length; i++) if (t >= scenes[i].from && t < scenes[i].to) k = i;
    return k;
  };
  const speedAt = (t: number) => {
    let v = 0;
    for (const s of scenes) if (t >= s.from && t < s.to && s.speed) v = Math.max(v, s.speed(t));
    return v;
  };
  return {
    sceneIndex,
    speedAt,
    probeAt: (t: number): P | null => {
      const s = scenes[sceneIndex(t)];
      return s?.probe ? s.probe(t) : null;
    },
    bgAt: (t: number) => scenes[sceneIndex(t)]?.bg ?? background,
    darkAt: (t: number) => !!scenes[sceneIndex(t)]?.dark,
  };
};

/** 半帧快门，子帧不能跨越场景边界；保持 015 的取样顺序与权重。 */
export const motionBlurTimes = (f: number, blur: number, speedAt: (t: number) => number, sceneIndex: (t: number) => number) => {
  const v = blur > 1 ? speedAt(f) : 0;
  const n = v > 4 ? Math.min(blur, 2 + Math.round(v / 12)) : 1;
  const layers: number[] = [];
  for (let i = 0; i < n; i++) {
    let t = n === 1 ? f : f - 0.5 * (1 - i / (n - 1));
    if (sceneIndex(t) !== sceneIndex(f)) t = f;
    layers.push(t);
  }
  return layers;
};

export type ProbeChannel = {value: (t: number) => number; from?: number; to?: number};
/** 剧本导出每帧数字；窗口外保留 NaN，JSON 写出时自然变成 null。 */
export const probeChannels = (f: number, channels: Record<string, ProbeChannel>) =>
  Object.fromEntries(Object.entries(channels).map(([name, c]) => [name,
    f >= (c.from ?? -Infinity) && f < (c.to ?? Infinity) ? c.value(f) : NaN,
  ]));
