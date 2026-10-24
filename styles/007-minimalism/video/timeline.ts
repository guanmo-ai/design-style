/** 007 · 六改时间轴。120 BPM @ 60fps → 1 拍 = 30 帧 · 24.0s · 章重叠 12 帧 */
import {CELLS} from './script';

export const BEAT = 30;
export const S16 = 7.5;

const at = (id: (typeof CELLS)[number]['id']) => CELLS.find((b) => b.id === id)!.at;

export const AT = {
  blast: at('blast'),
  split: at('split'),
  app: at('app'),
  web: at('web'),
  pay: at('pay'),
  data: at('data'),
  vs: at('vs'),
  bone: at('bone'),
  hold: at('hold'),
  end: at('end'),
};

export const DURATION = 1440;

export const CHAPTERS: [string, string, number][] = CELLS.filter((b) => b.id !== 'end').map((b) => [b.zh, b.en, b.at]);
