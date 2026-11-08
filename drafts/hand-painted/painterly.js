// painterly.js — 把一张“矢量感”的 Canvas 画变成水粉：
// ① 边缘手抖：按低频噪声挪一点取样位置（2~3 px），线条和色块的边就不再是电脑画的直
// ② 广义 Kuwahara 滤波：8 个扇区里挑方差最小的那几块求平均——平的地方变成一块块笔触，边缘保留
// ③ 纸纹 + 胶片颗粒 + 轻微的冷暖
(function (G) {
  const FS_WARP = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D src; uniform vec2 res; uniform float amp, freq, seed;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + seed) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  void main(){
    vec2 p = uv * res;
    vec2 d = vec2(n(p * freq) - .5, n(p * freq + 17.3) - .5) + .5 * vec2(n(p * freq * 3.1 + 5.) - .5, n(p * freq * 3.1 + 9.) - .5);
    o = texture(src, uv + d * amp / res);
  }`;
  const FS_KUWA = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D src; uniform vec2 res; uniform float radius, q;
  #define PI 3.14159265
  void main(){
    vec3 m[8]; vec3 s[8]; float w[8];
    for (int k = 0; k < 8; k++) { m[k] = vec3(0.); s[k] = vec3(0.); w[k] = 0.; }
    int R = int(radius);
    for (int j = -8; j <= 8; j++) for (int i = -8; i <= 8; i++) {
      if (abs(i) > R || abs(j) > R) continue;
      vec2 d = vec2(float(i), float(j));
      float rr = dot(d, d) / (radius * radius);
      if (rr > 1.) continue;
      vec3 c = texture(src, uv + d / res).rgb;
      float g = exp(-rr * 2.);
      float a = atan(d.y, d.x);
      for (int k = 0; k < 8; k++) {
        float da = a - float(k) * PI / 4.;
        da = mod(da + PI, 2. * PI) - PI;
        float wk = (i == 0 && j == 0) ? .125 : g * pow(max(0., cos(da)), 6.);
        m[k] += c * wk; s[k] += c * c * wk; w[k] += wk;
      }
    }
    vec3 acc = vec3(0.); float wa = 0.;
    for (int k = 0; k < 8; k++) {
      vec3 mk = m[k] / w[k];
      vec3 vk = abs(s[k] / w[k] - mk * mk);
      float sig = (vk.r + vk.g + vk.b) * 255.;
      float al = 1. / (1. + pow(sig, q * .5));
      acc += mk * al; wa += al;
    }
    o = vec4(acc / wa, 1.);
  }`;
  const FS_FIN = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D src; uniform vec2 res; uniform float paper, grain, seed;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + seed) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  void main(){
    vec3 c = texture(src, uv).rgb;
    vec2 p = uv * res;
    float pp = n(p * .35) * .5 + n(p * .9) * .3 + n(p * .08) * .2;
    c *= 1. + (pp - .5) * paper;
    c += (h(p * 1.3 + 3.1) - .5) * grain;
    o = vec4(c, 1.);
  }`;

  // src：一个 2D canvas（任意像素尺寸）；dst：一个要显示的 canvas（会被设成同样的像素尺寸）
  async function apply(src, dst, o = {}) {
    dst.width = src.width; dst.height = src.height;
    const gl = GLK.create(dst);
    const W = src.width, H = src.height;
    const t0 = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    t0.w = W; t0.h = H;
    const A = GLK.fbo(gl, W, H, gl.RGBA16F), B = GLK.fbo(gl, W, H, gl.RGBA16F);
    const Pw = GLK.program(gl, FS_WARP), Pk = GLK.program(gl, FS_KUWA), Pf = GLK.program(gl, FS_FIN);
    gl.useProgram(Pw); GLK.bindTex(gl, Pw, 'src', t0, 0);
    gl.uniform2f(Pw.u.res, W, H); gl.uniform1f(Pw.u.amp, o.wobble ?? 2.2); gl.uniform1f(Pw.u.freq, o.wobbleFreq ?? .045); gl.uniform1f(Pw.u.seed, 3.7);
    await GLK.drawTiled(gl, A, 2);
    let cur = A, nxt = B;
    for (const r of (o.passes || [4])) {
      gl.useProgram(Pk); GLK.bindTex(gl, Pk, 'src', cur.tex, 0);
      gl.uniform2f(Pk.u.res, W, H); gl.uniform1f(Pk.u.radius, r); gl.uniform1f(Pk.u.q, o.q ?? 8);
      await GLK.drawTiled(gl, nxt, 6);
      [cur, nxt] = [nxt, cur];
    }
    gl.useProgram(Pf); GLK.bindTex(gl, Pf, 'src', cur.tex, 0);
    gl.uniform2f(Pf.u.res, W, H); gl.uniform1f(Pf.u.paper, o.paper ?? .07); gl.uniform1f(Pf.u.grain, o.grain ?? .035); gl.uniform1f(Pf.u.seed, 1.3);
    await GLK.drawTiled(gl, null, 2);
  }
  G.PAINTERLY = { apply };
})(window);
