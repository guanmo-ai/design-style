// paint.js — 治愈系手绘：用代码“画”一张夏日的背景
// CPU：用一堆圆堆出积云 / 树冠的“鼓包高度场”，算出山脊线
// GPU：按高度场的法线分三四个色阶上色（像水粉一层层叠），草坡上跑风的亮带，树影里的光斑
// Canvas 2D：前景的草叶、小花、被风吹的花瓣、戴草帽的女孩
(function (G) {
  const FS = `#version 300 es
  precision highp float;
  in vec2 uv; out vec4 o;
  uniform vec2 res;                 // CSS px 画幅
  uniform vec4 view;                // 子画布：在整幅里的偏移 xy、尺寸 zw（CSS px）
  uniform sampler2D cloudT, treeT, ridgeT, trunkT;
  uniform vec2 fieldRes;
  uniform vec3 sky0, sky1, sky2, haze;
  uniform vec3 cL, cM, cS, cD;      // 云：亮 / 中 / 暗 / 最暗
  uniform vec3 fL, fM, fS, fD;      // 树叶
  uniform vec3 gL, gM, gS, gD, gW;  // 草：亮 / 中 / 暗 / 最暗 / 风吹翻起的亮带
  uniform vec3 hFar, hMid, hMidS;   // 远山 / 中景树林
  uniform vec3 bark, barkS;
  uniform vec2 sun;                 // 光从哪来（屏幕方向）
  uniform float windPh, seed, grain, shadowOn;
  uniform vec4 treeShadow;          // 树影椭圆：中心 xy、半径 rx ry
  uniform vec4 cloudShadow;         // 云影：强度、尺度、偏移
  #define PI 3.14159265
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + seed) * 43758.5453); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * noise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
  vec2 fld(vec2 cpx){ return cpx / res; }
  vec2 hs(sampler2D t, vec2 cpx){ return texture(t, fld(cpx)).rg; }

  // 一团“鼓包”：按高度场的法线分色阶，阈值用笔触噪声抖一抖
  vec4 puff(sampler2D t, vec2 cpx, vec3 L, vec3 M, vec3 S, vec3 D, float soft, float leafy, float fq){
    vec4 c = texture(t, fld(cpx));
    float hgt = c.r;
    float br = fbm(cpx * .012 + 3.) - .5;                  // 大笔触
    float fine = (fbm(cpx * fq) - .5) * leafy;             // 叶子 / 小笔触
    if (c.b <= .02 || hgt + br * 6. + fine * 10. <= 0.) return vec4(0.);
    float e = 1.5;
    float hx = texture(t, fld(cpx + vec2(e, 0.))).b - texture(t, fld(cpx - vec2(e, 0.))).b;
    float hy = texture(t, fld(cpx + vec2(0., e))).b - texture(t, fld(cpx - vec2(0., e))).b;
    vec3 n = normalize(vec3(-hx, -hy, 2.2 * e));
    vec3 ld = normalize(vec3(sun.x, sun.y, .42));
    float d = dot(n, ld);
    float v = c.g;                                          // 在这一团里的相对高度（0 底 → 1 顶）
    d += br * .35 + fine * .8 - (1. - v) * .38 - .02;
    float w = soft;
    vec3 col = D;
    col = mix(col, S, smoothstep(-.18 - w * .5, -.18 + w * .5, d));
    col = mix(col, M, smoothstep(.18 - w, .18 + w, d));
    col = mix(col, L, smoothstep(.5 - w * 1.4, .5 + w * 1.4, d));
    // 迎光一侧的亮边
    float edge = smoothstep(5., .0, hgt);
    col = mix(col, L * 1.03, edge * smoothstep(.1, .5, d) * .6);
    float a = smoothstep(.0, 1.6 + 5. * (1. - v) * soft * 4., hgt + br * 6. + fine * 10.);
    return vec4(col, a);
  }

  void main(){
    vec2 cpx = view.xy + vec2(uv.x, 1. - uv.y) * view.zw;
    vec2 f = cpx / res;
    vec3 ridge = texture(ridgeT, vec2(f.x, .5)).rgb;     // 三条山脊线的 y（CSS px）
    // —— 天空 ——
    float sy = cpx.y / res.y;
    vec3 col = mix(sky0, sky1, smoothstep(.0, .55, sy));
    col = mix(col, sky2, smoothstep(.45, .72, sy));
    col = mix(col, haze, smoothstep(.62, .75, sy) * .6);
    col *= 1. + (fbm(vec2(cpx.x * .004, cpx.y * .03)) - .5) * .06;   // 横着刷的天空笔触
    // —— 云 ——
    vec4 cl = puff(cloudT, cpx, cL, cM, cS, cD, .06, .25, .05);
    col = mix(col, cl.rgb, cl.a);
    // —— 远山（空气透视：越远越蓝、越浅）——
    if (cpx.y > ridge.r) {
      float k = smoothstep(ridge.r, ridge.r + 120., cpx.y);
      vec3 m = mix(hFar * 1.06, hFar, k);
      m *= 1. + (fbm(cpx * .02) - .5) * .08;
      col = mix(col, m, smoothstep(0., 1.2, cpx.y - ridge.r));
    }
    // —— 中景树林：一排小鼓包 ——
    if (cpx.y > ridge.g - 1.) {
      float t = fbm(cpx * vec2(.03, .05) + 5.);
      float lit = smoothstep(.45, .6, t + (ridge.g + 30. - cpx.y) * .006 - sun.x * .1);
      vec3 m = mix(hMidS, hMid, lit);
      col = mix(col, m, smoothstep(0., 1.2, cpx.y - ridge.g));
    }
    // —— 草坡 ——
    if (cpx.y > ridge.b - 1.) {
      float depth = clamp((cpx.y - ridge.b) / (res.y - ridge.b + 1.), 0., 1.);
      // 草叶方向的拉长噪声
      vec2 sp = vec2(cpx.x * .06 + cpx.y * .02, cpx.y * .6);
      float streak = noise(sp * vec2(1., .22)) * .6 + noise(sp * vec2(2.3, .5)) * .4;
      // 风：一道道亮带从左往右扫过（越远越细）
      vec2 wd = normalize(vec2(1., .22));
      float k = .009 / (.3 + depth * 1.2);
      float ph = dot(cpx, wd) * k - windPh + fbm(cpx * vec2(.003, .009)) * 5.;
      float band = smoothstep(.2, 1., sin(ph)) * smoothstep(.3, .75, fbm(cpx * vec2(.006, .02) + 9.)) * (.6 + .7 * streak) * smoothstep(.0, .2, depth + .05);
      float tone = .55 + (streak - .5) * .55 + (1. - depth) * .25 - depth * .25;
      vec3 g = mix(gD, gS, smoothstep(.15, .35, tone));
      g = mix(g, gM, smoothstep(.38, .55, tone));
      g = mix(g, gL, smoothstep(.62, .8, tone));
      g = mix(g, gW, clamp(band, 0., 1.) * .8);
      // 云影：一块块冷一点的暗
      float cs = fbm(cpx * vec2(cloudShadow.y, cloudShadow.y * 3.2) + cloudShadow.zw);
      float csm = smoothstep(.56, .6, cs) * cloudShadow.x;
      g = mix(g, g * vec3(.62, .72, .86), csm);
      // 树影 + 光斑（太阳的小孔成像：地上是椭圆）
      if (shadowOn > .5) {
        vec2 q = (cpx - treeShadow.xy) / treeShadow.zw;
        float sd = length(q) + (fbm(cpx * .03) - .5) * .5;
        float inSh = smoothstep(1.02, .94, sd);
        vec2 cell = floor(cpx / vec2(30., 14.));
        float spot = 0.;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 cc = cell + vec2(i, j);
          float hh = hash(cc);
          if (hh > .55) continue;
          vec2 ctr = (cc + vec2(hash(cc + 3.1), hash(cc + 7.7))) * vec2(30., 14.);
          float r = 3. + 9. * hash(cc + 1.3);
          vec2 dd = (cpx - ctr) / vec2(r * 1.9, r * .62);
          spot = max(spot, smoothstep(1.05, .85, length(dd)));
        }
        vec3 shc = g * vec3(.3, .42, .5) + vec3(.0, .015, .035);
        vec3 sg = mix(shc, mix(g, gL, .4) * 1.08, spot * smoothstep(.95, .4, sd));
        g = mix(g, sg, inSh);
      }
      // 坡顶的亮边（逆光的草尖）
      g = mix(g, gW * 1.05, smoothstep(5., 0., cpx.y - ridge.b) * .7);
      col = mix(col, g, smoothstep(0., 1.4, cpx.y - ridge.b));
    }
    // —— 树干 ——
    vec2 tr = texture(trunkT, f).rg;
    if (tr.r > 0.) {
      float lit = smoothstep(.45, .55, tr.g + (noise(cpx * vec2(.08, .015)) - .5) * .3);
      vec3 b = mix(barkS, bark, lit);
      b *= .9 + .2 * noise(cpx * vec2(.2, .03));
      col = mix(col, b, tr.r);
    }
    // —— 树冠 ——
    vec4 tc = puff(treeT, cpx, fL, fM, fS, fD, .02, 1.25, .075);
    col = mix(col, tc.rgb, tc.a);
    // 纸的纹理 + 颗粒
    float paper = noise(cpx * .9) * .5 + noise(cpx * .23) * .5;
    col *= 1. + (paper - .5) * .045;
    col = pow(clamp(col, 0., 1.), vec3(1. / 2.2));
    col += (hash(cpx * 1.7 + 11.) - .5) * grain;
    o = vec4(col, 1.);
  }`;

  // —— 小工具 ——
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const L = h => hex(h).map(v => Math.pow(v, 2.2));

  // 高度场：每个圆是一颗球冠，取最大值；第二通道存“在这一团里的相对高度”
  function Field(W, H) { return { W, H, h: new Float32Array(W * H), v: new Float32Array(W * H) }; }
  function splat(F, circles, baseY, topY, flat = true) {
    const { W, H, h, v } = F;
    for (const [cx, cy, r] of circles) {
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W - 1, Math.ceil(cx + r));
      const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(H - 1, Math.ceil(cy + r));
      for (let y = y0; y <= y1; y++) {
        const dy = y - cy;
        let cut = 1;
        if (flat) { cut = Math.min(1, Math.max(0, (baseY - y) / 7)); if (cut <= 0) continue; }
        for (let x = x0; x <= x1; x++) {
          const dx = x - cx, d2 = r * r - dx * dx - dy * dy;
          if (d2 <= 0) continue;
          const cap = Math.sqrt(d2) * cut;
          const i = y * W + x;
          if (cap > h[i]) { h[i] = cap; v[i] = Math.min(1, Math.max(0, (baseY - y) / (baseY - topY))); }
        }
      }
    }
  }
  // 积云：底是平的，往上一柱柱“鼓”起来，每个大包再长几个小包（菜花状）
  function cumulus(R, { x, base, w, h, bud = 2, lean = 0 }) {
    const C = [];
    // 平的底：一排扁一点的圆
    const nb = Math.max(4, Math.round(w / 70));
    for (let i = 0; i < nb; i++) { const t = (i + .5) / nb; const r = w / nb * (.75 + .3 * R()); C.push([x - w / 2 + t * w + (R() - .5) * 18, base - r * .5, r]); }
    // 往上翻滚的大包：越往上越窄、越往上越小
    const N = Math.round(10 + w / 60);
    for (let i = 0; i < N; i++) {
      const t = Math.pow(R(), 1.25);
      const hw = w / 2 * Math.pow(1 - Math.pow(t, 1.4), .6) * (.55 + .4 * R());
      const r = Math.max(22, (w * .17) * (1 - .55 * t) * (.75 + .5 * R()));
      C.push([x + (R() * 2 - 1) * hw * .8 + lean * t * h, base - r * .6 - t * (h - r * 1.2), r]);
    }
    // 菜花：每个大包的上沿再长小包
    let out = C.slice(), last = C;
    for (let pass = 0; pass < bud; pass++) {
      const add = [];
      for (const [cx, cy, r] of last) {
        if (r < 20) continue;
        const n = 3 + Math.floor(R() * 3);
        for (let j = 0; j < n; j++) {
          const a = -Math.PI * (.08 + .84 * R());
          const rr = r * (.34 + .16 * R());
          add.push([cx + Math.cos(a) * (r - rr * .6), cy + Math.sin(a) * (r - rr * .6), rr]);
        }
      }
      out = out.concat(add); last = add;
    }
    return out;
  }
  // 树冠：几大团叶子，每团再长小团
  function canopy(R, { x, y, w, h, clumps = 9 }) {
    const C = [];
    for (let i = 0; i < clumps; i++) {
      const a = (i / clumps) * Math.PI - Math.PI;   // 上半圈
      const rx = w / 2 * (.55 + .35 * R()), ry = h / 2 * (.5 + .4 * R());
      const cx = x + Math.cos(a) * rx * .8, cy = y + Math.sin(a) * ry * .75 + h * .08;
      const r = Math.min(w, h) * (.18 + .08 * R());
      C.push([cx, cy, r]);
    }
    C.push([x, y + h * .02, Math.min(w, h) * .32]);
    C.push([x - w * .22, y + h * .2, Math.min(w, h) * .24]);
    C.push([x + w * .25, y + h * .18, Math.min(w, h) * .22]);
    let out = C.slice();
    for (let pass = 0; pass < 2; pass++) {
      const add = [];
      for (const [cx, cy, r] of out) {
        if (r < 14) continue;
        const n = 4 + Math.floor(R() * 4);
        for (let j = 0; j < n; j++) {
          const a = -Math.PI * (-.15 + 1.3 * R());
          const rr = r * (.3 + .18 * R());
          add.push([cx + Math.cos(a) * (r - rr * .45), cy + Math.sin(a) * (r - rr * .45), rr]);
        }
      }
      out = out.concat(add);
    }
    return out;
  }
  // 山脊线：几层正弦 + 噪声
  function ridgeLine(W, R, base, amp, freq, oct = 4) {
    const a = new Float32Array(W);
    const ph = Array.from({ length: oct }, () => R() * 100);
    for (let x = 0; x < W; x++) {
      let s = 0, A = 1, F = freq;
      for (let o = 0; o < oct; o++) { s += A * Math.sin(x * F + ph[o]); A *= .5; F *= 2.1; }
      a[x] = base(x) + s * amp;
    }
    return a;
  }

  function tex2(gl, W, H, a, b) {
    const d = new Float32Array(W * H * 2);
    for (let i = 0; i < W * H; i++) { d[i * 2] = a[i]; d[i * 2 + 1] = b ? b[i] : 0; }
    return GLK.texture(gl, W, H, { internal: gl.RG32F, format: gl.RG, type: gl.FLOAT, data: d });
  }
  function tex4(gl, F, sigma) {
    const { W, H, h, v } = F;
    const bl = GLK.blurField(Float32Array.from(h), W, H, sigma);
    const d = new Float32Array(W * H * 4);
    for (let i = 0; i < W * H; i++) { d[i * 4] = h[i]; d[i * 4 + 1] = v[i]; d[i * 4 + 2] = bl[i]; d[i * 4 + 3] = 1; }
    return GLK.texture(gl, W, H, { internal: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT, data: d });
  }

  const PAL = {
    sky0: '#2a6fd6', sky1: '#5aa7ea', sky2: '#a9d8f2', haze: '#e9f3ec',
    cL: '#fffaf0', cM: '#e9eef6', cS: '#b4bfdc', cD: '#8e9cc6',
    fL: '#c4dc68', fM: '#7fb04a', fS: '#3f7a4a', fD: '#24503f',
    gL: '#b9d968', gM: '#86bb4c', gS: '#4f8f45', gD: '#2f6440', gW: '#e2efa2',
    hFar: '#8fb3cf', hMid: '#5e9a6a', hMidS: '#3d6f62',
    bark: '#8a6a4a', barkS: '#4a3c3a',
  };

  // 画：S = { W, H, clouds:[...], tree:{...}, ridges:{...}, trunk(ctx), sun, wind, treeShadow, cloudShadow, pal }
  async function render(gl, S) {
    const W = S.W, H = S.H;
    const R = rng(S.seed || 7);
    // 云
    const CF = Field(W, H);
    for (const c of S.clouds || []) splat(CF, cumulus(R, c), c.base, c.base - c.h);
    // 树
    const TF = Field(W, H);
    if (S.tree) { const t = S.tree; const circ = canopy(R, t); splat(TF, circ, t.y + t.h * .55, t.y - t.h * .55, false); }
    // 山脊
    const rid = new Float32Array(W * 4);
    const rr = S.ridges;
    for (let x = 0; x < W; x++) { rid[x * 4] = rr.far[x]; rid[x * 4 + 1] = rr.mid[x]; rid[x * 4 + 2] = rr.main[x]; rid[x * 4 + 3] = 1; }
    // 树干遮罩（Canvas 画好再读回来）
    const tc = document.createElement('canvas'); tc.width = W; tc.height = H;
    const tx = tc.getContext('2d');
    if (S.trunk) S.trunk(tx);
    const td = tx.getImageData(0, 0, W, H).data;
    const ta = new Float32Array(W * H), tb = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) { ta[i] = td[i * 4 + 3] / 255; tb[i] = td[i * 4] / 255; }

    const P = GLK.program(gl, FS);
    gl.useProgram(P);
    const T0 = tex4(gl, CF, S.cloudBlur || 6), T1 = tex4(gl, TF, S.treeBlur || 3);
    const T2 = GLK.texture(gl, W, 1, { internal: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT, data: rid }), T3 = tex2(gl, W, H, ta, tb);
    GLK.bindTex(gl, P, 'cloudT', T0, 0); GLK.bindTex(gl, P, 'treeT', T1, 1); GLK.bindTex(gl, P, 'ridgeT', T2, 2); GLK.bindTex(gl, P, 'trunkT', T3, 3);
    const pal = Object.assign({}, PAL, S.pal || {});
    for (const k of Object.keys(PAL)) if (P.u[k]) gl.uniform3fv(P.u[k], L(pal[k]));
    gl.uniform2f(P.u.res, W, H); gl.uniform4fv(P.u.view, S.view || [0, 0, W, H]);
    gl.uniform2fv(P.u.sun, S.sun || [-0.55, -0.7]);
    gl.uniform1f(P.u.windPh, S.wind || 0); gl.uniform1f(P.u.seed, (S.seed || 7) * 0.37); gl.uniform1f(P.u.grain, S.grain ?? 0.018);
    gl.uniform1f(P.u.shadowOn, S.treeShadow ? 1 : 0); gl.uniform4fv(P.u.treeShadow, S.treeShadow || [0, 0, 1, 1]);
    gl.uniform4fv(P.u.cloudShadow, S.cloudShadow || [0, 0.002, 0, 0]);
    await GLK.drawTiled(gl, null, S.tiles || 4);
    return { CF, TF };
  }

  // —— 前景（Canvas 2D）——
  // 一片草叶：弯向风的方向，越往尖越细
  function blade(x, ctx, bx, by, h, w, bend, col) {
    const tx = bx + bend * h, ty = by - h * (1 - Math.abs(bend) * .25);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(bx - w, by);
    ctx.quadraticCurveTo(bx - w * .6 + bend * h * .35, by - h * .55, tx, ty);
    ctx.quadraticCurveTo(bx + w * .6 + bend * h * .45, by - h * .5, bx + w, by);
    ctx.closePath(); ctx.fill();
  }
  function grass(ctx, R, { x0, x1, y0, y1, n, hmin, hmax, wind = 0.35, cols, band }) {
    const items = [];
    for (let i = 0; i < n; i++) { const y = y0 + (y1 - y0) * Math.pow(R(), .8); items.push([x0 + (x1 - x0) * R(), y]); }
    items.sort((a, b) => a[1] - b[1]);
    for (const [x, y] of items) {
      const t = (y - y0) / (y1 - y0 + 1e-3);
      const h = hmin + (hmax - hmin) * (t * .7 + R() * .3);
      const b = band ? band(x, y) : 0;
      const bend = wind * (.5 + R() * .6) + b * .35 + (R() - .5) * .25;
      const c = cols[Math.floor(R() * cols.length)];
      blade(null, ctx, x, y, h, 1.2 + 2.6 * t * (.6 + R() * .6), bend, b > .6 && R() < .5 ? cols[0] : c);
    }
  }
  function daisy(ctx, x, y, r, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, .55);
    ctx.fillStyle = '#fffdf4';
    for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.ellipse(Math.cos(k / 8 * 6.283) * r * .6, Math.sin(k / 8 * 6.283) * r * .6, r * .5, r * .22, k / 8 * 6.283, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.arc(0, 0, r * .3, 0, 7); ctx.fill();
    ctx.restore();
  }
  // 被风吹的花瓣：沿着一条弧飞，带一点拖影
  function petals(ctx, R, pts) {
    for (const [x, y, s, a] of pts) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      const g = ctx.createLinearGradient(-s * 4, 0, s, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.55)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-s * 1.6, 0, s * 2.6, s * .35, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff8f2'; ctx.beginPath(); ctx.ellipse(0, 0, s, s * .55, 0, 0, 7); ctx.fill();
      ctx.restore();
    }
  }

  // 戴草帽的女孩（背影），脚底在 (x, y)，高度 s；风往右吹
  function girl(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 150, s / 150);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const line = '#5a4a52';
    const P = (pts, fill, stroke = line, lw = 1.3) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 6) ctx.bezierCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], pts[i + 4], pts[i + 5]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } };
    // 影子
    ctx.fillStyle = 'rgba(40,80,50,.28)'; ctx.beginPath(); ctx.ellipse(14, 0, 30, 5, 0, 0, 7); ctx.fill();
    // 腿
    P([-7, -44, -8, -30, -9, -12, -9, -2, -6, 0, -3, 0, -3, -2, -3, -12, -3, -30, -2, -44], '#f6d2bc');
    P([4, -44, 5, -30, 6, -12, 6, -2, 9, 0, 12, 0, 12, -2, 11, -12, 10, -30, 10, -44], '#e8bca6');
    ctx.fillStyle = '#7a4e3a'; ctx.beginPath(); ctx.ellipse(-6, -1, 5, 2.6, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(9, -1, 5, 2.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-9.5, -7, 7, 3.5); ctx.fillRect(5.5, -7, 7, 3.5);
    // 裙子（被风吹向右）
    P([-14, -104, -20, -86, -30, -60, -26, -46, -16, -40, -2, -48, 8, -42, 18, -36, 30, -42, 40, -44, 34, -66, 22, -88, 16, -104], '#fbfaf4');
    P([6, -100, 14, -86, 26, -66, 34, -46, 38, -43, 30, -41, 22, -40, 14, -46, 10, -70, 6, -100], '#c9d3e6', null);
    ctx.strokeStyle = line; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-26, -46); ctx.bezierCurveTo(-16, -40, -2, -48, 8, -42); ctx.bezierCurveTo(18, -36, 30, -42, 40, -44); ctx.stroke();
    // 右臂（自然垂下）
    P([14, -100, 20, -86, 22, -72, 21, -64, 24, -62, 27, -64, 26, -74, 22, -90, 19, -102], '#f2c9b2');
    // 头发（往右飘）
    P([-15, -128, -18, -116, -16, -104, -10, -98, 0, -96, 10, -98, 26, -100, 40, -104, 48, -98, 36, -110, 22, -122, 14, -132], '#4b3532');
    P([20, -118, 30, -110, 44, -106, 54, -100, 46, -112, 34, -118, 26, -122], '#5d4440', null);
    // 左臂（举起来按住帽子）
    P([-13, -100, -22, -110, -26, -124, -22, -140, -16, -142, -14, -136, -17, -124, -12, -112, -9, -104], '#f6d2bc');
    // 草帽：帽檐（从后上方看是扁椭圆）+ 帽顶 + 红色飘带
    ctx.save(); ctx.translate(0, -136); ctx.rotate(-.12);
    ctx.fillStyle = '#ead08a'; ctx.beginPath(); ctx.ellipse(0, 0, 34, 10, 0, 0, 7); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.fillStyle = '#d7b46a'; ctx.beginPath(); ctx.ellipse(6, 2, 26, 6.5, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#f1dc9c'; ctx.beginPath(); ctx.ellipse(0, -5, 16, 12, 0, Math.PI, 0); ctx.lineTo(16, -2); ctx.lineTo(-16, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d94a3a'; ctx.fillRect(-16, -6, 32, 4.5);
    ctx.restore();
    // 飘带
    P([14, -142, 26, -146, 40, -138, 56, -144, 52, -140, 40, -132, 26, -138, 18, -138], '#d94a3a', null);
    P([14, -140, 24, -136, 36, -126, 50, -128, 46, -124, 34, -120, 24, -130, 16, -136], '#b8392f', null);
    // 按帽子的手
    ctx.fillStyle = '#f6d2bc'; ctx.beginPath(); ctx.ellipse(-19, -142, 5, 4, -.4, 0, 7); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }

  G.PAINT = { render, ridgeLine, rng, grass, daisy, petals, girl, cumulus, PAL, hex };
})(window);
