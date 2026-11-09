// 水墨 v4 · 墨入水 + 景深（WebGL2，无贴图）
// 前景墨：两层域扭曲的流场取阈值，注入处浓、边缘长卷须；
// 背景墨：同一种流场放大 1.6 倍、阈值放宽、颜色变淡——像照片里对焦之外的墨；
// 朱砂：第三层流场，只在一个半径内出现。
// MODE：0 成片 · 1 噪声 · 2 扭一次 · 3 扭两次 · 4 只取阈值（单层墨，无景深、无朱砂）
(function (G) {
  const VS = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
  const FS = `#version 300 es
  precision highp float;
  uniform vec2 R;
  uniform float T;
  uniform float SEED;
  uniform vec2 C;
  uniform float SPREAD;
  uniform float SCALE;
  uniform vec4 RED;
  uniform int MODE;
  uniform float WIPE;
  uniform float BACK;
  out vec4 o;

  float h(vec2 p){ p = fract(p * vec2(123.34, 456.21) + SEED); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p){
    float s = 0., a = .5;
    for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + vec2(3.1, 1.7); a *= .5; }
    return s;
  }
  vec2 warp1(vec2 p, float t){ return vec2(fbm(p + .07 * t), fbm(p + vec2(5.2, 1.3) - .05 * t)); }
  float flow(vec2 p, float t){
    vec2 q = warp1(p, t);
    vec2 r = vec2(fbm(p + 4. * q + vec2(1.7, 9.2) + .14 * t), fbm(p + 4. * q + vec2(8.3, 2.8) + .11 * t));
    return fbm(p + 4. * r);
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / R;
    float asp = R.x / R.y;
    vec2 q = vec2(uv.x * asp, uv.y);
    vec3 paper = vec3(.953, .933, .886);
    vec3 ink0  = vec3(.090, .090, .085);
    vec3 grey  = vec3(.60, .595, .575);
    vec3 zhu   = vec3(.784, .216, .176);
    vec2 cc = C * vec2(asp, 1.);
    float d = length(q - cc);
    vec2 p = (q - cc) * SCALE + SEED;

    if (MODE == 1) { float v = fbm(p); o = vec4(mix(paper, ink0, smoothstep(.25, .8, v)), 1.); return; }
    if (MODE == 2) { vec2 w = warp1(p, T); float v = fbm(p + 4. * w); o = vec4(mix(paper, ink0, smoothstep(.3, .78, v)), 1.); return; }
    float f = flow(p, T);
    if (MODE == 3) { o = vec4(mix(paper, ink0, smoothstep(.32, .78, f)), 1.); return; }

    float inj = exp(-d * d / (SPREAD * SPREAD));
    float dens = smoothstep(.60, .80, f + inj * .30 + WIPE);
    float rim  = smoothstep(.52, .60, f) * (1. - smoothstep(.60, .70, f));
    float k = clamp(dens * .96 + rim * .22 * inj, 0., 1.);
    vec3 col = paper;

    if (MODE == 0) {
      // 景深：更大、更淡、边更软的一层墨在后面
      float fb = flow(p * .62 + vec2(7.3, 2.1), T * .8);
      float injB = exp(-d * d / (SPREAD * SPREAD * 2.6));
      float db = smoothstep(.58, .86, fb + injB * .30 + WIPE * .8);
      float near = exp(-d * d / (SPREAD * SPREAD * 5.)) + WIPE * 2.;   // 只在墨团周围，不铺满
      col = mix(col, grey, db * BACK * min(near, 1.));
    }
    col = mix(col, ink0, pow(k, 1.1));

    if (MODE == 0 && RED.w > .5) {
      vec2 rc = RED.xy * vec2(asp, 1.);
      float rd = length(q - rc);
      float fr = flow(p * .9 + vec2(3.3, 1.1), T * 1.2);
      float halo = exp(-rd * rd / (RED.z * RED.z));
      float rk = smoothstep(.50, .72, fr + halo * .38) * min(halo * 1.5, 1.);
      col = mix(col, zhu, rk * (1. - k * .85));
    }
    col *= .978 + .03 * vn(gl_FragCoord.xy * .8 + SEED);
    if (MODE == 0) col *= 1. - .10 * dot(uv - .5, uv - .5);
    o = vec4(clamp(col, 0., 1.), 1.);
  }`;

  function setup(canvas) {
    if (canvas._ct) return canvas._ct;
    const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
    gl.bindAttribLocation(p, 0, 'p');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    gl.useProgram(p);
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const U = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const inf = gl.getActiveUniform(p, i); U[inf.name] = gl.getUniformLocation(p, inf.name); }
    return (canvas._ct = { gl, U });
  }
  // o: { t, seed, c:[x,y], spread, scale, red:[x,y,r,on], mode, wipe, back }
  function paint(canvas, o) {
    const { gl, U } = setup(canvas);
    const c = o.c || [.5, .5], red = o.red || [0, 0, .1, 0];
    gl.uniform2f(U.R, canvas.width, canvas.height);
    gl.uniform1f(U.T, o.t || 0);
    gl.uniform1f(U.SEED, o.seed || 0);
    gl.uniform2f(U.C, c[0], c[1]);
    gl.uniform1f(U.SPREAD, o.spread || .25);
    gl.uniform1f(U.SCALE, o.scale || 2.4);
    gl.uniform4f(U.RED, red[0], red[1], red[2], red[3] ? 1 : 0);
    gl.uniform1i(U.MODE, o.mode || 0);
    gl.uniform1f(U.WIPE, o.wipe || 0);
    gl.uniform1f(U.BACK, o.back == null ? .55 : o.back);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  }
  G.Ink4 = { paint };
})(window);
