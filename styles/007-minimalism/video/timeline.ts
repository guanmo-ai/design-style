/** 007 · Minimalism —— 时间轴（帧）。120 BPM @ 60fps → 1 拍 = 30 帧 · 24.0s */
import {BEATS} from './script';

export const BEAT = 30;
export const S16 = 7.5;

const at = (id: (typeof BEATS)[number]['id']) => BEATS.find((b) => b.id === id)!.at;

export const AT = {
  pile: at('pile'),
  cut: at('cut'),
  bone: at('bone'),
  app: at('app'),
  web: at('web'),
  pay: at('pay'),
  vs: at('vs'),
  poster: at('poster'),
  end: at('end'),
};

export const DURATION = 1440; // 24.0s

export const CHAPTERS: [string, string, number][] = BEATS.filter((b) => b.id !== 'end').map((b) => [b.zh, b.en, b.at]);
