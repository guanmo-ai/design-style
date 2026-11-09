// 赛璐璐 · 三阶硬边着色 + 冲击帧（WebGL2 片元着色器，无贴图）
// 球：三阶硬边（高光 / 基色 / 阴影），没有渐变；轮廓是 12 像素的墨线；投影是一块硬边的暗色椭圆。
// 背景：冲击帧——从球心放射的速度线（黑线随机长短）+ 一圈锯齿状的白光。
// 用法：window.CelFX.paint(canvas, { cx, cy, rad, seed, burst })  cx/cy 为 0–1（y 从下往上），rad 按画面高度计
(function (G) {
  const VS = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

  const FS = `#version 300 es
  precision highp float;
  uniform vec2 R;
  uniform vec2 C;
  uniform float RAD;
  uniform float SEED;
  uniform float BURST;     // 1 = 有冲击帧背景；0 = 纯黄底
  out vec4 o;

  float h1(float n){ return fract(sin(n * 127.1 + SEED * 311.7) * 43758.5453); }

  void main(){
    vec2 px = gl_FragCoord.xy;
    vec2 p = (px - C * R) / R.y;          // 以球心为原点，高 = 1
    float r = length(p);
    float a = atan(p.y, p.x);

    vec3 YEL  = vec3(1.0, 0.824, 0.247);  // #FFD23F
    vec3 CREAM= vec3(1.0, 0.953, 0.690);  // #FFF3B0
    vec3 INK  = vec3(0.078, 0.078, 0.169);// #14142B
    vec3 WHITE= vec3(1.0, 0.992, 0.961);  // #FFFDF5
    vec3 RED  = vec3(0.902, 0.224, 0.275);// #E63946
    vec3 PURP = vec3(0.357, 0.227, 0.549);// #5B3A8C
    vec3 SHAD = vec3(0.878, 0.620, 0.102);// #E09E1A（黄底上的阴影色）

    vec3 col = YEL;

    if (BURST > .5) {
      // 光晕：锯齿状的白圈，像冲击的边
      float jag = RAD * 1.32 + .035 * sin(a * 23.0 + SEED) + .02 * sin(a * 51.0);
      if (r < jag) col = CREAM;
      // 速度线：60 段放射，每段一条黑线，长度和起点随机
      float t = (a / 6.2831853 + .5) * 60.;
      float seg = floor(t), f = fract(t);
      float hv = h1(seg);
      float start = RAD * 1.4 + hv * .22;
      float halfW = .05 * (1. - smoothstep(.3, .95, r));
      if (hv > .42 && r > start && abs(f - .5) < halfW) col = INK;
    }

    // 投影：硬边的椭圆，落在球的右下方
    vec2 sq = (p - vec2(.05, -RAD * 1.12)) / vec2(RAD * 1.08, RAD * .22);
    if (length(sq) < 1.) col = SHAD;

    // 球：三阶硬边着色
    float dd = r - RAD;
    if (dd < 0.) {
      float z = sqrt(max(RAD * RAD - dot(p, p), 0.));
      vec3 n = vec3(p, z) / RAD;
      vec3 L = normalize(vec3(-.45, .55, .7));
      float ndl = dot(n, L);
      vec3 body = ndl > .84 ? WHITE : (ndl > .30 ? RED : PURP);
      // 高光：一小块硬边的椭圆，画在左上
      if (length((p - vec2(-.13, .14)) / vec2(.085, .045)) < 1.) body = WHITE;
      col = body;
    }

    // 墨线：12px 宽的轮廓（按画面高度换算）
    float lw = 6. / R.y;
    if (abs(dd) < lw) col = INK;

    o = vec4(col, 1.);
  }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function paint(canvas, opts) {
    const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error('no webgl2');
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.bindAttribLocation(p, 0, 'p');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    gl.useProgram(p);
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(gl.getUniformLocation(p, 'R'), canvas.width, canvas.height);
    gl.uniform2f(gl.getUniformLocation(p, 'C'), opts.cx, opts.cy);
    gl.uniform1f(gl.getUniformLocation(p, 'RAD'), opts.rad);
    gl.uniform1f(gl.getUniformLocation(p, 'SEED'), opts.seed || 0);
    gl.uniform1f(gl.getUniformLocation(p, 'BURST'), opts.burst === false ? 0 : 1);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  }

  G.CelFX = { paint };
})(window);
