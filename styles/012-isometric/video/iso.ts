/** 012 · 等距投影：真等距 / 军事斜二测 / 产品柔阴影（仍是平行投影，没有灭点） */
export type Mode = 'iso' | 'military' | 'product';
export type Pt = {x: number; y: number};
export type V3 = {x: number; y: number; z: number};

export const COS30 = Math.sqrt(3) / 2;
export const SIN30 = 0.5;
const DEG = Math.PI / 180;

export const yawPoint = (p: V3, a: number): V3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return {x: p.x * c - p.z * s, y: p.y, z: p.x * s + p.z * c};
};

/** 把世界坐标投到 2D（尚未乘 unit、尚未加 origin） */
export const project = (p: V3, mode: Mode = 'iso'): Pt => {
  const {x, y, z} = p;
  if (mode === 'military') {
    // 2:1 斜二测（游戏 / 军事地图常用）：钻石格更扁，仍无灭点
    return {x: x - z, y: (x + z) * 0.5 - y};
  }
  if (mode === 'product') {
    // 更侧的平行斜二测，仍无灭点；配柔阴影当产品插画
    const ax = 40 * DEG;
    const az = 16 * DEG;
    return {x: x * Math.cos(ax) - z * Math.cos(az), y: x * Math.sin(ax) + z * Math.sin(az) - y};
  }
  return {x: (x - z) * COS30, y: (x + z) * SIN30 - y};
};

export const toScreen = (p: V3, origin: Pt, unit: number, mode: Mode, yaw = 0): Pt => {
  const q = project(yawPoint(p, yaw), mode);
  return {x: origin.x + q.x * unit, y: origin.y + q.y * unit};
};

export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

export const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');

export const mix = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
};

export const faceColors = (hex: string, mode: Mode) => {
  const soft = mode === 'product';
  return {
    top: mix(hex, '#FFFFFF', soft ? 0.34 : 0.22),
    right: mix(hex, '#1B2430', soft ? 0.1 : 0.14),
    left: mix(hex, '#1B2430', soft ? 0.34 : 0.3),
    front: mix(hex, '#1B2430', 0.22),
    west: mix(hex, '#1B2430', 0.18),
  };
};

const area = (pts: Pt[]) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a;
};

export type Face = {pts: Pt[]; fill: string; key: string; depth: number; kind: 'face' | 'shadow'};

export type BoxSpec = {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
  appear?: number;
  shadow?: boolean;
  id?: string;
};

/** 可见面（背向剔除）+ 地面影子。appear 只压缩高度，从地面长出来。 */
export const boxFaces = (b: BoxSpec, origin: Pt, unit: number, mode: Mode, yaw: number): Face[] => {
  const t = b.appear ?? 1;
  if (t <= 0.001) return [];
  const h = Math.max(0.02, b.h * t);
  const y = b.y;
  const P = (px: number, py: number, pz: number) => toScreen({x: px, y: py, z: pz}, origin, unit, mode, yaw);
  const cols = faceColors(b.color, mode);
  const mid = yawPoint({x: b.x + b.w / 2, y: y + h / 2, z: b.z + b.d / 2}, yaw);
  const depth0 = mid.x + mid.z + mid.y * 0.35;
  const raw: {key: string; fill: string; c: Pt[]; depth: number}[] = [
    {key: 'top', fill: cols.top, c: [P(b.x, y + h, b.z), P(b.x + b.w, y + h, b.z), P(b.x + b.w, y + h, b.z + b.d), P(b.x, y + h, b.z + b.d)], depth: depth0 + 0.4},
    {key: 'right', fill: cols.right, c: [P(b.x + b.w, y, b.z), P(b.x + b.w, y + h, b.z), P(b.x + b.w, y + h, b.z + b.d), P(b.x + b.w, y, b.z + b.d)], depth: depth0 + 0.2},
    {key: 'left', fill: cols.left, c: [P(b.x, y, b.z + b.d), P(b.x + b.w, y, b.z + b.d), P(b.x + b.w, y + h, b.z + b.d), P(b.x, y + h, b.z + b.d)], depth: depth0 + 0.2},
    {key: 'front', fill: cols.front, c: [P(b.x, y, b.z), P(b.x + b.w, y, b.z), P(b.x + b.w, y + h, b.z), P(b.x, y + h, b.z)], depth: depth0},
    {key: 'west', fill: cols.west, c: [P(b.x, y, b.z), P(b.x, y + h, b.z), P(b.x, y + h, b.z + b.d), P(b.x, y, b.z + b.d)], depth: depth0},
  ];
  // 真等距镜头在 +x/+z：顶、右(+x)、左(+z) 始终可见。另外两面只在投影面积明确朝前时补上。
  const faces: Face[] = raw
    .filter((f) => f.key === 'top' || f.key === 'right' || f.key === 'left' || area(f.c) < -80)
    .map((f) => ({pts: f.c, fill: f.fill, key: `${b.id ?? ''}-${f.key}`, depth: f.depth, kind: 'face' as const}));

  if (b.shadow !== false && t > 0.15) {
    const lift = 0.08 * unit;
    const s = [
      P(b.x, 0, b.z),
      P(b.x + b.w, 0, b.z),
      P(b.x + b.w, 0, b.z + b.d),
      P(b.x, 0, b.z + b.d),
    ].map((p) => ({x: p.x + lift * 0.4, y: p.y + lift}));
    faces.unshift({pts: s, fill: `rgba(27,36,48,${0.1 + 0.1 * t})`, key: `${b.id ?? ''}-sh`, depth: depth0 - 8, kind: 'shadow'});
  }
  return faces;
};

export const poly = (pts: Pt[]) => pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

/** 把矩形 UI 贴到等距顶面（平行四边形）上 */
export const faceMatrix = (p0: Pt, px: Pt, pz: Pt, w: number, h: number) => {
  const a = (px.x - p0.x) / w;
  const b = (px.y - p0.y) / w;
  const c = (pz.x - p0.x) / h;
  const d = (pz.y - p0.y) / h;
  return `matrix(${a}, ${b}, ${c}, ${d}, ${p0.x}, ${p0.y})`;
};

export const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
