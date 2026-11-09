// 赛璐璐 v2 · 三维卡通渲染（WebGL2 光线步进，无贴图）
// 场景：一颗球 + 一圈倾斜的环。球和环都做三阶硬边着色（高光 / 基色 / 阴影），
// 轮廓线 = 视线与法线接近垂直的地方（silhouette），背景是黄底 + 网点 + 放射速度线，
// 冲击帧：白闪 + 放大的光晕。所有形变都是一个数：SQ（挤压）、SC（缩放）、FLASH（闪白）、BURST（光晕）。
(function (G) {
  const VS = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

  const FS = `#version 300 es
  precision highp float;
  uniform vec2 R;
  uniform float T;        // 旋转相位
  uniform vec2 SQ;        // 挤压：x 放宽，y 压扁
  uniform float SC;       // 整体缩放
  uniform float FLASH;    // 白闪 0–1
  uniform float BURST;    // 放射线 / 光晕的展开 0–1.6
  uniform float RING;     // 环的倾角
  uniform vec2 C;         // 球心（0–1）
  out vec4 o;

  const vec3 YEL   = vec3(1.00, .824, .247);  // #FFD23F
  const vec3 DOT   = vec3(.94, .70, .06);     // 网点
  const vec3 CREAM = vec3(1.00, .953, .690);  // #FFF3B0
  const vec3 INK   = vec3(.078, .078, .169);  // #14142B
  const vec3 WHITE = vec3(1.00, .992, .961);  // #FFFDF5
  const vec3 RED   = vec3(1.00, .231, .278);  // #FF3B47
  const vec3 BLUE  = vec3(.180, .420, 1.00);  // #2E6BFF
  const vec3 PURP  = vec3(.231, .118, .431);  // #3B1E6E

  float sdSphere(vec3 p, float r){ return length(p) - r; }
  float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }

  // 场景：球 + 环（环绕 y 轴旋转后再倾斜）
  vec2 map(vec3 p){
    vec3 q = p / vec3(SQ.x, SQ.y, SQ.x);      // 挤压作用在球上
    float ds = sdSphere(q, .92) * min(SQ.x, SQ.y);
    // 环：先绕 z 倾斜，再绕 y 旋转
    float c = cos(RING), s = sin(RING);
    vec3 r = vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
    float cy = cos(T), sy = sin(T);
    r = vec3(cy * r.x + sy * r.z, r.y, -sy * r.x + cy * r.z);
    float dt = sdTorus(r, vec2(1.42, .085));
    // 0 = 球，1 = 环
    return ds < dt ? vec2(ds, 0.) : vec2(dt, 1.);
  }

  vec3 normalAt(vec3 p){
    vec2 e = vec2(.0015, 0.);
    return normalize(vec3(map(p + e.xyy).x - map(p - e.xyy).x,
                          map(p + e.yxy).x - map(p - e.yxy).x,
                          map(p + e.yyx).x - map(p - e.yyx).x));
  }

  void main(){
    vec2 px = gl_FragCoord.xy;
    float H = R.y;
    vec2 uv = (px - C * R) / H;           // 以球心为原点，高 = 1
    vec2 pb = uv;                         // 背景用的 2D 坐标
    float rb = length(pb);
    float ab = atan(pb.y, pb.x);

    // ── 背景：黄底 + 放射速度线 + 锯齿光晕 ──
    vec3 col = YEL;
    float burst = BURST;
    float jag = (.36 + .08 * burst) + .05 * sin(ab * 19. + T) + .03 * sin(ab * 41.);
    if (rb < jag * (1. + burst * .4)) col = CREAM;
    {
      float tt = (ab / 6.2831853 + .5) * 72.;
      float seg = floor(tt), f = fract(tt);
      float hv = fract(sin(seg * 127.1) * 43758.5);
      float start = .40 + hv * .25;
      float halfW = .05 * (1. - smoothstep(.5, 1.4, rb));
      if (hv > .25 && rb > start && abs(f - .5) < halfW) col = INK;
    }
    // 网点：离球越远越大
    vec2 g = fract(px / 15.) - .5;
    float dr = .10 + .26 * smoothstep(.35, 1.4, rb);
    if (length(g) < dr && rb > .3 && col == YEL) col = DOT;

    // ── 球和环：光线步进 ──
    vec3 ro = vec3(0., 0., 4.6);
    vec3 rd = normalize(vec3(uv * SC * 2.0, -2.9));
    float tt = 2.2;
    float hit = 0.;
    vec2 m = vec2(0.);
    for (int i = 0; i < 90; i++) {
      vec3 p = ro + rd * tt;
      m = map(p);
      if (m.x < .0009) { hit = 1.; break; }
      tt += m.x * .8;
      if (tt > 8.) break;
    }
    if (hit > .5) {
      vec3 p = ro + rd * tt;
      vec3 n = normalAt(p);
      vec3 L = normalize(vec3(-.5, .65, .75));
      vec3 V = -rd;
      float ndl = dot(n, L);
      // 硬阴影：朝光源再走一段，撞到东西就压到阴影色
      float sh = 1.;
      float ts = .03;
      for (int i = 0; i < 28; i++) {
        vec3 ps = p + L * ts;
        float d = map(ps).x;
        if (d < .001) { sh = 0.; break; }
        ts += d * .9;
        if (ts > 4.) break;
      }
      float lit = ndl * sh;
      vec3 base = m.y < .5 ? RED : BLUE;
      vec3 shadeC = m.y < .5 ? PURP : vec3(.09, .09, .34);
      vec3 body = lit > .80 ? WHITE : (lit > .22 ? base : shadeC);
      // 轮廓：视线几乎与法线垂直 → 墨线
      float sil = dot(n, V);
      if (sil < .26) body = INK;
      col = body;
    }

    // 冲击闪白
    col = mix(col, WHITE, FLASH);

    o = vec4(clamp(col, 0., 1.), 1.);
  }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function paint(canvas, o) {
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
    const u = n => gl.getUniformLocation(p, n);
    const sq = o.sq || [1, 1];
    gl.uniform2f(u('R'), canvas.width, canvas.height);
    gl.uniform1f(u('T'), o.t || 0);
    gl.uniform2f(u('SQ'), sq[0], sq[1]);
    gl.uniform1f(u('SC'), o.sc || 1);
    gl.uniform1f(u('FLASH'), o.flash || 0);
    gl.uniform1f(u('BURST'), o.burst == null ? 1 : o.burst);
    gl.uniform1f(u('RING'), o.ring == null ? .55 : o.ring);
    gl.uniform2f(u('C'), o.cx == null ? .5 : o.cx, o.cy == null ? .5 : o.cy);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  }

  G.Cel3D = { paint };
})(window);
