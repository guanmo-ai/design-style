// 光绘渲染器：画面 = 快门窗口 [t − T, t] 里所有光加起来。
// 每段轨迹（两个相邻样本）画成一条带宽度的胶囊（不是一串点：快的地方不会断成珠子），片元里按到线段的距离取高斯。
// 能量 E = 功率 × 这段在窗口里的时长，摊到这段的面积上 —— 走得慢，面积小，就亮（亮度 ∝ 1 / 速度）。
// 两层光：芯（窄、暖白）+ 外圈（宽 2.4 倍、青 / 橙）。加法混合累加到 RGBA16F，之后做色调映射和三层泛光（glkit）。
// 地面是水：把所有光按 y → −y 镜像再画一遍到半尺寸的缓冲，合成时竖向模糊 + 水波扰动。
const LIGHT = (() => {
  const TW = 2048, HEADS = 512;
  const VS = `#version 300 es
  precision highp float; precision highp sampler2D;
  uniform sampler2D TA, TB, TC;
  uniform int base; uniform mat4 VP; uniform vec2 res; uniform float tNow, tLo, fpx, mirror, gain, minSig;
  out vec2 vA, vB, vP; out float vS, vSh, vAc, vAh; out vec3 vCc, vCh;
  ivec2 ix(int i){ return ivec2(i & ${TW - 1}, i >> ${Math.log2(TW)}); }
  void cull(){ gl_Position = vec4(2.,2.,2.,1.); }
  void main(){
    int seg = base + gl_VertexID / 6, corner = gl_VertexID - (gl_VertexID / 6) * 6;
    vec4 a = texelFetch(TA, ix(seg), 0), b = texelFetch(TA, ix(seg + 1), 0);
    vec4 ma = texelFetch(TB, ix(seg), 0), mb = texelFetch(TB, ix(seg + 1), 0);
    if (ma.z != mb.z) { cull(); return; }
    float lo = max(a.w, tLo), hi = min(b.w, tNow);
    if (hi <= lo) { cull(); return; }
    float span = max(b.w - a.w, 1e-6);
    vec3 pa = mix(a.xyz, b.xyz, (lo - a.w) / span), pb = mix(a.xyz, b.xyz, (hi - a.w) / span);
    float km = (0.5 * (lo + hi) - a.w) / span;
    float E = mix(ma.x, mb.x, km) * (hi - lo) * gain;
    if (E <= 0.) { cull(); return; }
    if (mirror > 0.5) { pa.y = -pa.y; pb.y = -pb.y; }
    vec4 ca = VP * vec4(pa, 1.), cb = VP * vec4(pb, 1.);
    if (ca.w < 0.15 || cb.w < 0.15) { cull(); return; }
    vec2 sa = (ca.xy / ca.w * 0.5 + 0.5) * res, sb = (cb.xy / cb.w * 0.5 + 0.5) * res;
    float s = fpx / (0.5 * (ca.w + cb.w));          // 每米多少像素
    float sigT = mix(ma.y, mb.y, km) * s;
    float sig = max(sigT, minSig), sigH = sig * 2.4;
    vec2 d = sb - sa; float L = length(d); vec2 u = L > 1e-4 ? d / L : vec2(1., 0.); vec2 n = vec2(-u.y, u.x);
    float R = 3.0 * sigH;
    int cx[6] = int[](0, 1, 1, 0, 1, 0), cy[6] = int[](0, 0, 1, 0, 1, 1);
    vec2 p = (cx[corner] == 0 ? sa - u * R : sb + u * R) + n * (cy[corner] == 0 ? -R : R);
    gl_Position = vec4(p / res * 2. - 1., 0., 1.);
    vA = sa; vB = sb; vP = p; vS = sig; vSh = sigH;
    float ss = s * s, r2pi = 2.5066283, tpi = 6.2831853;
    vec3 col = texelFetch(TC, ix(seg), 0).rgb;
    float halo = ma.w;
    vec3 hc = halo < 0.5 ? vec3(0.08, 0.52, 1.0) : halo < 1.5 ? vec3(1.0, 0.36, 0.06) : pow(col, vec3(2.2));
    vCc = col; vCh = hc;
    vAc = 0.5 * E * ss / (L * r2pi * sig + tpi * sig * sig);
    vAh = 0.62 * E * ss / (L * r2pi * sigH + tpi * sigH * sigH);
  }`;
  const FS = `#version 300 es
  precision highp float;
  in vec2 vA, vB, vP; in float vS, vSh, vAc, vAh; in vec3 vCc, vCh; out vec4 o;
  void main(){
    vec2 pa = vP - vA, ba = vB - vA;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0., 1.);
    vec2 q = pa - ba * h; float d2 = dot(q, q);
    vec3 c = vAc * exp(-d2 / (2. * vS * vS)) * vCc + vAh * exp(-d2 / (2. * vSh * vSh)) * vCh;
    o = vec4(c, 1.);
  }`;
  // 合成：夜空、地平线上的城市微光、很淡的雾、湿地面（倒影 + 水波）+ 光
  const FS_COMP = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D LT, RT; uniform mat4 IVP; uniform vec3 cam; uniform float time, reflK; uniform vec2 res;
  float h1(float x){ return fract(sin(x * 127.1) * 43758.5453); }
  float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ float s = 0., a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }
  vec3 sky(vec3 d){
    float e = d.y, az = atan(d.x, -d.z);
    vec3 c = mix(vec3(0.030, 0.036, 0.062), vec3(0.007, 0.010, 0.024), smoothstep(0.0, 0.5, e));
    c += vec3(0.11, 0.075, 0.06) * exp(-abs(e) * 32.) + vec3(0.02, 0.05, 0.07) * exp(-abs(e) * 9.);
    // 远处城市的灯：地平线上一排小光点（很暗，散焦）
    float cell = floor(az * 160.), fx = fract(az * 160.);
    float rh = h1(cell), on = step(0.45, rh);
    float ey = 0.004 + 0.022 * h1(cell + 7.3) * h1(cell + 3.1);
    float g = exp(-pow((fx - 0.5) * 3.2, 2.) - pow((e - ey) * 380., 2.));
    c += on * g * mix(vec3(1.0, 0.62, 0.32), vec3(0.45, 0.85, 1.0), step(0.7, h1(cell + 1.7))) * 0.9 * (0.4 + h1(cell + 9.1));
    return c;
  }
  void main(){
    vec4 w = IVP * vec4(uv * 2. - 1., 1., 1.); vec3 d = normalize(w.xyz / w.w - cam);
    vec3 c = sky(d);
    vec3 lt = texture(LT, uv).rgb;
    if (d.y < -0.0005) {
      float dist = cam.y / -d.y; vec2 g = cam.xz + d.xz * dist;
      float wet = smoothstep(0.30, 0.62, fbm(g * 0.55 + 3.0));
      float fres = mix(0.10, 0.92, pow(clamp(1. + d.y * 1.6, 0., 1.), 5.));
      float k = mix(0.35, 1.0, wet) * fres * reflK;
      // 水波：两组慢波，偏移随距离变小
      vec2 rp = g * vec2(1.0, 2.6);
      float wv = sin(rp.y * 6.0 + time * 1.4 + 2.0 * vn(rp * 0.7)) + 0.6 * sin(rp.x * 4.0 - rp.y * 3.0 - time * 1.1);
      vec2 off = vec2(0.0008 * wv, 0.0022 * wv) / (0.6 + 0.12 * dist) * mix(1.6, 0.5, wet);
      float spread = mix(0.010, 0.0035, wet) * (1.0 + 0.15 * dist);
      vec3 r = vec3(0.); float ws = 0.;
      for (int i = -6; i <= 6; i++) { float wi = exp(-float(i * i) / 14.); r += texture(RT, uv + off + vec2(0., float(i) * spread / 6.)).rgb * wi; ws += wi; }
      r /= ws;
      vec3 ground = vec3(0.010, 0.011, 0.015) * (0.6 + 0.8 * fbm(g * 3.0)) * (1.0 - 0.6 * wet);
      vec3 rs = sky(reflect(d, vec3(0, 1, 0)));
      c = ground + (rs * 0.8 + r) * k;
      c = mix(c, vec3(0.030, 0.034, 0.055), 1. - exp(-dist * 0.018));
    }
    o = vec4(c + lt, 1.);
  }`;

  function create(canvas, data) {
    const gl = GLK.create(canvas);
    const P = GLK.program(gl, FS, VS), C = GLK.program(gl, FS_COMP);
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    const LT = GLK.fbo(gl, W, H), RT = GLK.fbo(gl, W >> 1, H >> 1), SC = GLK.fbo(gl, W, H);
    const post = GLK.post(gl);
    // 样本 → 三张浮点纹理；最后留 HEADS 个位置给每帧更新的“灯头”
    const N = data.length / 12, NT = N + HEADS, TH = Math.ceil(NT / TW);
    const A = new Float32Array(TW * TH * 4), B = new Float32Array(TW * TH * 4), Cc = new Float32Array(TW * TH * 4);
    for (let i = 0; i < N; i++) for (let j = 0; j < 4; j++) { A[i * 4 + j] = data[i * 12 + j]; B[i * 4 + j] = data[i * 12 + 4 + j]; Cc[i * 4 + j] = data[i * 12 + 8 + j]; }
    for (let i = N; i < TW * TH; i++) B[i * 4 + 2] = -1e6 - i;
    const mk = arr => GLK.texture(gl, TW, TH, { internal: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT, data: arr, filter: gl.NEAREST });
    const tA = mk(A), tB = mk(B), tC = mk(Cc);
    const vao = gl.createVertexArray();

    function mats(cam) {
      const f = 1 / Math.tan(cam.fov * Math.PI / 360), asp = W / H, n = 0.05, fa = 200;
      const Pm = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0];
      const z = norm(sub(cam.p, cam.tg)), x = norm(cross([0, 1, 0], z)), y = cross(z, x), e = cam.p;
      const V = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1];
      const VP = mul4(Pm, V);
      return { VP, IVP: inv4(VP), fpx: f * H / 2 };
    }
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const norm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
    function mul4(a, b) { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; }
    function inv4(m) {
      const a = m, o = new Array(16);
      o[0] = a[5] * a[10] * a[15] - a[5] * a[11] * a[14] - a[9] * a[6] * a[15] + a[9] * a[7] * a[14] + a[13] * a[6] * a[11] - a[13] * a[7] * a[10];
      o[4] = -a[4] * a[10] * a[15] + a[4] * a[11] * a[14] + a[8] * a[6] * a[15] - a[8] * a[7] * a[14] - a[12] * a[6] * a[11] + a[12] * a[7] * a[10];
      o[8] = a[4] * a[9] * a[15] - a[4] * a[11] * a[13] - a[8] * a[5] * a[15] + a[8] * a[7] * a[13] + a[12] * a[5] * a[11] - a[12] * a[7] * a[9];
      o[12] = -a[4] * a[9] * a[14] + a[4] * a[10] * a[13] + a[8] * a[5] * a[14] - a[8] * a[6] * a[13] - a[12] * a[5] * a[10] + a[12] * a[6] * a[9];
      o[1] = -a[1] * a[10] * a[15] + a[1] * a[11] * a[14] + a[9] * a[2] * a[15] - a[9] * a[3] * a[14] - a[13] * a[2] * a[11] + a[13] * a[3] * a[10];
      o[5] = a[0] * a[10] * a[15] - a[0] * a[11] * a[14] - a[8] * a[2] * a[15] + a[8] * a[3] * a[14] + a[12] * a[2] * a[11] - a[12] * a[3] * a[10];
      o[9] = -a[0] * a[9] * a[15] + a[0] * a[11] * a[13] + a[8] * a[1] * a[15] - a[8] * a[3] * a[13] - a[12] * a[1] * a[11] + a[12] * a[3] * a[9];
      o[13] = a[0] * a[9] * a[14] - a[0] * a[10] * a[13] - a[8] * a[1] * a[14] + a[8] * a[2] * a[13] + a[12] * a[1] * a[10] - a[12] * a[2] * a[9];
      o[2] = a[1] * a[6] * a[15] - a[1] * a[7] * a[14] - a[5] * a[2] * a[15] + a[5] * a[3] * a[14] + a[13] * a[2] * a[7] - a[13] * a[3] * a[6];
      o[6] = -a[0] * a[6] * a[15] + a[0] * a[7] * a[14] + a[4] * a[2] * a[15] - a[4] * a[3] * a[14] - a[12] * a[2] * a[7] + a[12] * a[3] * a[6];
      o[10] = a[0] * a[5] * a[15] - a[0] * a[7] * a[13] - a[4] * a[1] * a[15] + a[4] * a[3] * a[13] + a[12] * a[1] * a[7] - a[12] * a[3] * a[5];
      o[14] = -a[0] * a[5] * a[14] + a[0] * a[6] * a[13] + a[4] * a[1] * a[14] - a[4] * a[2] * a[13] - a[12] * a[1] * a[6] + a[12] * a[2] * a[5];
      o[3] = -a[1] * a[6] * a[11] + a[1] * a[7] * a[10] + a[5] * a[2] * a[11] - a[5] * a[3] * a[10] - a[9] * a[2] * a[7] + a[9] * a[3] * a[6];
      o[7] = a[0] * a[6] * a[11] - a[0] * a[7] * a[10] - a[4] * a[2] * a[11] + a[4] * a[3] * a[10] + a[8] * a[2] * a[7] - a[8] * a[3] * a[6];
      o[11] = -a[0] * a[5] * a[11] + a[0] * a[7] * a[9] + a[4] * a[1] * a[11] - a[4] * a[3] * a[9] - a[8] * a[1] * a[7] + a[8] * a[3] * a[5];
      o[15] = a[0] * a[5] * a[10] - a[0] * a[6] * a[9] - a[4] * a[1] * a[10] + a[4] * a[2] * a[9] + a[8] * a[1] * a[6] - a[8] * a[2] * a[5];
      const det = a[0] * o[0] + a[1] * o[4] + a[2] * o[8] + a[3] * o[12];
      return o.map(v => v / det);
    }
    // 灯头：每个灯头是两个同位置的样本（时间 [t − ε, t]），能量 e
    function uploadHeads(hs, t) {
      const n = Math.min(hs.length, HEADS / 2), a = new Float32Array(HEADS * 4), b = new Float32Array(HEADS * 4), c = new Float32Array(HEADS * 4);
      const eps = 1e-3;
      for (let i = 0; i < HEADS; i++) b[i * 4 + 2] = -5e5 - i;
      for (let k = 0; k < n; k++) for (let j = 0; j < 2; j++) {
        const i = 2 * k + j, h = hs[k];
        a.set([h.p[0], h.p[1], h.p[2], j ? t : t - eps], i * 4); b.set([h.e / eps, h.width, -1000 - k, h.halo], i * 4); c.set([h.c[0], h.c[1], h.c[2], 0], i * 4);
      }
      // 头的区域可能跨行：逐样本所在的行分段写
      const put = (tex, arr) => { gl.bindTexture(gl.TEXTURE_2D, tex); let i = 0; while (i < HEADS) { const g = N + i, x = g % TW, y = Math.floor(g / TW), cnt = Math.min(TW - x, HEADS - i); gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, cnt, 1, gl.RGBA, gl.FLOAT, arr.subarray(i * 4, (i + cnt) * 4)); i += cnt; } };
      put(tA, a); put(tB, b); put(tC, c);
      return n;
    }

    async function render({ cam, t, T, ranges, heads, gain = 1, exposure = 1, bloom = 0.4, threshold = 0.9, time, grainSeed = 1, reflK = 1 }) {
      const M = mats(cam);
      const nh = uploadHeads(heads, t);
      const all = ranges.concat(nh ? [[N, N + 2 * nh]] : []);
      gl.useProgram(P);
      GLK.bindTex(gl, P, 'TA', tA, 0); GLK.bindTex(gl, P, 'TB', tB, 1); GLK.bindTex(gl, P, 'TC', tC, 2);
      gl.uniformMatrix4fv(P.u.VP, false, M.VP);
      gl.uniform1f(P.u.tNow, t); gl.uniform1f(P.u.tLo, t - T); gl.uniform1f(P.u.gain, gain);
      gl.bindVertexArray(vao);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      for (const [tgt, mir, scale] of [[LT, 0, 1], [RT, 1, 0.5]]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, tgt.fb); gl.viewport(0, 0, tgt.w, tgt.h);
        gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(P.u.res, tgt.w, tgt.h); gl.uniform1f(P.u.fpx, M.fpx * scale); gl.uniform1f(P.u.mirror, mir);
        gl.uniform1f(P.u.minSig, scale < 1 ? 0.6 : 0.75);
        for (const [a, b] of all) {
          // 一次最多画 6 万段，中间让出主线程（SwiftShader 的看门狗）
          for (let s = a; s < b - 1; s += 60000) {
            const n = Math.min(60000, b - 1 - s);
            gl.uniform1i(P.u.base, s);
            gl.drawArrays(gl.TRIANGLES, 0, n * 6);
          }
        }
        gl.finish();
        await GLK.tick();
      }
      gl.disable(gl.BLEND);
      gl.useProgram(C);
      GLK.bindTex(gl, C, 'LT', LT.tex, 0); GLK.bindTex(gl, C, 'RT', RT.tex, 1);
      gl.uniformMatrix4fv(C.u.IVP, false, M.IVP); gl.uniform3fv(C.u.cam, cam.p); gl.uniform1f(C.u.time, time); gl.uniform1f(C.u.reflK, reflK);
      gl.uniform2f(C.u.res, W, H);
      gl.bindVertexArray(gl._tri);
      await GLK.drawTiled(gl, SC, 2);
      await post(SC.tex, { exposure, bloom, threshold, grain: 0.035, vignette: 0.32, ca: 0.003, seed: grainSeed, saturation: 1.05 });
      return M;
    }
    // 世界坐标 → 屏幕像素（给 HUD 的标注线用）
    function proj(M, p) { const v = M.VP, x = v[0] * p[0] + v[4] * p[1] + v[8] * p[2] + v[12], y = v[1] * p[0] + v[5] * p[1] + v[9] * p[2] + v[13], w = v[3] * p[0] + v[7] * p[1] + v[11] * p[2] + v[15]; return [(x / w * 0.5 + 0.5) * W, (1 - (y / w * 0.5 + 0.5)) * H]; }
    return { render, proj, mats, gl, N };
  }
  return { create };
})();
