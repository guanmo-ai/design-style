// glkit.js — 三个“光”风格共用的 WebGL2 小工具（无依赖）
// 编译着色器 / 浮点帧缓冲 / 分块绘制（避免 GPU 看门狗）/ 泛光 + ACES 色调映射 + 颗粒的后期
(function (G) {
  const VS = `#version 300 es
  in vec2 p; out vec2 uv;
  void main(){ uv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;

  function create(canvas, opts = {}) {
    const gl = canvas.getContext('webgl2', Object.assign({ antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false }, opts));
    if (!gl) throw new Error('no webgl2');
    gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('OES_texture_float_linear');
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl._tri = vao;
    return gl;
  }

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      const lines = src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n');
      throw new Error(log + '\n' + lines.slice(0, 20000));
    }
    return s;
  }

  function program(gl, fs, vs = VS) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'p');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name);
    }
    p.u = u;
    return p;
  }

  function texture(gl, w, h, { internal, format, type, data = null, filter } = {}) {
    internal = internal || gl.RGBA16F; format = format || gl.RGBA; type = type || gl.HALF_FLOAT;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data);
    const f = filter || gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    t.w = w; t.h = h;
    return t;
  }

  function fbo(gl, w, h, internal) {
    const tex = texture(gl, w, h, { internal: internal || gl.RGBA16F, type: gl.HALF_FLOAT });
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex, w, h };
  }

  const tick = () => new Promise(r => setTimeout(r, 0));

  // 分块画全屏三角形：每块之后 finish 一下，让出主线程
  async function drawTiled(gl, target, tiles = 6, before) {
    const w = target ? target.w : gl.drawingBufferWidth, h = target ? target.h : gl.drawingBufferHeight;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, w, h);
    gl.enable(gl.SCISSOR_TEST);
    const tw = Math.ceil(w / tiles), th = Math.ceil(h / tiles);
    for (let y = 0; y < tiles; y++) for (let x = 0; x < tiles; x++) {
      gl.scissor(x * tw, y * th, tw, th);
      if (before) before();
      gl.bindVertexArray(gl._tri);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.finish();
      await tick();
    }
    gl.disable(gl.SCISSOR_TEST);
  }

  function draw(gl, target) {
    const w = target ? target.w : gl.drawingBufferWidth, h = target ? target.h : gl.drawingBufferHeight;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, w, h);
    gl.bindVertexArray(gl._tri);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function bindTex(gl, prog, name, tex, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(prog.u[name], unit);
  }

  // —— 后期：亮部提取 → 多级模糊 → 合成（ACES + 色差 + 暗角 + 颗粒）——
  const FS_BRIGHT = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform float thr;
  void main(){ vec3 c = texture(src, uv).rgb; float l = max(c.r, max(c.g, c.b));
    o = vec4(c * smoothstep(thr, thr*2.0+0.5, l), 1.); }`;
  const FS_BLUR = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform vec2 dir;
  void main(){ vec3 s = vec3(0.); float w[7] = float[](0.1964,0.1747,0.1210,0.0656,0.0277,0.0091,0.0024);
    s += texture(src, uv).rgb*w[0];
    for(int i=1;i<7;i++){ s += texture(src, uv+dir*float(i)).rgb*w[i]; s += texture(src, uv-dir*float(i)).rgb*w[i]; }
    o = vec4(s,1.); }`;
  const FS_COMP = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D src, b1, b2, b3; uniform float exposure, bloom, grain, vign, ca, seed, sat;
  uniform vec3 lift; uniform vec2 res;
  vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.,1.); }
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))+seed)*43758.5453); }
  void main(){
    vec2 d = (uv-0.5); float r2 = dot(d,d);
    vec3 c;
    c.r = texture(src, uv - d*ca*r2).r; c.g = texture(src, uv).g; c.b = texture(src, uv + d*ca*r2).b;
    vec3 bl = texture(b1,uv).rgb*0.5 + texture(b2,uv).rgb*0.8 + texture(b3,uv).rgb*1.0;
    c += bl*bloom;
    c *= exposure;
    c = aces(c);
    float l = dot(c, vec3(0.2126,0.7152,0.0722)); c = mix(vec3(l), c, sat);
    c = pow(c, vec3(1.0/2.2));
    c = c + lift*(1.0-c);
    c *= 1.0 - vign*smoothstep(0.15, 0.85, r2*2.2);
    c += (h(uv*res)-0.5)*grain;
    o = vec4(c,1.);
  }`;

  function post(gl) {
    const P = { bright: program(gl, FS_BRIGHT), blur: program(gl, FS_BLUR), comp: program(gl, FS_COMP) };
    let levels = null;
    return async function run(src, o = {}) {
      const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
      if (!levels) {
        levels = [4, 8, 16].map(s => [fbo(gl, Math.ceil(W / s), Math.ceil(H / s)), fbo(gl, Math.ceil(W / s), Math.ceil(H / s))]);
      }
      // 亮部 → 每级
      let prev = src;
      for (const [a, b] of levels) {
        gl.useProgram(P.bright); bindTex(gl, P.bright, 'src', prev === src ? src : prev, 0);
        gl.uniform1f(P.bright.u.thr, prev === src ? (o.threshold ?? 1.0) : 0.0);
        draw(gl, a);
        for (let k = 0; k < 2; k++) {
          gl.useProgram(P.blur); bindTex(gl, P.blur, 'src', a.tex, 0);
          gl.uniform2f(P.blur.u.dir, 1.4 / a.w, 0); draw(gl, b);
          bindTex(gl, P.blur, 'src', b.tex, 0);
          gl.uniform2f(P.blur.u.dir, 0, 1.4 / a.h); draw(gl, a);
        }
        prev = a.tex;
      }
      gl.finish(); await tick();
      gl.useProgram(P.comp);
      bindTex(gl, P.comp, 'src', src, 0);
      bindTex(gl, P.comp, 'b1', levels[0][0].tex, 1);
      bindTex(gl, P.comp, 'b2', levels[1][0].tex, 2);
      bindTex(gl, P.comp, 'b3', levels[2][0].tex, 3);
      gl.uniform1f(P.comp.u.exposure, o.exposure ?? 1.0);
      gl.uniform1f(P.comp.u.bloom, o.bloom ?? 0.35);
      gl.uniform1f(P.comp.u.grain, o.grain ?? 0.03);
      gl.uniform1f(P.comp.u.vign, o.vignette ?? 0.35);
      gl.uniform1f(P.comp.u.ca, o.ca ?? 0.004);
      gl.uniform1f(P.comp.u.sat, o.saturation ?? 1.0);
      gl.uniform1f(P.comp.u.seed, o.seed ?? 1.0);
      gl.uniform3fv(P.comp.u.lift, o.lift ?? [0, 0, 0]);
      gl.uniform2f(P.comp.u.res, W, H);
      await drawTiled(gl, null, 2);
    };
  }

  // —— 文字 → 有向距离场（Felzenszwalb 精确欧氏距离变换）——
  function edt1d(f, n, d, v, z) {
    let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
    for (let q = 1; q < n; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
  }
  function edt2d(grid, w, h) {
    const n = Math.max(w, h);
    const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
      edt1d(f, h, d, v, z);
      for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) f[x] = grid[y * w + x];
      edt1d(f, w, d, v, z);
      for (let x = 0; x < w; x++) grid[y * w + x] = Math.sqrt(d[x]);
    }
  }
  // alpha: Uint8 (0..255) 遮罩 → Float32 有向距离（像素，内部为负）
  function sdfFromAlpha(alpha, w, h) {
    const INF = 1e20, N = w * h;
    const outside = new Float64Array(N), inside = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const a = alpha[i] / 255;
      if (a >= 0.999) { outside[i] = 0; inside[i] = INF; }
      else if (a <= 0.001) { outside[i] = INF; inside[i] = 0; }
      else { const dd = Math.max(0, 0.5 - a); const di = Math.max(0, a - 0.5); outside[i] = dd * dd; inside[i] = di * di; }
    }
    edt2d(outside, w, h); edt2d(inside, w, h);
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) out[i] = outside[i] - inside[i];
    return out;
  }

  // 可分离高斯模糊（就地），用来抹掉距离场里的像素台阶——镜面会把这种台阶放大成条纹
  function blurField(f, w, h, sigma) {
    const r = Math.ceil(sigma * 3), k = new Float32Array(2 * r + 1);
    let sum = 0; for (let i = -r; i <= r; i++) { k[i + r] = Math.exp(-i * i / (2 * sigma * sigma)); sum += k[i + r]; }
    for (let i = 0; i < k.length; i++) k[i] /= sum;
    const tmp = new Float32Array(w * h);
    for (let y = 0; y < h; y++) { const o = y * w;
      for (let x = 0; x < w; x++) { let a = 0; for (let i = -r; i <= r; i++) { const xx = Math.min(w - 1, Math.max(0, x + i)); a += f[o + xx] * k[i + r]; } tmp[o + x] = a; } }
    for (let x = 0; x < w; x++)
      for (let y = 0; y < h; y++) { let a = 0; for (let i = -r; i <= r; i++) { const yy = Math.min(h - 1, Math.max(0, y + i)); a += tmp[yy * w + x] * k[i + r]; } f[y * w + x] = a; }
    return f;
  }

  G.GLK = { blurField, create, program, texture, fbo, draw, drawTiled, bindTex, post, sdfFromAlpha, tick };
})(window);
