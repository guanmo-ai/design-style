// 极光 v4 · 光帘 + 湖面倒影 + 玻璃球（WebGL2，无贴图）
// 光帘：5 层，每层一条被噪声推动的底边；底边以下很快消失（亮而锐利），以上按指数衰减；
// 竖向光柱是沿 x 的高频噪声；颜色随离底边的高度从绿 → 青 → 紫 → 粉。
// 湖面：把水平线以上的画面镜像下来，加两种涟漪；玻璃球按法线折射背后的天空（RGB 三通道错开）。
// MODE：0 成片 · 1 只有天空和星星 · 2 一层光帘（单色、无光柱）· 3 一层光帘（光柱 + 颜色）· 4 五层光帘（无山、无湖、无球）
(function (G) {
  const VS = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
  const FS = `#version 300 es
  precision highp float;
  uniform vec2 R;
  uniform float T;
  uniform int MODE;
  uniform float INT;
  uniform vec4 ORB;
  uniform float HOR;
  uniform float RIP;
  uniform float SEED;
  uniform float GRAIN;
  out vec4 o;

  const vec3 GREEN = vec3(.20, 1., .62);
  const vec3 CYAN = vec3(.13, .85, .95);
  const vec3 VIOL = vec3(.55, .30, 1.);
  const vec3 PINK = vec3(1., .36, .75);

  float h11(float n){ return fract(sin(n * 91.345 + SEED) * 47453.5453); }
  float n11(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h11(i), h11(i + 1.), f); }
  float f11(float x){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * n11(x); x = x * 2.03 + 7.1; a *= .5; } return s; }
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + SEED) * 43758.5453); }

  vec3 sky(vec2 uv){
    float y = uv.y;
    vec3 c = mix(vec3(.035, .06, .14), vec3(.006, .010, .040), smoothstep(HOR, 1., y));
    c += vec3(.02, .09, .11) * exp(-max(y - HOR, 0.) * 9.);
    vec2 cell = floor(uv * 190.);
    float r = h21(cell);
    if (r > .982) {
      vec2 fp = fract(uv * 190.) - .5 - (vec2(h21(cell + 1.), h21(cell + 2.)) - .5) * .6;
      float tw = .55 + .45 * sin(T * 2. + r * 60.);
      c += vec3(.9, .95, 1.) * smoothstep(.16, .0, length(fp)) * tw * (.35 + .65 * h21(cell + 3.)) * smoothstep(HOR, HOR + .2, y);
    }
    return c;
  }

  vec3 curtains(vec2 uv, int nl, bool rays, bool colorize){
    vec3 acc = vec3(0.);
    for (int i = 0; i < 5; i++) {
      if (i >= nl) break;
      float fi = float(i);
      float sc = 1.1 + fi * .38;
      float x = uv.x * sc + T * (.05 + .02 * fi) + fi * 13.7;
      float base = (HOR + .15 + fi * .055) + .17 * (f11(x * .55 + T * .06) - .5) + .035 * sin(x * 1.7 + T * .5 + fi);
      float hg = uv.y - base;
      float inten = hg < 0. ? exp(hg * 70.) : exp(-hg * (3.0 + fi * .6));
      float ry = rays ? (.30 + .70 * pow(n11(x * 26. + hg * 2.5 + fi * 3.1), 1.6)) : 1.;
      float fold = .55 + .9 * pow(n11(x * 2.2 - T * .15 + fi), 2.);
      float gap = smoothstep(.25, .75, n11(x * .33 + fi * 5.3 + T * .03));   // 横向有亮有暗，不是整片
      float a = inten * ry * fold * (1. - fi * .13) * (.15 + 1.25 * gap);
      vec3 col = GREEN;
      if (colorize) {
        col = mix(GREEN, CYAN, smoothstep(0., .10, hg));
        col = mix(col, VIOL, smoothstep(.08, .30, hg));
        col = mix(col, PINK, smoothstep(.22, .45, hg) * .6);
      }
      acc += col * a * .55;
    }
    return acc;
  }

  // 天空 + 光帘 + 山（不含球）
  vec3 env(vec2 uv){
    vec3 c = sky(uv);
    if (MODE == 1) return c;
    int nl = MODE == 2 || MODE == 3 ? 1 : 5;
    c += curtains(uv, nl, MODE != 2, MODE != 2) * INT;
    if (MODE == 0) {
      float ridge = 1. - abs(2. * n11(uv.x * 3.1 + 4.) - 1.);
      float m = HOR + .010 + .040 * f11(uv.x * 1.3 + 2.) + .022 * ridge * ridge + .006 * n11(uv.x * 40.);
      if (uv.y < m) c = vec3(.006, .008, .02) + vec3(.02, .06, .05) * INT * exp(-(m - uv.y) * 40.);
    }
    return c;
  }

  vec3 scene(vec2 uv){
    vec3 c = env(uv);
    if (MODE == 0 && ORB.w > .5) {
      vec2 c0 = ORB.xy * vec2(R.x / R.y, 1.);
      vec2 d = uv - c0;
      float rr = ORB.z, dd = length(d);
      if (dd < rr + .002) {
        vec2 pn = d / rr;
        float zz = sqrt(max(1. - dot(pn, pn), 0.));
        vec2 off = -pn * (.30 + rr * 1.2) * (1. - zz * .25);   // 透镜：从更远处取样，把高处的紫粉翻进来
        vec3 refr = vec3(env(uv + off * .94).r, env(uv + off).g, env(uv + off * 1.07).b);
        refr *= mix(.35, 1., smoothstep(0., .6, zz));
        float fres = pow(1. - zz, 2.5);
        float hl = exp(-dot(pn - vec2(-.40, .48), pn - vec2(-.40, .48)) * 16.);
        vec3 g = refr * 1.25 + fres * vec3(.6, .9, 1.) * .9 + hl * .8;
        c = mix(c, g, smoothstep(rr + .002, rr - .002, dd));
      }
      c += vec3(.15, .55, .45) * exp(-max(dd - rr, 0.) * 26.) * .10 * step(rr, dd) * INT;
    }
    return c;
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / R.y;
    vec3 col;
    if (MODE == 0 && uv.y < HOR) {
      float dy = HOR - uv.y;
      vec2 m = vec2(uv.x, HOR + dy);
      float rp = sin(dy * 240. + T * 2.) * .0016 + sin(uv.x * 38. + dy * 70. - T) * .0012;
      if (ORB.w > .5) {
        vec2 rc = vec2(ORB.x * R.x / R.y, HOR - .01);
        float q = length((uv - rc) * vec2(1., 3.2));
        rp += RIP * sin(q * 130. - T * 7.) * exp(-q * 7.) * .006;
      }
      m.x += rp;
      m.y += rp * .6;
      col = scene(m) * vec3(.55, .62, .70) * (1. - smoothstep(0., HOR, dy) * .35);
    } else {
      col = scene(uv);
    }
    col = 1. - exp(-col * 1.25);
    vec2 sv = gl_FragCoord.xy / R - .5;
    col *= 1. - .25 * dot(sv, sv);
    col += (h21(gl_FragCoord.xy + T * 50.) - .5) * GRAIN;
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
  // o: { t, mode, int, orb:{x,y,r}|null, hor, rip, seed, grain }
  function paint(canvas, o) {
    const { gl, U } = setup(canvas);
    const b = o.orb;
    gl.uniform2f(U.R, canvas.width, canvas.height);
    gl.uniform1f(U.T, o.t || 0);
    gl.uniform1i(U.MODE, o.mode || 0);
    gl.uniform1f(U.INT, o.int == null ? 1 : o.int);
    gl.uniform4f(U.ORB, b ? b.x : 0, b ? b.y : 0, b ? b.r : 0, b ? 1 : 0);
    gl.uniform1f(U.HOR, o.hor == null ? .30 : o.hor);
    gl.uniform1f(U.RIP, o.rip == null ? .5 : o.rip);
    gl.uniform1f(U.SEED, o.seed || 0);
    gl.uniform1f(U.GRAIN, o.grain == null ? .02 : o.grain);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  }
  G.Aurora4 = { paint };
})(window);
