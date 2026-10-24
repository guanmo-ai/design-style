/** 010 · 片尾：三句可带走的话 + 六格代码渲定妆 + @guanmo_ai */
import React from 'react';
import {spr} from '../../../src/lib/anim';
import {C, HILLS} from '../tokens';
import {AT, LINES} from './timeline';
import {W, n1} from './layers';
import {Txt} from './ui';

const TW = 276;
const TH = 168;

const MiniFolk: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect width={TW} height={TH} fill={C.wall} />
    <g transform={`translate(138 84) rotate(${n1(t * 0.55)})`}>
      <circle r={58} fill="#F7E2A8" opacity={0.45} />
      <circle r={52} fill={C.folk} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <ellipse key={a} cx={0} cy={-34} rx={7} ry={13} fill={C.wall} transform={`rotate(${a})`} />
      ))}
      <circle r={11} fill={C.wall} />
      <circle r={4} fill={C.folk} />
    </g>
  </g>
);

const MiniStrata: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect width={TW} height={TH} fill={C.sky} />
    <circle cx={n1(214 + Math.sin(t * 0.04) * 6)} cy={32} r={16} fill={C.sun} />
    {HILLS.map((c, i) => {
      const y = 48 + i * 22 + Math.sin(t * 0.05 + i) * (2 + i);
      return (
        <path
          key={i}
          d={`M-8 ${n1(y)} C 50 ${n1(y - 10)} 110 ${n1(y + 12)} 170 ${n1(y)} S 240 ${n1(y - 8)} 284 ${n1(y + 4)} V${TH + 4} H-8 Z`}
          fill={c}
        />
      );
    })}
  </g>
);

const MiniDio: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect width={TW} height={TH} fill={C.cream} />
    <rect x={10} y={12} width={256} height={144} rx={8} fill={C.sky} />
    {HILLS.map((c, i) => {
      const lift = 6 + i * 3 + Math.sin(t * 0.06 + i) * 3;
      const y = 44 + i * 20 - lift;
      return (
        <path
          key={i}
          d={`M14 ${n1(y)} C 70 ${n1(y - 8)} 130 ${n1(y + 10)} 180 ${n1(y)} S 240 ${n1(y - 6)} 266 ${n1(y + 3)} V156 H14 Z`}
          fill={c}
          filter="url(#shMid)"
        />
      );
    })}
  </g>
);

const MiniSil: React.FC<{t: number}> = ({t}) => {
  const g = 4 + Math.sin(t * 0.08) * 3;
  return (
    <g>
      <rect width={TW / 2 - g / 2} height={TH} fill={C.paper} />
      <path d={`M-4 78 C 40 62 80 96 138 78 V${TH} H-4 Z`} fill={C.ink} />
      <rect x={n1(TW / 2 + g / 2)} width={TW / 2 - g / 2} height={TH} fill={C.ink} />
      <path d={`M${n1(TW / 2 + g / 2)} 78 C 180 62 230 96 280 78 V${TH} H${n1(TW / 2 + g / 2)} Z`} fill={C.paper} />
      <rect x={n1(TW / 2 - 2 - g / 2)} width={n1(4 + g)} height={TH} fill={C.folk} />
    </g>
  );
};

const MiniTorn: React.FC<{t: number}> = ({t}) => {
  const jag = (i: number) => 88 + 10 * Math.sin(i * 1.6 + t * 0.05);
  return (
    <g>
      <rect width={TW} height={TH} fill="#1A1410" />
      <path d={`M110 20 C 150 40 190 28 230 48 V148 H46 Z`} fill={HILLS[2]} />
      <circle cx={200} cy={44} r={12} fill={C.sun} />
      <path
        d={`M0 0 H${n1(jag(0))} ${[1, 2, 3, 4, 5, 6, 7, 8]
          .map((i) => `L${n1(jag(i))} ${n1((TH / 8) * i)}`)
          .join(' ')} L0 ${TH} Z`}
        fill="#E8D4C4"
      />
      <ellipse cx={40} cy={50} rx={36} ry={24} fill="#C9A28A" opacity={0.45} />
    </g>
  );
};

const MiniType: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect width={TW} height={TH} fill={C.sky} />
    <rect y={n1(70 + Math.sin(t * 0.05) * 3)} width={TW} height={40} fill={HILLS[2]} />
    <rect y={n1(108 + Math.sin(t * 0.04) * 2)} width={TW} height={70} fill={HILLS[4]} />
    <circle cx={n1(210 + Math.sin(t * 0.03) * 5)} cy={40} r={16} fill={C.sun} />
    <rect width={TW} height={TH} fill={C.paper} mask="url(#miniTypePunch)" />
    <defs>
      <mask id="miniTypePunch" maskUnits="userSpaceOnUse" x="0" y="0" width={TW} height={TH}>
        <rect width={TW} height={TH} fill="white" />
        <text x={138} y={104} fontFamily="Jost" fontSize={54} fontWeight={800} textAnchor="middle" fill="black" letterSpacing={2}>
          PAPER
        </text>
      </mask>
    </defs>
  </g>
);

const THUMBS: {en: string; zh: string; Art: React.FC<{t: number}>}[] = [
  {en: 'FOLK', zh: '镂空', Art: MiniFolk},
  {en: 'STRATA', zh: '层叠', Art: MiniStrata},
  {en: 'DIORAMA', zh: '纸板', Art: MiniDio},
  {en: 'SILHOUETTE', zh: '剪影', Art: MiniSil},
  {en: 'TORN', zh: '毛边', Art: MiniTorn},
  {en: 'TYPE', zh: '剪字', Art: MiniType},
];

export const Take: React.FC<{f: number}> = ({f}) => {
  const t = f - AT.take;
  const sway = Math.sin(t * 0.05) * 4;
  return (
    <g>
      <rect width={W} height={1080} fill={C.wall} />
      <g transform={`translate(${n1(sway)} 0)`}>
        <circle cx={1680} cy={180} r={90} fill={C.folk} opacity={0.9} />
        <circle cx={1680} cy={180} r={62} fill={C.wall} />
        <circle cx={1680} cy={180} r={18} fill={C.folk} />
      </g>
      {LINES.map((line, i) => {
        const k = spr(f, AT.take + 8 + i * 40, {damping: 12, mass: 0.7, stiffness: 170});
        if (k < 0.01) return null;
        const flutter = Math.sin(t * 0.07 + i) * 3;
        return (
          <g key={i} opacity={k} transform={`translate(${n1((1 - k) * -36 + flutter)} ${n1(72 + i * 188)})`} filter="url(#shNear)">
            <rect x={72} width={1180} height={164} rx={22} fill={C.paper} />
            <rect x={72} width={14} height={164} rx={8} fill={i === 0 ? C.folk : i === 1 ? HILLS[3] : C.sun} />
            <Txt x={114} y={66} size={18} font="mono" c={C.sun} ls={1.4}>
              {`0${i + 1}  TAKE AWAY`}
            </Txt>
            <Txt x={114} y={118} size={30} font="cn" w={900} c={C.ink}>
              {line}
            </Txt>
          </g>
        );
      })}
      {THUMBS.map((thumb, i) => {
        const k = spr(f, AT.take + 118 + i * 8, {damping: 11, mass: 0.6, stiffness: 190});
        if (k < 0.01) return null;
        const x = 72 + i * 296;
        const bob = Math.sin(t * 0.09 + i * 0.7) * 4;
        return (
          <g key={thumb.en} opacity={k} transform={`translate(${n1(x)} ${n1(656 + (1 - k) * 24 + bob)})`} filter="url(#shMid)">
            <clipPath id={`thumb${i}`}>
              <rect width={TW} height={TH} rx={18} />
            </clipPath>
            <g clipPath={`url(#thumb${i})`}>
              <thumb.Art t={t} />
            </g>
            <rect width={TW} height={TH} rx={18} fill="none" stroke={C.paper} strokeWidth={2} opacity={0.35} />
            <rect y={118} width={TW} height={50} rx={0} fill="rgba(10,16,20,0.46)" />
            <Txt x={16} y={138} size={12} font="mono" c={C.paper} ls={1.1}>
              {thumb.en}
            </Txt>
            <Txt x={16} y={158} size={20} font="cn" w={700} c={C.paper}>
              {thumb.zh}
            </Txt>
          </g>
        );
      })}
      {(() => {
        const handle = spr(f, AT.take + 168, {damping: 14, mass: 0.8, stiffness: 140});
        if (handle < 0.01) return null;
        return (
          <g opacity={handle} transform={`translate(0 ${n1((1 - handle) * 16)})`}>
            <rect x={760} y={852} width={400} height={64} rx={18} fill={C.paper} filter="url(#shNear)" />
            <Txt x={960} y={894} size={26} font="display" w={600} c={C.ink} anchor="middle" ls={1.2}>
              @guanmo_ai
            </Txt>
          </g>
        );
      })()}
    </g>
  );
};
