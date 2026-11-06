// thermal.js — 热成像：在 CPU 上模拟一张“温度场”（写字 = 加热，之后扩散 + 冷却），GPU 上按色带上色
// 一张静帧里看得见时间：先写的字更凉、更糊，刚写的又亮又锐
(function (G) {
  const FS = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D T, Tb, pal, pal2, M; uniform vec2 res, grid; uniform float tmin, tmax, noise, seed, iso, isoW, glow, wipe, wipeSoft, vign;
uniform vec3 isoCol;
vec4 bsw(float t){ float t2=t*t, t3=t2*t; return vec4((1.0-t)*(1.0-t)*(1.0-t), 3.0*t3-6.0*t2+4.0, -3.0*t3+3.0*t2+3.0*t+1.0, t3)/6.0; }
float samp(sampler2D s, vec2 q){
  vec2 st = q*grid - 0.5; vec2 i = floor(st); vec2 f = st - i; vec4 wx = bsw(f.x), wy = bsw(f.y); float acc = 0.0;
  for(int y=0;y<4;y++){ float row=0.0; for(int x=0;x<4;x++){ ivec2 c = clamp(ivec2(i)+ivec2(x-1,y-1), ivec2(0), ivec2(grid)-1); row += texelFetch(s, c, 0).r*wx[x]; } acc += row*wy[y]; }
  return acc;
}
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))+seed)*43758.5453); }
vec3 P(sampler2D p, float t){ return texture(p, vec2(clamp(t,0.0,1.0), 0.5)).rgb; }
void main(){
  vec2 q = vec2(uv.x, 1.0-uv.y);
  float t = samp(T, q);
  float tb = samp(Tb, q);
  // 传感器噪声：逐像素 + 一点横向条纹（固定图案噪声）
  vec2 px = floor(gl_FragCoord.xy/2.0);
  float n = (h(px)-0.5)*noise + (h(vec2(0.0, px.y))-0.5)*noise*0.5;
  float x = (t + n - tmin)/(tmax - tmin);
  float side = smoothstep(wipe - wipeSoft, wipe + wipeSoft, uv.x);
  vec3 c = mix(P(pal, x), P(pal2, x), side);
  // 热的地方往外渗一点光
  float xb = (tb - tmin)/(tmax - tmin);
  c += mix(P(pal, xb), P(pal2, xb), side) * glow * smoothstep(0.55, 1.0, xb);
  // 等温线：一条细线标出某个温度
  float m = samp(M, q);
  if (iso > 0.0) { float d = abs(t - iso); float aa = fwidth(t)*1.2; c = mix(c, isoCol, (1.0 - smoothstep(isoW, isoW + aa, d))*0.95*(1.0 - smoothstep(0.02, 0.3, m))); }
  vec2 dv = uv - 0.5; c *= 1.0 - vign*dot(dv, dv)*2.0;
  o = vec4(c, 1.0);
}`;

  function hex(hx) { const v = parseInt(hx.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  const PALETTES = {
    ironbow: [[0, '#04020c'], [0.14, '#1d0a5c'], [0.28, '#55108a'], [0.42, '#9c1f86'], [0.55, '#d43f4f'], [0.67, '#f2712a'], [0.79, '#fbab2a'], [0.9, '#fde27a'], [1, '#ffffff']],
    rainbow: [[0, '#05030f'], [0.12, '#1b1f9e'], [0.26, '#1878e6'], [0.4, '#16d1d6'], [0.52, '#2be36a'], [0.64, '#e7ec2a'], [0.76, '#ff9a1a'], [0.88, '#ff2b2b'], [1, '#ffffff']],
    whitehot: [[0, '#000000'], [1, '#ffffff']],
    blackhot: [[0, '#ffffff'], [1, '#000000']],
    arctic: [[0, '#02040a'], [0.3, '#0c2f6e'], [0.55, '#2a8fd6'], [0.75, '#b7e6ff'], [0.88, '#ffd27a'], [1, '#fff6e0']],
  };
  function lut(name) {
    const stops = PALETTES[name], out = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) {
      const t = i / 255; let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
      const [t0, c0] = stops[k], [t1, c1] = stops[k + 1]; const f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0 || 1)));
      const a = hex(c0), b = hex(c1); const s = f * f * (3 - 2 * f) * 0.35 + f * 0.65;
      for (let j = 0; j < 3; j++) out[i * 4 + j] = Math.round(a[j] + (b[j] - a[j]) * s); out[i * 4 + 3] = 255;
    }
    return out;
  }
  function lutCss(name) { const s = PALETTES[name]; return 'linear-gradient(90deg,' + s.map(([t, c]) => c + ' ' + (t * 100) + '%').join(',') + ')'; }

  // —— 温度场 ——
  function Field(W, H, T0) {
    const T = new Float32Array(W * H).fill(T0), tmp = new Float32Array(W * H);
    return {
      W, H, T,
      step(D, k, Tamb, fixed) { // 扩散（5 点拉普拉斯）+ 牛顿冷却；fixed：保持不变的格子（手等热源）
        for (let y = 0; y < H; y++) { const yu = y > 0 ? y - 1 : 0, yd = y < H - 1 ? y + 1 : H - 1;
          for (let x = 0; x < W; x++) { const i = y * W + x, xl = x > 0 ? x - 1 : 0, xr = x < W - 1 ? x + 1 : W - 1;
            const lap = T[y * W + xl] + T[y * W + xr] + T[yu * W + x] + T[yd * W + x] - 4 * T[i];
            tmp[i] = T[i] + D * lap - k * (T[i] - Tamb[i]); } }
        if (fixed) for (let i = 0; i < W * H; i++) if (fixed[i] > -1e8) tmp[i] = fixed[i];
        T.set(tmp);
      },
    };
  }
  function blur(src, W, H, sigma) { const f = new Float32Array(src); return G.GLK.blurField(f, W, H, sigma); }

  // 字形遮罩（网格分辨率）
  function glyphMask(text, font, W, H, box) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';
    let size = 100; x.font = font.replace('{S}', size + 'px');
    const w0 = x.measureText(text).width; size = size * box.w / w0; x.font = font.replace('{S}', size + 'px');
    const glyphs = []; let cx = box.x;
    for (const ch of text) { const gw = x.measureText(ch).width; x.fillText(ch, cx, box.y); glyphs.push([cx, cx + gw]); cx += gw; }
    const d = x.getImageData(0, 0, W, H).data, m = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) m[i] = d[i * 4] / 255;
    return { m, glyphs, size };
  }

  // 手：几段胶囊 + 圆角手掌的距离场（网格坐标）；返回每格的“深入手内的距离”（外面为负）
  function handSDF(W, H, tip, dir, scale) {
    const n = (v) => { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; };
    const d = n(dir), p = [-d[1], d[0]]; // d：手指指向；p：垂直方向
    const at = (a, b) => [tip[0] - d[0] * a * scale + p[0] * b * scale, tip[1] - d[1] * a * scale + p[1] * b * scale];
    const caps = [ // [起点, 终点, 半径, 指尖温差]
      [at(6, 0), at(60, 1), 12, 1],        // 食指：指尖段
      [at(60, 1), at(110, 4), 14, 0.4],    // 食指：根部
      [at(104, 30), at(132, 24), 16, 0.55],// 中指（弯着，只露指节）
      [at(114, 54), at(140, 46), 15, 0.55],// 无名指
      [at(124, 74), at(146, 66), 13, 0.55],// 小指
      [at(150, -34), at(104, -26), 14, 0.7],// 拇指，贴着食指
      [at(190, 26), at(600, 60), 54, 0],   // 小臂
    ];
    const palmC = at(158, 22), palmHalf = [56 * scale, 50 * scale], palmR = 30 * scale;
    const out = new Float32Array(W * H), tipF = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let best = 1e9, tf = 0;
      for (const [a, b, r, f] of caps) {
        const bx = b[0] - a[0], by = b[1] - a[1], px = x - a[0], py = y - a[1];
        const hh = Math.max(0, Math.min(1, (px * bx + py * by) / (bx * bx + by * by)));
        const dd = Math.hypot(px - bx * hh, py - by * hh) - r * scale;
        if (dd < best) { best = dd; tf = f * (1 - hh); }
      }
      // 圆角手掌（沿手指方向转过去）
      const qx = (x - palmC[0]) * p[0] + (y - palmC[1]) * p[1], qy = (x - palmC[0]) * d[0] + (y - palmC[1]) * d[1];
      const ax = Math.abs(qx) - palmHalf[0] + palmR, ay = Math.abs(qy) - palmHalf[1] + palmR;
      const pd = Math.hypot(Math.max(ax, 0), Math.max(ay, 0)) + Math.min(Math.max(ax, ay), 0) - palmR;
      // 平滑并集
      const k = 14 * scale, hm = Math.max(k - Math.abs(best - pd), 0) / k; const u = Math.min(best, pd) - hm * hm * k * 0.25;
      if (pd < best) tf *= Math.max(0, 1 - hm);
      out[y * W + x] = -u; tipF[y * W + x] = tf;
    }
    return { depth: out, tip: tipF };
  }

  function makeProgram(gl) { return G.GLK.program(gl, FS); }
  function texF(gl, W, H, data) { return G.GLK.texture(gl, W, H, { internal: gl.R32F, format: gl.RED, type: gl.FLOAT, data, filter: gl.NEAREST }); }
  function texPal(gl, name) { return G.GLK.texture(gl, 256, 1, { internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE, data: lut(name), filter: gl.LINEAR }); }

  async function render(gl, P, field, o) {
    const W = field.W, H = field.H;
    const tT = texF(gl, W, H, field.T), tB = texF(gl, W, H, blur(field.T, W, H, o.glowSigma || 10));
    const tM = texF(gl, W, H, o.mask || new Float32Array(W * H));
    const p1 = texPal(gl, o.palette || 'ironbow'), p2 = texPal(gl, o.palette2 || o.palette || 'ironbow');
    gl.useProgram(P); const u = P.u;
    G.GLK.bindTex(gl, P, 'T', tT, 0); G.GLK.bindTex(gl, P, 'Tb', tB, 1); G.GLK.bindTex(gl, P, 'pal', p1, 2); G.GLK.bindTex(gl, P, 'pal2', p2, 3); G.GLK.bindTex(gl, P, 'M', tM, 4);
    gl.uniform2f(u.grid, W, H); gl.uniform2f(u.res, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform1f(u.tmin, o.tmin); gl.uniform1f(u.tmax, o.tmax); gl.uniform1f(u.noise, o.noise ?? 0.12); gl.uniform1f(u.seed, o.seed ?? 3);
    gl.uniform1f(u.iso, o.iso || 0); gl.uniform1f(u.isoW, o.isoW || 0.05); gl.uniform3fv(u.isoCol, o.isoCol || [0.3, 1, 0.6]);
    gl.uniform1f(u.glow, o.glow ?? 0.25); gl.uniform1f(u.wipe, o.wipe ?? 2); gl.uniform1f(u.wipeSoft, o.wipeSoft ?? 0.002); gl.uniform1f(u.vign, o.vignette ?? 0.25);
    gl.getExtension('OES_standard_derivatives');
    await G.GLK.drawTiled(gl, null, 4);
  }

  G.THERM = { Field, glyphMask, handSDF, blur, render, makeProgram, lut, lutCss, PALETTES };
})(window);
