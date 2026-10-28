/**
 * 014 · 液态玻璃 —— WebGL2 渲染器（第三版）
 *
 * 两个程序：
 *   GLASS  把“内容”贴图当作玻璃后面的世界，叠上：
 *            · 涟漪：从某点往外跑的一圈波，把整面内容弯过去（落下时整面墙是液体）
 *            · 光池：每块玻璃投在后面的影子 + 焦散（玻璃把光聚起来的亮环与流动的光网）；
 *              离墙越高（height），影子和光池离它越远、越散——落下时三者收拢在一起
 *            · 玻璃本身：距离场 smooth-min 合成形状（圆可以带 2 / 3 阶的“抖动”模态），
 *              按“折射量 = 边缘的坡度”往里取样，R/G/B 各取一次（色散），需要时在 mipmap 上取（磨砂），
 *              再加高光、底色、Aqua 的果冻高光、Glassmorphism 的白边；
 *              alt = 1 的玻璃从第二张贴图取样——镜片里已经是下一个世界（穿过玻璃的转场）
 *   QUAD   用一个单应矩阵把一张贴图（设备屏幕）贴到屏幕上的四边形里：3D 透视的手机 / 浏览器，
 *          带圆角、边框和随转动滑过的高光；也用来把整张内容画进合成缓冲
 *
 * 所有坐标都是“图像坐标”（左上为原点）；画到屏幕时翻转一次，画进缓冲时不翻，缓冲的贴图因此与画布贴图同向。
 */

export const MAX_SHAPES = 16;
export const MAX_GROUPS = 4;
export const MAX_RIPPLES = 4;

export type Shape = {
  cx: number;
  cy: number;
  hw: number;
  hh: number;
  r: number;
  group: number;
  /** 圆的抖动模态：r(θ) = r · (1 + a2·cos 2(θ − p2) + a3·cos 3(θ − p3)) */
  a2?: number;
  p2?: number;
  a3?: number;
  p3?: number;
};

export type GroupMat = {
  bevel: number;
  edge: number;
  mag: number;
  frost: number;
  tint: [number, number, number, number];
  chroma: number;
  rim: number;
  shadow: number;
  gloss: number;
  border: number;
  k: number;
  opacity: number;
  cx: number;
  cy: number;
  height: number; // 0 = 贴在墙上，1 = 离墙很高
  caustic: number; // 光池强度
  alt: number; // 1 = 从第二张贴图取样
};

export type Ripple = {cx: number; cy: number; age: number; amp: number; speed: number; lambda: number; decay: number};

const VS = `#version 300 es
in vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const GLASS_FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform sampler2D uAlt;
uniform vec2 uRes; // 逻辑尺寸（1920×1080）；实际像素 = 逻辑 × uScale
uniform float uScale;
uniform float uFlip;
uniform float uPhase; // 0—2π，周期 = 全片长度（光网首尾一致）
uniform int uN;
uniform vec4 uSA[${MAX_SHAPES}];
uniform vec2 uSB[${MAX_SHAPES}];
uniform vec4 uSM[${MAX_SHAPES}];
uniform vec4 uMA[${MAX_GROUPS}];
uniform vec4 uMB[${MAX_GROUPS}];
uniform vec4 uMC[${MAX_GROUPS}];
uniform vec4 uMD[${MAX_GROUPS}];
uniform vec2 uME[${MAX_GROUPS}];
uniform vec4 uMF[${MAX_GROUPS}];
uniform vec4 uBox[${MAX_GROUPS}];
uniform vec4 uRA[${MAX_RIPPLES}]; // cx, cy, age, amp
uniform vec4 uRB[${MAX_RIPPLES}]; // speed, lambda, decay, active
uniform vec2 uLight;
out vec4 o;

const float TAU = 6.28318530718;

float sdShape(vec2 p, int i){
  vec4 a = uSA[i];
  float r = uSB[i].x;
  vec4 m = uSM[i];
  vec2 q = p - a.xy;
  if (abs(m.x) + abs(m.z) > 0.0001){
    float th = atan(q.y, q.x);
    float rr = r * (1.0 + m.x * cos(2.0 * (th - m.y)) + m.z * cos(3.0 * (th - m.w)));
    return length(q) - rr;
  }
  vec2 d = abs(q) - (a.zw - r);
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}
float smin(float a, float b, float k){
  if (k <= 0.0) return min(a, b);
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
float groupD(vec2 p, int g){
  float d = 1e5;
  float k = uMD[g].y;
  for (int i = 0; i < ${MAX_SHAPES}; i++){
    if (i >= uN) break;
    if (int(uSB[i].y + 0.5) != g) continue;
    d = smin(d, sdShape(p, i), k);
  }
  return d;
}

// 涟漪：往外跑的一圈波包，前沿陡、尾巴慢慢消失
vec3 ripple(vec2 p){
  vec2 off = vec2(0.0);
  float sh = 0.0;
  for (int i = 0; i < ${MAX_RIPPLES}; i++){
    if (uRB[i].w < 0.5) continue;
    vec2 d = p - uRA[i].xy;
    float r = length(d) + 1e-3;
    float front = uRB[i].x * uRA[i].z;
    float x = r - front;
    float env = exp(-max(x, 0.0) * max(x, 0.0) / (0.3 * uRB[i].y * uRB[i].y)) * exp(-max(-x, 0.0) / (2.2 * uRB[i].y));
    float amp = uRA[i].w * exp(-uRA[i].z / uRB[i].z) * env;
    float w = sin(TAU * x / uRB[i].y);
    off += d / r * amp * w;
    sh += amp * cos(TAU * x / uRB[i].y) / uRB[i].y * 6.0;
  }
  return vec3(off, sh);
}
vec3 tex(sampler2D t, vec2 p, float lod){
  vec2 uv = p / uRes;
  if (lod <= 0.01) return texture(t, uv).rgb;
  vec2 s = exp2(lod) / uRes;
  vec3 c = textureLod(t, uv, lod).rgb * 0.4;
  c += textureLod(t, uv + vec2( s.x, 0.3 * s.y), lod).rgb * 0.15;
  c += textureLod(t, uv + vec2(-s.x, -0.3 * s.y), lod).rgb * 0.15;
  c += textureLod(t, uv + vec2(-0.3 * s.x, s.y), lod).rgb * 0.15;
  c += textureLod(t, uv + vec2(0.3 * s.x, -s.y), lod).rgb * 0.15;
  return c;
}
// 光网：经典的水下焦散迭代（一格一格的亮丝）；每层的时间倍数取整数，uPhase 走一圈正好回到原样（首尾一致）
float web(vec2 uv){
  vec2 p = mod(uv * TAU, TAU) - 250.0;
  vec2 i = p;
  float c = 1.0;
  const float inten = 0.005;
  for (int n = 0; n < 5; n++){
    float t = uPhase * float(n == 0 ? -2 : n == 1 ? -1 : n == 2 ? 1 : n == 3 ? 2 : 3);
    i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
  }
  c /= 5.0;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.0);
}
// 光池：玻璃投在后面的影子与焦散（在内容坐标 q 处），返回 (乘子, 加亮)
vec2 pool(vec2 q){
  float mul = 1.0;
  float add = 0.0;
  for (int g = 0; g < ${MAX_GROUPS}; g++){
    float op = uMD[g].z;
    if (op <= 0.0) continue;
    float H = uMF[g].x;
    vec2 sd = -normalize(uLight) * (10.0 + 70.0 * H);
    vec4 b = uBox[g];
    float m = 120.0 + 80.0 * H;
    vec2 qq = q - sd;
    if (qq.x < b.x - m || qq.x > b.z + m || qq.y < b.y - m || qq.y > b.w + m) continue;
    float ds = groupD(qq, g);
    float soft = 16.0 + 46.0 * H;
    float sh = uMC[g].z * op * exp(-max(ds, 0.0) / soft) * (ds > 0.0 ? 1.0 : 0.45);
    mul *= 1.0 - sh * (1.0 - 0.4 * H);
    float cs = uMF[g].y * op * (1.0 - 0.55 * H);
    if (cs > 0.0 && ds < 4.0){
      float bevel = max(uMA[g].x, 12.0);
      float dep = -ds;
      float ring = exp(-pow((dep - 0.3 * bevel) / (0.16 * bevel + 2.0 + 10.0 * H), 2.0));
      float inner = smoothstep(0.0, bevel * 1.2, dep);
      float wb = web((qq - uME[g]) / 180.0) * inner;
      float edge = smoothstep(4.0, -2.0, ds);
      add += cs * edge * (0.5 * ring + 0.32 * wb);
    }
  }
  return vec2(mul, add);
}
// 被光照过的内容：涟漪弯过的取样 + 光池
vec3 lit(sampler2D t, vec2 p, float lod){
  vec3 rp = ripple(p);
  vec3 c = tex(t, p + rp.xy, lod);
  vec2 pl = pool(p + rp.xy);
  c = c * pl.x + vec3(1.0, 0.98, 0.93) * pl.y;
  c += rp.z * 0.5;
  return c;
}

void main(){
  vec2 fc = gl_FragCoord.xy / uScale;
  vec2 p = vec2(fc.x, uFlip > 0.5 ? uRes.y - fc.y : fc.y);
  vec3 col = lit(uTex, p, 0.0);

  for (int g = 0; g < ${MAX_GROUPS}; g++){
    float op = uMD[g].z;
    if (op <= 0.0) continue;
    vec4 b = uBox[g];
    if (p.x < b.x - 4.0 || p.x > b.z + 4.0 || p.y < b.y - 4.0 || p.y > b.w + 4.0) continue;
    float d = groupD(p, g);
    if (d > 1.0) continue;
    float cov = clamp(0.5 - d, 0.0, 1.0) * op;
    vec2 e = vec2(1.0, 0.0);
    vec2 n = normalize(vec2(groupD(p + e.xy, g) - groupD(p - e.xy, g), groupD(p + e.yx, g) - groupD(p - e.yx, g)) + 1e-6);
    float depth = max(-d, 0.0);
    float bevel = max(uMA[g].x, 0.001);
    float t = clamp(1.0 - depth / bevel, 0.0, 1.0);
    float slope = pow(t, 2.4) * step(0.5, uMA[g].x);
    vec2 off = -n * slope * uMA[g].x * uMA[g].y - (p - uME[g]) * uMA[g].z;
    float lod = uMA[g].w > 0.5 ? max(0.0, log2(uMA[g].w * uScale)) : 0.0;
    float ch = uMC[g].x;
    vec3 gc;
    if (uMF[g].z > 0.5){
      gc.r = tex(uAlt, p + off * (1.0 + ch), lod).r;
      gc.g = tex(uAlt, p + off, lod).g;
      gc.b = tex(uAlt, p + off * (1.0 - ch), lod).b;
    } else {
      // 只在绿通道上算一次光池与涟漪，三个通道共用（够用，也省）
      vec3 rp = ripple(p + off);
      vec2 pl = pool(p + off + rp.xy);
      gc.r = tex(uTex, p + rp.xy + off * (1.0 + ch), lod).r;
      gc.g = tex(uTex, p + rp.xy + off, lod).g;
      gc.b = tex(uTex, p + rp.xy + off * (1.0 - ch), lod).b;
      gc = gc * pl.x + vec3(1.0, 0.98, 0.93) * pl.y;
    }
    gc = mix(gc, uMB[g].rgb, uMB[g].a);
    float gl = uMC[g].w;
    if (gl > 0.0){
      float cy = mix(b.y, b.w, 0.5);
      float inner = smoothstep(-3.0, -7.0, d);
      float top = clamp((cy - p.y) / max(cy - b.y, 1.0), 0.0, 1.0);
      gc = mix(gc, vec3(1.0), gl * inner * smoothstep(0.0, 0.15, top) * mix(0.25, 0.85, top));
      float bot = clamp((p.y - cy) / max(b.w - cy, 1.0), 0.0, 1.0);
      gc += gl * 0.25 * pow(bot, 3.0) * inner;
    }
    vec2 L = normalize(uLight);
    float facing = dot(n, L);
    float band = exp(-depth / 2.2);
    float wide = pow(clamp(1.0 - depth / (bevel * 0.9), 0.0, 1.0), 3.0) * step(0.5, uMA[g].x);
    float rim = uMC[g].y;
    float hi = pow(max(facing, 0.0), 1.6) * (0.95 * band + 0.35 * wide) * rim + pow(max(-facing, 0.0), 2.0) * band * 0.45 * rim;
    // 表面的一点高光斑：光照方向上、离边一个 bevel 的位置
    float spec = pow(max(facing, 0.0), 8.0) * exp(-pow((depth - bevel * 0.55) / (bevel * 0.35 + 1.0), 2.0)) * 0.35 * rim * step(0.5, uMA[g].x);
    float lo = max(-facing, 0.0) * wide * 0.10;
    gc *= 1.0 - lo;
    gc = mix(gc, vec3(1.0), clamp(hi + spec, 0.0, 1.0));
    float bd = uMD[g].x * exp(-depth / 0.9);
    gc = mix(gc, vec3(1.0), clamp(bd * 0.75, 0.0, 1.0));
    col = mix(col, gc, cov);
  }
  o = vec4(col, 1.0);
}`;

const QUAD_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform sampler2D uOv;
uniform float uHasOv;
uniform vec2 uRes;
uniform float uScale;
uniform float uFlip;
uniform mat3 uH; // 屏幕 → 贴图 UV（0—1）
uniform vec2 uSize; // 贴图像素尺寸（圆角、边框按它算）
uniform float uRadius;
uniform float uBezel;
uniform vec3 uBezelColor;
uniform float uSheen; // 高光带的位置（−1—2），沿对角线扫过
uniform float uSheenAmt;
uniform float uAlpha;
out vec4 o;
float sdRR(vec2 p, vec2 h, float r){ vec2 q = abs(p) - (h - r); return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  vec2 fc = gl_FragCoord.xy / uScale;
  vec2 p = vec2(fc.x, uFlip > 0.5 ? uRes.y - fc.y : fc.y);
  vec3 h = uH * vec3(p, 1.0);
  vec2 uv = h.xy / h.z;
  vec2 px = uv * uSize;
  vec2 hs = uSize * 0.5 + uBezel;
  float d = sdRR(px - uSize * 0.5, hs, uRadius + uBezel);
  // 抗锯齿：按屏幕上一个像素对应多少贴图像素估算
  float aa = max(length(dFdx(px)) + length(dFdy(px)), 0.8);
  float cov = clamp(0.5 - d / aa, 0.0, 1.0) * uAlpha;
  if (cov <= 0.0) discard;
  float di = sdRR(px - uSize * 0.5, uSize * 0.5, uRadius);
  vec3 c = texture(uSrc, clamp(uv, 0.0, 1.0)).rgb;
  if (uHasOv > 0.5){
    vec4 ov = texture(uOv, clamp(uv, 0.0, 1.0));
    c = mix(c, ov.rgb, ov.a); // 上传时没有预乘
  }
  float inScreen = clamp(0.5 - di / aa, 0.0, 1.0);
  c = mix(uBezelColor, c, inScreen);
  // 屏幕玻璃上滑过的一道高光
  float s = (uv.x * 0.7 + uv.y * 0.3) - uSheen;
  c += uSheenAmt * (exp(-s * s / 0.004) * 0.5 + exp(-s * s / 0.05) * 0.18) * inScreen;
  o = vec4(c, cov);
}`;

type Loc = Record<string, WebGLUniformLocation | null>;

const prog = (gl: WebGL2RenderingContext, fs: string) => {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'a');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
  return p;
};

const locs = (gl: WebGL2RenderingContext, p: WebGLProgram, names: string[]): Loc => {
  const o: Loc = {};
  for (const n of names) o[n] = gl.getUniformLocation(p, n);
  return o;
};

/** w / h：实际像素；s：实际像素 / 逻辑像素（草稿预览用 0.5） */
export type Target = {fb: WebGLFramebuffer | null; tex: WebGLTexture | null; w: number; h: number; s: number};

export type Device = {
  /** 屏幕上四个角（左上、右上、右下、左下） */
  corners: [number, number][];
  size: [number, number];
  radius: number;
  bezel: number;
  bezelColor: [number, number, number];
  sheen: number;
  sheenAmt: number;
  alpha: number;
};

/** 由单位正方形 → 四边形的单应矩阵，求逆得到 屏幕 → UV */
const homography = (c: [number, number][]) => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = c;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den;
  const h = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, cc = x0;
  const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3, ff = y0;
  // M：(u, v, 1) → (x, y, w)
  const M = [a, b, cc, d, e, ff, g, h, 1];
  // 求逆
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = M;
  const A = m4 * m8 - m5 * m7, B = -(m3 * m8 - m5 * m6), C = m3 * m7 - m4 * m6;
  const det = m0 * A + m1 * B + m2 * C;
  const inv = [
    A / det, -(m1 * m8 - m2 * m7) / det, (m1 * m5 - m2 * m4) / det,
    B / det, (m0 * m8 - m2 * m6) / det, -(m0 * m5 - m2 * m3) / det,
    C / det, -(m0 * m7 - m1 * m6) / det, (m0 * m4 - m1 * m3) / det,
  ];
  // WebGL 的 mat3 是列主序
  return new Float32Array([inv[0], inv[3], inv[6], inv[1], inv[4], inv[7], inv[2], inv[5], inv[8]]);
};

export class Renderer {
  gl: WebGL2RenderingContext;
  glass: WebGLProgram;
  quad: WebGLProgram;
  lg: Loc;
  lq: Loc;
  texCache = new Map<string, WebGLTexture>();
  targets = new Map<string, Target>();

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false, alpha: false});
    if (!gl) throw new Error('WebGL2 不可用：渲染时加 --gl=swangle');
    this.gl = gl;
    this.glass = prog(gl, GLASS_FS);
    this.quad = prog(gl, QUAD_FS);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.lg = locs(gl, this.glass, ['uTex', 'uAlt', 'uRes', 'uScale', 'uFlip', 'uPhase', 'uN', 'uSA', 'uSB', 'uSM', 'uMA', 'uMB', 'uMC', 'uMD', 'uME', 'uMF', 'uBox', 'uRA', 'uRB', 'uLight']);
    this.lq = locs(gl, this.quad, ['uSrc', 'uOv', 'uHasOv', 'uRes', 'uScale', 'uFlip', 'uH', 'uSize', 'uRadius', 'uBezel', 'uBezelColor', 'uSheen', 'uSheenAmt', 'uAlpha']);
  }

  /** 上传一张画布到命名贴图（带 mipmap） */
  upload(name: string, c: HTMLCanvasElement) {
    const gl = this.gl;
    let t = this.texCache.get(name);
    if (!t) {
      t = gl.createTexture()!;
      this.texCache.set(name, t);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.generateMipmap(gl.TEXTURE_2D);
    return t;
  }

  /** 命名的离屏缓冲（贴图同向于画布） */
  target(name: string, w: number, h: number, s = 1): Target {
    const gl = this.gl;
    const old = this.targets.get(name);
    if (old && old.w === w && old.h === h && old.s === s) return old;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const t = {fb, tex, w, h, s};
    this.targets.set(name, t);
    return t;
  }

  screen(s = 1): Target {
    return {fb: null, tex: null, w: this.gl.drawingBufferWidth, h: this.gl.drawingBufferHeight, s};
  }

  private bind(t: Target) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
    gl.viewport(0, 0, t.w, t.h);
  }

  mip(t: Target) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  clear(t: Target, rgb: [number, number, number]) {
    const gl = this.gl;
    this.bind(t);
    gl.disable(gl.BLEND);
    gl.clearColor(rgb[0], rgb[1], rgb[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /** 玻璃：从 src（与 alt）取样，画进 dst；blend > 0 时按常量透明度叠加（运动模糊求平均） */
  drawGlass(dst: Target, src: WebGLTexture, alt: WebGLTexture | null, shapes: Shape[], groups: GroupMat[], ripples: Ripple[], light: [number, number], phase: number, blend = 1) {
    const gl = this.gl;
    const L = this.lg;
    this.bind(dst);
    gl.useProgram(this.glass);
    if (blend < 1) {
      gl.enable(gl.BLEND);
      gl.blendColor(0, 0, 0, blend);
      gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
    } else gl.disable(gl.BLEND);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src);
    gl.uniform1i(L.uTex, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, alt ?? src);
    gl.uniform1i(L.uAlt, 1);
    gl.uniform2f(L.uRes, dst.w / dst.s, dst.h / dst.s);
    gl.uniform1f(L.uScale, dst.s);
    gl.uniform1f(L.uFlip, dst.fb ? 0 : 1);
    gl.uniform1f(L.uPhase, phase);
    const n = Math.min(MAX_SHAPES, shapes.length);
    gl.uniform1i(L.uN, n);
    const SA = new Float32Array(MAX_SHAPES * 4);
    const SB = new Float32Array(MAX_SHAPES * 2);
    const SM = new Float32Array(MAX_SHAPES * 4);
    const box = Array.from({length: MAX_GROUPS}, () => [1e5, 1e5, -1e5, -1e5]);
    shapes.slice(0, n).forEach((s, i) => {
      SA.set([s.cx, s.cy, s.hw, s.hh], i * 4);
      SB.set([Math.max(0, Math.min(s.r, s.hw, s.hh)), s.group], i * 2);
      SM.set([s.a2 ?? 0, s.p2 ?? 0, s.a3 ?? 0, s.p3 ?? 0], i * 4);
      const grow = 1 + Math.abs(s.a2 ?? 0) + Math.abs(s.a3 ?? 0);
      const b = box[s.group];
      const k = groups[s.group]?.k ?? 0;
      b[0] = Math.min(b[0], s.cx - s.hw * grow - k);
      b[1] = Math.min(b[1], s.cy - s.hh * grow - k);
      b[2] = Math.max(b[2], s.cx + s.hw * grow + k);
      b[3] = Math.max(b[3], s.cy + s.hh * grow + k);
    });
    gl.uniform4fv(L.uSA, SA);
    gl.uniform2fv(L.uSB, SB);
    gl.uniform4fv(L.uSM, SM);
    const MA = new Float32Array(MAX_GROUPS * 4), MB = new Float32Array(MAX_GROUPS * 4), MC = new Float32Array(MAX_GROUPS * 4);
    const MD = new Float32Array(MAX_GROUPS * 4), ME = new Float32Array(MAX_GROUPS * 2), MF = new Float32Array(MAX_GROUPS * 4);
    const BX = new Float32Array(MAX_GROUPS * 4);
    groups.slice(0, MAX_GROUPS).forEach((g, i) => {
      MA.set([g.bevel, g.edge, g.mag, g.frost], i * 4);
      MB.set(g.tint, i * 4);
      MC.set([g.chroma, g.rim, g.shadow, g.gloss], i * 4);
      MD.set([g.border, g.k, g.opacity, 0], i * 4);
      ME.set([g.cx, g.cy], i * 2);
      MF.set([g.height, g.caustic, g.alt, 0], i * 4);
      BX.set(box[i], i * 4);
    });
    gl.uniform4fv(L.uMA, MA);
    gl.uniform4fv(L.uMB, MB);
    gl.uniform4fv(L.uMC, MC);
    gl.uniform4fv(L.uMD, MD);
    gl.uniform2fv(L.uME, ME);
    gl.uniform4fv(L.uMF, MF);
    gl.uniform4fv(L.uBox, BX);
    const RA = new Float32Array(MAX_RIPPLES * 4), RB = new Float32Array(MAX_RIPPLES * 4);
    ripples.slice(0, MAX_RIPPLES).forEach((r, i) => {
      RA.set([r.cx, r.cy, r.age, r.amp], i * 4);
      RB.set([r.speed, r.lambda, r.decay, 1], i * 4);
    });
    gl.uniform4fv(L.uRA, RA);
    gl.uniform4fv(L.uRB, RB);
    gl.uniform2f(L.uLight, light[0], light[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
  }

  /** 把一张贴图画进 dst：全屏（corners 为空）或贴到透视四边形里 */
  drawQuad(dst: Target, src: WebGLTexture, ov: WebGLTexture | null, dev: Device | null) {
    const gl = this.gl;
    const L = this.lq;
    this.bind(dst);
    gl.useProgram(this.quad);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src);
    gl.uniform1i(L.uSrc, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, ov ?? src);
    gl.uniform1i(L.uOv, 1);
    gl.uniform1f(L.uHasOv, ov ? 1 : 0);
    const lw = dst.w / dst.s;
    const lh = dst.h / dst.s;
    gl.uniform2f(L.uRes, lw, lh);
    gl.uniform1f(L.uScale, dst.s);
    gl.uniform1f(L.uFlip, dst.fb ? 0 : 1);
    const d: Device = dev ?? {
      corners: [[0, 0], [lw, 0], [lw, lh], [0, lh]], size: [lw, lh], radius: 0, bezel: 0,
      bezelColor: [0, 0, 0], sheen: -5, sheenAmt: 0, alpha: 1,
    };
    gl.uniformMatrix3fv(L.uH, false, homography(d.corners));
    gl.uniform2f(L.uSize, d.size[0], d.size[1]);
    gl.uniform1f(L.uRadius, d.radius);
    gl.uniform1f(L.uBezel, d.bezel);
    gl.uniform3f(L.uBezelColor, ...d.bezelColor);
    gl.uniform1f(L.uSheen, d.sheen);
    gl.uniform1f(L.uSheenAmt, d.sheenAmt);
    gl.uniform1f(L.uAlpha, d.alpha);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
  }
}
