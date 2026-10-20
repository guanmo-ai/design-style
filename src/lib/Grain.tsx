import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

/** 纸张颗粒：浏览器内用确定性随机数生成噪点贴图（无需任何图片素材） */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
  const frame = useCurrentFrame();
  const url = useMemo(() => {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      const v = Math.floor(random(`grain-${i}`) * 255);
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL('image/png');
  }, []);
  const step = Math.floor(frame / 2);
  const ox = Math.floor(random(`gx-${step}`) * 256);
  const oy = Math.floor(random(`gy-${step}`) * 256);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${url})`,
        backgroundPosition: `${ox}px ${oy}px`,
        mixBlendMode: 'multiply',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.22}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(40,25,10,${strength}) 100%)`,
      mixBlendMode: 'multiply',
      pointerEvents: 'none',
    }}
  />
);
