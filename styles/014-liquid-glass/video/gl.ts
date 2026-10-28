/**
 * 014 · 液态玻璃 —— 玻璃着色器
 *
 * 输入：一张“内容”画布（玻璃后面的一切）+ 若干块玻璃（每块由几个圆角矩形 / 圆 smooth-min 合成）。
 * 每个像素：
 *   1. 算到每块玻璃边缘的距离 d（外正内负）
 *   2. 在玻璃外：只叠投影
 *   3. 在玻璃里：按“折射量 = 边缘的坡度”把取样点往里挪（凸透镜），中间再整体放大一点；
 *      R / G / B 挪得略不一样（色散）；需要磨砂时用 mipmap 取模糊过的内容
 *   4. 加玻璃自己的光：迎光一侧的细亮边、背光一侧透出来的亮边、淡底色、Aqua 的果冻高光、Glassmorphism 的白边
 */

export const MAX_SHAPES = 12;
export const MAX_GROUPS = 4;

export type Shape = {
  cx: number;
  cy: number;
  hw: number; // 半宽
  hh: number; // 半高
  r: number; // 圆角（圆 = hw = hh = r）
  group: number;
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
  k: number; // smooth-min 的半径：越大“颈”越粗
  opacity: number;
  cx: number; // 放大中心
  cy: number;
};

const VS = `#version 300 es
in vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform int uN;
uniform vec4 uSA[${MAX_SHAPES}]; // cx, cy, hw, hh
uniform vec2 uSB[${MAX_SHAPES}]; // r, group
uniform vec4 uMA[${MAX_GROUPS}]; // bevel, edge, mag, frost
uniform vec4 uMB[${MAX_GROUPS}]; // tint rgb, tint a
uniform vec4 uMC[${MAX_GROUPS}]; // chroma, rim, shadow, gloss
uniform vec4 uMD[${MAX_GROUPS}]; // border, k, opacity, unused
uniform vec2 uME[${MAX_GROUPS}]; // 放大中心
uniform vec4 uBox[${MAX_GROUPS}]; // 每组的外接框（x0, y0, x1, y1），给 Aqua 高光用
uniform vec2 uLight;
out vec4 o;

float sdRR(vec2 p, vec4 a, float r){
  vec2 q = abs(p - a.xy) - (a.zw - r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
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
    d = smin(d, sdRR(p, uSA[i], uSB[i].x), k);
  }
  return d;
}
vec3 samp(vec2 p, float lod){
  vec2 uv = p / uRes;
  if (lod <= 0.01) return texture(uTex, uv).rgb;
  // 磨砂：在 mipmap 上取 5 个点，避免一格一格的块
  vec2 s = exp2(lod) / uRes;
  vec3 c = textureLod(uTex, uv, lod).rgb * 0.4;
  c += textureLod(uTex, uv + vec2( s.x, 0.3 * s.y), lod).rgb * 0.15;
  c += textureLod(uTex, uv + vec2(-s.x, -0.3 * s.y), lod).rgb * 0.15;
  c += textureLod(uTex, uv + vec2(-0.3 * s.x, s.y), lod).rgb * 0.15;
  c += textureLod(uTex, uv + vec2(0.3 * s.x, -s.y), lod).rgb * 0.15;
  return c;
}
void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 col = texture(uTex, p / uRes).rgb;

  // 投影：先把每块玻璃的影子压到内容上
  for (int g = 0; g < ${MAX_GROUPS}; g++){
    float sh = uMC[g].z * uMD[g].z;
    if (sh <= 0.0) continue;
    float ds = groupD(p - vec2(0.0, 12.0), g);
    float dIn = groupD(p, g);
    float a = sh * exp(-max(ds, 0.0) / 20.0) * smoothstep(-0.5, 1.5, dIn);
    col *= 1.0 - a;
  }

  for (int g = 0; g < ${MAX_GROUPS}; g++){
    float op = uMD[g].z;
    if (op <= 0.0) continue;
    float d = groupD(p, g);
    if (d > 1.0) continue;
    float cov = clamp(0.5 - d, 0.0, 1.0) * op;
    // 法线：距离场的梯度（指向外面）
    vec2 e = vec2(1.0, 0.0);
    vec2 n = normalize(vec2(groupD(p + e.xy, g) - groupD(p - e.xy, g), groupD(p + e.yx, g) - groupD(p - e.yx, g)) + 1e-6);
    float depth = max(-d, 0.0);
    float bevel = max(uMA[g].x, 0.001);
    float t = clamp(1.0 - depth / bevel, 0.0, 1.0);
    float slope = pow(t, 2.4) * step(0.5, uMA[g].x);
    vec2 off = -n * slope * uMA[g].x * uMA[g].y - (p - uME[g]) * uMA[g].z;
    float lod = uMA[g].w > 0.5 ? log2(uMA[g].w) : 0.0;
    float ch = uMC[g].x;
    vec3 gc;
    gc.r = samp(p + off * (1.0 + ch), lod).r;
    gc.g = samp(p + off, lod).g;
    gc.b = samp(p + off * (1.0 - ch), lod).b;
    // 底色
    gc = mix(gc, uMB[g].rgb, uMB[g].a);
    // Aqua：上半截一层果冻高光，底部一圈回光
    float gl = uMC[g].w;
    if (gl > 0.0){
      vec4 b = uBox[g];
      float cy = mix(b.y, b.w, 0.5);
      float inner = smoothstep(-3.0, -7.0, d);
      float top = clamp((cy - p.y) / max(cy - b.y, 1.0), 0.0, 1.0);
      float hiA = gl * inner * smoothstep(0.0, 0.15, top) * mix(0.25, 0.85, top);
      gc = mix(gc, vec3(1.0), hiA);
      float bot = clamp((p.y - cy) / max(b.w - cy, 1.0), 0.0, 1.0);
      gc += gl * 0.25 * pow(bot, 3.0) * inner;
      // Aero 的斜向反光也走这里：一道斜条
    }
    // 玻璃自己的光
    vec2 L = normalize(uLight);
    float facing = dot(n, L);
    float band = exp(-depth / 2.2);
    float wide = pow(clamp(1.0 - depth / (bevel * 0.9), 0.0, 1.0), 3.0) * step(0.5, uMA[g].x);
    float rim = uMC[g].y;
    float hi = pow(max(facing, 0.0), 1.6) * (0.95 * band + 0.35 * wide) * rim + pow(max(-facing, 0.0), 2.0) * band * 0.45 * rim;
    float lo = max(-facing, 0.0) * wide * 0.10;
    gc *= 1.0 - lo;
    gc = mix(gc, vec3(1.0), clamp(hi, 0.0, 1.0));
    float bd = uMD[g].x * exp(-depth / 0.9);
    gc = mix(gc, vec3(1.0), clamp(bd * 0.75, 0.0, 1.0));
    col = mix(col, gc, cov);
  }
  o = vec4(col, 1.0);
}`;

export class GlassRenderer {
  gl: WebGL2RenderingContext;
  prog: WebGLProgram;
  tex: WebGLTexture;
  loc: Record<string, WebGLUniformLocation | null> = {};

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false});
    if (!gl) throw new Error('WebGL2 不可用：渲染时加 --gl=swangle');
    this.gl = gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
    this.prog = p;
    gl.useProgram(p);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    for (const n of ['uTex', 'uRes', 'uN', 'uSA', 'uSB', 'uMA', 'uMB', 'uMC', 'uMD', 'uME', 'uBox', 'uLight']) {
      this.loc[n] = gl.getUniformLocation(p, n);
    }
  }

  render(content: HTMLCanvasElement, shapes: Shape[], groups: GroupMat[], light: [number, number]) {
    const gl = this.gl;
    const W = gl.drawingBufferWidth;
    const H = gl.drawingBufferHeight;
    gl.viewport(0, 0, W, H);
    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, content);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.uniform1i(this.loc.uTex, 0);
    gl.uniform2f(this.loc.uRes, W, H);
    const n = Math.min(MAX_SHAPES, shapes.length);
    gl.uniform1i(this.loc.uN, n);
    const SA = new Float32Array(MAX_SHAPES * 4);
    const SB = new Float32Array(MAX_SHAPES * 2);
    const box = Array.from({length: MAX_GROUPS}, () => [1e5, 1e5, -1e5, -1e5]);
    shapes.slice(0, n).forEach((s, i) => {
      SA.set([s.cx, s.cy, s.hw, s.hh], i * 4);
      SB.set([Math.min(s.r, s.hw, s.hh), s.group], i * 2);
      const b = box[s.group];
      b[0] = Math.min(b[0], s.cx - s.hw);
      b[1] = Math.min(b[1], s.cy - s.hh);
      b[2] = Math.max(b[2], s.cx + s.hw);
      b[3] = Math.max(b[3], s.cy + s.hh);
    });
    gl.uniform4fv(this.loc.uSA, SA);
    gl.uniform2fv(this.loc.uSB, SB);
    const MA = new Float32Array(MAX_GROUPS * 4);
    const MB = new Float32Array(MAX_GROUPS * 4);
    const MC = new Float32Array(MAX_GROUPS * 4);
    const MD = new Float32Array(MAX_GROUPS * 4);
    const ME = new Float32Array(MAX_GROUPS * 2);
    const BX = new Float32Array(MAX_GROUPS * 4);
    groups.slice(0, MAX_GROUPS).forEach((g, i) => {
      MA.set([g.bevel, g.edge, g.mag, g.frost], i * 4);
      MB.set(g.tint, i * 4);
      MC.set([g.chroma, g.rim, g.shadow, g.gloss], i * 4);
      MD.set([g.border, g.k, g.opacity, 0], i * 4);
      ME.set([g.cx, g.cy], i * 2);
      BX.set(box[i], i * 4);
    });
    gl.uniform4fv(this.loc.uMA, MA);
    gl.uniform4fv(this.loc.uMB, MB);
    gl.uniform4fv(this.loc.uMC, MC);
    gl.uniform4fv(this.loc.uMD, MD);
    gl.uniform2fv(this.loc.uME, ME);
    gl.uniform4fv(this.loc.uBox, BX);
    gl.uniform2f(this.loc.uLight, light[0], light[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
