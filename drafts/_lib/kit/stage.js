// kit/stage.js — 3D 片子的舞台（WebGL2，依赖 motion.js）：无缝背景墙 + 地面软影 → 你的东西 → 亮珠子 → 泛光 + 调色 + 颗粒。
// 用法：const st = STAGE.create(canvas); 每帧 const c = st.frame(s); st.begin(s, c); …画你的东西（用 c.VP / c.key / c.px）…; st.beads(s.beads, s, c); st.end(s, c);
// s 里舞台认的参数：eye / at / fov、key / keyCol / amb / rim、bg: [墙色, 地色]、spot、occ（挡光的球）、shadow、floor、
// wall + wallMix + pill（界面那种“正对一面墙”的镜头）、exposure / bloom / thr / grain / vignette / sat / fade。
const STAGE = (() => {
  const { m4, srgb } = KIT;
  // 亮珠子（眼睛、鼻子、纽扣）：点精灵里算一颗球
  const BEAD_VS = `#version 300 es
  precision highp float;
  layout(location=0) in vec4 aP; layout(location=1) in vec4 aC;
  uniform mat4 uVP; uniform float uPx; out vec4 vC; out float vR;
  void main(){ gl_Position = uVP*vec4(aP.xyz, 1.0); gl_PointSize = aP.w < 1e-4 ? 0.0 : 2.0*aP.w*uPx/max(gl_Position.w, 0.05); vC = aC; vR = aP.w/max(gl_Position.w, 0.05); }`;
  const BEAD_FS = `#version 300 es
  precision highp float; in vec4 vC; in float vR; out vec4 o; uniform vec3 uKeyV, uKeyCol;
  void main(){ vec2 d = (gl_PointCoord - 0.5)*2.0; d.y = -d.y; float r2 = dot(d,d); if (r2 > 1.0) discard;
    vec3 n = vec3(d, sqrt(1.0 - r2));
    vec3 R = reflect(vec3(0.,0.,-1.), n);
    float sp = pow(max(dot(R, uKeyV), 0.0), 220.0)*14.0 + pow(max(dot(R, normalize(uKeyV + vec3(-0.9, 0.25, 0.))), 0.0), 60.0)*0.5;
    float fr = pow(1.0 - n.z, 3.0);
    vec3 env = mix(vec3(0.05), vec3(1.4, 1.3, 1.2), smoothstep(0.1, 0.9, R.y))*(0.08 + 0.6*fr);
    o = vec4(vC.rgb*(0.25 + 0.75*max(dot(n, uKeyV), 0.0))*uKeyCol + env*vC.a + uKeyCol*sp*vC.a, 1.0);
    gl_FragDepth = gl_FragCoord.z - 0.0006*n.z; }`;

  const FSQ_VS = `#version 300 es
  in vec2 p; out vec2 uv; void main(){ uv = p*0.5+0.5; gl_Position = vec4(p, 0., 1.); }`;
  // 布景：一面无缝的弧形背景墙 + 地面；地上是每颗球的软影子和接触阴影
  const BG_FS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform mat4 uIVP; uniform vec3 uEye, uKey, uBgA, uBgB, uSpot; uniform vec4 uOcc[10]; uniform float uShadow, uFloorY, uWall, uPillOn, uWallMix; uniform vec4 uPill; uniform vec3 uPillCol;
  void main(){
    vec4 h = uIVP*vec4(uv*2.0-1.0, 1.0, 1.0); vec3 rd = normalize(h.xyz/h.w - uEye);
    vec3 c; float sh = 1.0;
    float t = rd.y < -1e-4 ? (uFloorY - uEye.y)/rd.y : 1e9;
    if (uWall > -50.0) t = (uWall - uEye.z)/rd.z;
    vec3 P = uEye + rd*min(t, 60.0);
    float wall = uWall > -50.0 ? 0.0 : smoothstep(9.0, 22.0, length(P.xz));   // 远处地面卷成墙
    float g = clamp(rd.y*1.6 + 0.5, 0., 1.);
    vec3 wallc = mix(uBgB, uBgA, g);
    vec3 floorc = uWall > -50.0 ? uBgA : uBgB*mix(1.12, 1.0, uWallMix);
    c = mix(floorc, wallc, max(wall, step(1e8, t)));
    if (uWall < -50.0) c += uBgA*uSpot.z*exp(-dot(uv-uSpot.xy, uv-uSpot.xy)*5.0);   // 主角背后一团光
    if (t < 1e8) { for (int i=0;i<10;i++){ if (uOcc[i].w > 0.0){
      vec3 oc = uOcc[i].xyz - P; float tt = dot(oc, uKey), rr = uOcc[i].w;
      if (tt > 0.0) { float dist = length(oc - uKey*tt); sh *= mix(1.0, smoothstep(rr*0.55, rr*(1.0 + 0.5*tt/rr), dist), 0.62*(1.0-wall)); }
      float hgt = max(uOcc[i].y - rr - uFloorY, 0.0);
      float cd = length(oc.xz)/rr; if (uWall < -50.0) sh *= 1.0 - 0.55*exp(-cd*cd*1.6)*exp(-hgt*2.5/rr)*(1.0-wall); } } }
    if (uWall > -50.0 && uPillOn > 0.0) {                                    // 开关的轨道：一颗胶囊，画在墙上
      vec2 q = abs(P.xy - uPill.xy) - vec2(uPill.z - uPill.w, 0.0); float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uPill.w*uPillOn;
      c = mix(c, uPillCol*(0.86 + 0.14*smoothstep(-0.07, 0.0, d - 0.02*(P.y - uPill.y)/uPill.w)), smoothstep(0.004, -0.004, d)); }
    c *= mix(1.0, sh, uShadow);
    { vec3 y = min(c, 0.985); c = mix(c, (sqrt((1.0-y)*(1.0-y) + 4.0*y/9.0) - (1.0-y))*4.5, uWallMix); }      // 界面的墙：把调色曲线反过来，白就是白。按 uWallMix 渐变过去，不能在某一帧突然切（整屏会跳亮）
    o = vec4(c, 1.0);
  }`;
  const POST_BRIGHT = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform float thr;
  void main(){ vec3 c = texture(src, uv).rgb; float l = max(c.r, max(c.g, c.b)); o = vec4(c*smoothstep(thr, thr*2.0, l), 1.); }`;
  const POST_BLUR = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform vec2 dir;
  void main(){ vec3 s = vec3(0.); float w[5] = float[](0.227, 0.1946, 0.1216, 0.0541, 0.0162);
    s += texture(src, uv).rgb*w[0];
    for(int i=1;i<5;i++){ s += texture(src, uv+dir*float(i)).rgb*w[i]; s += texture(src, uv-dir*float(i)).rgb*w[i]; }
    o = vec4(s, 1.); }`;
  const POST_COMP = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D src, b1, b2; uniform float exposure, bloom, grain, vign, seed, sat, fade; uniform vec2 res;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))+seed)*43758.5453); }
  void main(){
    vec3 c = texture(src, uv).rgb + (texture(b1, uv).rgb*0.6 + texture(b2, uv).rgb)*bloom;
    c *= exposure;
    c = c*(1.0 + c/9.0)/(1.0 + c);                               // 压高光，不洗颜色
    float l = dot(c, vec3(0.2126,0.7152,0.0722)); c = mix(vec3(l), c, sat);
    c = pow(max(c, 0.0), vec3(1.0/2.2));
    vec2 d = uv - 0.5; c *= 1.0 - vign*smoothstep(0.2, 0.95, dot(d,d)*2.4);
    c += (h(uv*res) - 0.5)*grain;
    o = vec4(c*fade, 1.);
  }`;

  function prog(gl, vs, fs) {
    const p = gl.createProgram();
    for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) + '\n' + s.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n'));
      gl.attachShader(p, sh);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    p.u = {};
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const inf = gl.getActiveUniform(p, i); p.u[inf.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, inf.name); }
    return p;
  }

  function create(canvas, { msaa = 4 } = {}) {
    const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: false });
    if (!gl) throw new Error('no webgl2');
    gl.getExtension('EXT_color_buffer_float'); gl.getExtension('OES_texture_float_linear');
    const W = canvas.width, H = canvas.height;
    const P = { bead: prog(gl, BEAD_VS, BEAD_FS), bg: prog(gl, FSQ_VS, BG_FS), bright: prog(gl, FSQ_VS, POST_BRIGHT), blur: prog(gl, FSQ_VS, POST_BLUR), comp: prog(gl, FSQ_VS, POST_COMP) };
    // 浮点数据纹理（一行一条记录那种），不插值
    const ftex = (w, h, data) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, data);
      for (const k of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, k, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
    const fsq = gl.createBuffer(), fsqVAO = gl.createVertexArray(), emptyVAO = gl.createVertexArray(), beadBuf = gl.createBuffer(), beadVAO = gl.createVertexArray();
    gl.bindVertexArray(fsqVAO); gl.bindBuffer(gl.ARRAY_BUFFER, fsq); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(beadVAO); gl.bindBuffer(gl.ARRAY_BUFFER, beadBuf);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);
    gl.bindVertexArray(null);
    // 多重采样的浮点画布 → 解析到一张纹理 → 泛光 + 调色
    const msFB = gl.createFramebuffer(), msC = gl.createRenderbuffer(), msD = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, msC); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, msaa, gl.RGBA16F, W, H);
    gl.bindRenderbuffer(gl.RENDERBUFFER, msD); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, msaa, gl.DEPTH_COMPONENT24, W, H);
    gl.bindFramebuffer(gl.FRAMEBUFFER, msFB);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, msC);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, msD);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('msaa fbo incomplete');
    const target = (w, h) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      for (const k of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      return { fb, tex: t, w, h }; };
    const res = target(W, H), lv = [4, 12].map(s => [target(W / s | 0, H / s | 0), target(W / s | 0, H / s | 0)]);

    const U = (p, n, v) => { const l = p.u[n]; if (l == null) return;
      if (typeof v === 'number') gl.uniform1f(l, v); else if (v.length === 2) gl.uniform2fv(l, v); else if (v.length === 3) gl.uniform3fv(l, v); else if (v.length === 16) gl.uniformMatrix4fv(l, false, v); else gl.uniform4fv(l, v); };
    const TX = (p, n, t, unit) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(p.u[n], unit); };
    const norm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
    const inv = m => new Float32Array(new DOMMatrix(Array.from(m)).inverse().toFloat32Array());
    const draw3 = () => { gl.bindVertexArray(fsqVAO); gl.drawArrays(gl.TRIANGLES, 0, 3); };

    // 这一帧的镜头和光（只算数，不碰 GL）：VP、主光方向、1 世界单位在 1 米外是几个像素、挡光球
    function frame(s) {
      const fov = s.fov ?? 0.5, occ = new Float32Array(40); (s.occ || []).slice(0, 10).forEach((o, i) => occ.set(o, i * 4));
      return { VP: m4.mul(m4.persp(fov, W / H, 0.1, 80), m4.look(s.eye, s.at)), key: norm(s.key ?? [0.45, 0.8, 0.5]), rim: norm(s.rim ?? [-0.5, 0.35, -0.8]),
        px: H / (2 * Math.tan(fov / 2)), occ, amb: s.amb ?? [0.3, 0.3, 0.36], keyCol: s.keyCol ?? [2.3, 2.15, 1.95] };
    }
    // 开始画：清屏、画布景，之后深度测试是开着的
    function begin(s, c) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, msFB); gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST); gl.useProgram(P.bg);
      U(P.bg, 'uIVP', inv(c.VP)); U(P.bg, 'uEye', s.eye); U(P.bg, 'uKey', c.key); U(P.bg, 'uBgA', srgb(s.bg?.[0] ?? '#3a5bff')); U(P.bg, 'uBgB', srgb(s.bg?.[1] ?? '#2038c8'));
      U(P.bg, 'uSpot', s.spot ?? [0.5, 0.55, 0.35]); gl.uniform4fv(P.bg.u.uOcc, c.occ); U(P.bg, 'uShadow', s.shadow ?? 1); U(P.bg, 'uFloorY', s.floor ?? 0); U(P.bg, 'uWall', s.wall ?? -99); U(P.bg, 'uWallMix', s.wallMix ?? 0); U(P.bg, 'uPill', s.pill ?? [0, 0, 0, 0]); U(P.bg, 'uPillCol', srgb(s.pillCol ?? '#cccccc')); U(P.bg, 'uPillOn', s.pillOn ?? 0);
      draw3();
      gl.enable(gl.DEPTH_TEST); gl.bindVertexArray(emptyVAO);
    }
    // 亮珠子（眼睛、鼻子、纽扣）：[x, y, z, 半径, r, g, b, 光泽]
    function beads(list, s, c) {
      if (!list || !list.length) return;
      gl.useProgram(P.bead); gl.bindVertexArray(beadVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, beadBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(list.flat()), gl.DYNAMIC_DRAW);
      const V = m4.look(s.eye, s.at), key = c.key; const kv = norm([V[0] * key[0] + V[4] * key[1] + V[8] * key[2], V[1] * key[0] + V[5] * key[1] + V[9] * key[2], V[2] * key[0] + V[6] * key[1] + V[10] * key[2]]);
      U(P.bead, 'uVP', c.VP); U(P.bead, 'uPx', c.px); U(P.bead, 'uKeyV', kv); U(P.bead, 'uKeyCol', c.keyCol.map(v => v / 2.4));
      gl.drawArrays(gl.POINTS, 0, list.length);
    }
    // 画完：解析多重采样 → 泛光 → 调色 + 暗角 + 颗粒 → 屏幕。返回 VP（给 HUD 把 3D 点投到屏幕上用）
    function end(s, c) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msFB); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, res.fb);
      gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.disable(gl.DEPTH_TEST);
      let src = res.tex, first = true;
      for (const [a, b] of lv) {
        gl.useProgram(P.bright); TX(P.bright, 'src', src, 0); gl.uniform1f(P.bright.u.thr, first ? (s.thr ?? 1.1) : 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, a.fb); gl.viewport(0, 0, a.w, a.h); draw3();
        gl.useProgram(P.blur);
        for (let k = 0; k < 2; k++) {
          TX(P.blur, 'src', a.tex, 0); gl.uniform2f(P.blur.u.dir, 1.3 / a.w, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, b.fb); draw3();
          TX(P.blur, 'src', b.tex, 0); gl.uniform2f(P.blur.u.dir, 0, 1.3 / a.h); gl.bindFramebuffer(gl.FRAMEBUFFER, a.fb); draw3();
        }
        src = a.tex; first = false;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.useProgram(P.comp);
      TX(P.comp, 'src', res.tex, 0); TX(P.comp, 'b1', lv[0][0].tex, 1); TX(P.comp, 'b2', lv[1][0].tex, 2);
      U(P.comp, 'exposure', s.exposure ?? 1); U(P.comp, 'bloom', s.bloom ?? 0.12); U(P.comp, 'grain', s.grain ?? 0.025); U(P.comp, 'vign', s.vignette ?? 0.3);
      U(P.comp, 'sat', s.sat ?? 1.08); U(P.comp, 'seed', (s.t ?? 0) * 7.13 + 1); U(P.comp, 'fade', s.fade ?? 1); U(P.comp, 'res', [W, H]);
      draw3();
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));   // 等这一帧真的画完（finish 在这里不会等）
      return c.VP;
    }
    return { gl, W, H, FSQ_VS, prog: (vs, fs) => prog(gl, vs, fs), ftex, U, TX, draw3, emptyVAO, frame, begin, beads, end };
  }
  return { create };
})();
