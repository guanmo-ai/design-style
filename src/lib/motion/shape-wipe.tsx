import React from 'react';
export const triPoints = (s: number) => {
  const h = (s * Math.sqrt(3)) / 2;
  return `0,${(-2 * h) / 3} ${s / 2},${h / 3} ${-s / 2},${h / 3}`;
};
export const WipeShape: React.FC<{kind: number; p: number} & React.SVGProps<SVGElement>> = ({kind, p, ...rest}) => {
  if (kind === 0) return <circle cx={960} cy={540} r={1120 * p} {...(rest as React.SVGProps<SVGCircleElement>)} />;
  if (kind === 1)
    return (
      <rect
        x={-1100 * p}
        y={-1100 * p}
        width={2200 * p}
        height={2200 * p}
        transform={`translate(960 540) rotate(${90 * (1 - p)})`}
        {...(rest as React.SVGProps<SVGRectElement>)}
      />
    );
  return <polygon points={triPoints(4400 * p)} transform="translate(960 600)" {...(rest as React.SVGProps<SVGPolygonElement>)} />;
};


/** 给章节轮换背景；同一份章节表仍驱动形状擦除。 */
export const cycleBackgrounds = <T,>(chapters: T[], colors: readonly string[]): (T & {bg: string})[] => {
  if (!colors.length) throw new Error('背景色不能为空');
  return chapters.map((ch, i) => ({...ch, bg: colors[i % colors.length]}));
};
