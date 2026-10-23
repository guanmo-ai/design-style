/**
 * 把真网页（demo/index.html）嵌进视频：一个同源 iframe，每一帧 scrollTo(y) + __frame() 同步画好再截图。
 * iframe 的宽高就是浏览器视口——改宽度，网页里真正的 @media 断点就会生效（规则 05 的那一下不是做出来的，是网页自己变的）。
 */
import React, {useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

export type Anchors = {
  vh: number; w: number; max: number; hero: number; city: number[]; cityBox: {top: number; h: number}; cityStepTops: number[];
  p1: number; snow: number[]; snowBox: {top: number; h: number}; p2: number; spin0: number; spin1: number; end: number;
};
type Win = Window & {__frame?: (y?: number) => void; __ready?: Promise<boolean>; __anchors?: () => Anchors};

export const Web: React.FC<{
  name: string;
  w: number;
  h: number;
  y: number;
  query?: string;
  /** 写到网页 <html> 上的 CSS 变量（例如 --steps-op） */
  vars?: Record<string, string | number>;
  /** 真的把 iframe 滚到这里（文字层用：它的 Y 是“假装”的，真滚动只为把要看的那一段挪进来） */
  realScroll?: number;
  /** false：这一帧看不见，不用画 */
  active?: boolean;
  style?: React.CSSProperties;
}> = ({name, w, h, y, query = '', vars, realScroll, active = true, style}) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const [handle] = useState(() => delayRender(`web:${name}`, {timeoutInMilliseconds: 120000}));
  const ready = useRef(false);
  const yRef = useRef(y);
  yRef.current = y;
  const extra = useRef({vars, realScroll, active});
  extra.current = {vars, realScroll, active};
  const draw = () => {
    const el = ref.current;
    const win = el?.contentWindow as Win | null;
    if (!ready.current || !win?.__frame || !extra.current.active) return;
    el!.getBoundingClientRect(); // 先让父页面排版，iframe 的视口尺寸才会更新
    const {vars: v, realScroll: rs} = extra.current;
    if (v) for (const [k, val] of Object.entries(v)) win.document.documentElement.style.setProperty(k, String(val));
    if (rs != null) win.scrollTo(0, rs);
    win.__frame(yRef.current);
  };
  useLayoutEffect(draw);
  const onLoad = async () => {
    const win = ref.current?.contentWindow as Win | null;
    await win?.__ready;
    ready.current = true;
    draw();
    // 多等两帧，确保 iframe 已经合成
    requestAnimationFrame(() => requestAnimationFrame(() => continueRender(handle)));
  };
  return (
    <iframe
      ref={ref}
      title={name}
      src={staticFile(`03-scrollytelling/demo/index.html`) + `?video${query}`}
      onLoad={onLoad}
      style={{width: w, height: h, border: 0, display: 'block', background: 'transparent', visibility: active ? 'visible' : 'hidden', ...style}}
    />
  );
};
