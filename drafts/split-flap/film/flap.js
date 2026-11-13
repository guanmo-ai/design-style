// 翻牌墙的 WebGL2 渲染器。每块牌 = 上半张（静止）+ 下半张（静止，可回弹）+ 正在掉的那张 + 一根轴。
// 每一片都是同一个薄盒子，按角度 θ 绕铰链转：θ=0 竖在上面（正面是这张牌的上半），θ=π 落在下面（背面是下一张牌的下半）。
// 运动模糊 + 抗锯齿：一帧渲 S 个子帧（时间和亚像素都抖），累加取平均。每帧是帧号的纯函数。
const FLAP = (() => {
  // —— 尺寸（墙的单位：一格宽 1.0、高 1.3）——
  const DIM = { pitchX: 1.0, pitchY: 1.3, w: 0.9, hh: 0.6, slit: 0.0273, th: 0.012 };
  DIM.r0 = DIM.slit / 2; DIM.L = DIM.hh - DIM.r0;

  const VS = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 aP;      // u∈[-.5,.5] v∈[0,1] s∈[0,1]
  layout(location=1) in float aFace;  // 0 正面 1 背面 2 边
  layout(location=2) in vec4 aI0;     // cx cy θ kind(0 上 1 下 2 掉 3 轴 4 幽灵)
  layout(location=3) in vec4 aI1;     // 正面牌号 背面牌号 影子范围 影子强度
  uniform mat4 uVP; uniform vec4 uDim; // w r0 L th
  out vec2 vUV; out vec3 vN; out vec3 vW; out float vFace; out float vV; out vec4 vI1; out float vKind; out vec2 vLoc; out float vS;
  vec2 cell(float c){ return vec2(mod(c,8.0), floor(c/8.0)); }
  void main(){
    float th = aI0.z, kind = aI0.w;
    vec3 d = vec3(0.0, cos(th), sin(th)), n = vec3(0.0, -sin(th), cos(th));
    float thick = uDim.w * (kind < 1.5 ? 3.0 : 1.0);
    float z0 = kind > 1.5 ? uDim.w * 2.2 : 0.0;
    vec3 P;
    if (kind > 2.5 && kind < 3.5) {          // 轴：沿 x 的细杆，藏在中缝里
      P = vec3(aI0.x + aP.x * (uDim.x + 0.07), aI0.y + (aP.y - 0.5) * 0.02, uDim.w * 1.1 + (aP.z - 0.5) * 0.02);
      n = vec3(0.0, 0.0, 1.0);
    } else {
      float dist = uDim.y + aP.y * uDim.z;
      P = vec3(aI0.x + aP.x * uDim.x, aI0.y, z0) + d * dist + n * (aP.z - 0.5) * thick;
    }
    vec3 N = aFace < 0.5 ? n : (aFace < 1.5 ? -n : vec3(0.0));
    if (aFace > 1.5) {                        // 边：法线从盒子形状推
      N = abs(aP.x) > 0.49 ? vec3(sign(aP.x), 0.0, 0.0) : (aP.y > 0.99 ? d : -d);
    }
    vN = N; vW = P; vFace = aFace; vV = aP.y; vI1 = aI1; vKind = kind; vLoc = aP.xy; vS = aP.z;
    float dist = uDim.y + aP.y * uDim.z, hh = uDim.y + uDim.z;
    float cardY = aFace < 0.5 ? (hh - dist) / (2.0 * hh) : (hh + dist) / (2.0 * hh);
    vec2 c = cell(aFace < 0.5 ? aI1.x : aI1.y);
    vUV = (c + vec2(aP.x + 0.5, cardY)) / vec2(8.0, 6.0);
    gl_Position = uVP * vec4(P, 1.0);
  }`;
  const FS = `#version 300 es
  precision highp float;
  in vec2 vUV; in vec3 vN; in vec3 vW; in float vFace; in float vV; in vec4 vI1; in float vKind; in vec2 vLoc; in float vS;
  uniform sampler2D uAtlas; uniform vec3 uEye; uniform vec4 uLamp; uniform float uGhost; uniform vec3 uGhostCol;
  out vec4 o;
  void main(){
    if (uGhost > 0.5) {                        // 频闪幽灵：只描边
      if (vFace > 0.5) discard;
      float e = min(min(vLoc.x + 0.5, 0.5 - vLoc.x) * 0.9, min(vLoc.y, 1.0 - vLoc.y) * 0.6);
      float a = 1.0 - smoothstep(0.006, 0.016, e);
      if (a < 0.01) discard;
      o = vec4(uGhostCol * a * vI1.z, a * vI1.z); return;
    }
    vec3 base;
    if (vKind > 2.5) base = vec3(0.32, 0.31, 0.30);
    else if (vFace > 1.5) {                    // 卡片的边：深灰塑料，静止的那叠能看出几张
      base = vec3(0.17, 0.165, 0.16);
      if (vKind < 1.5) base *= 0.75 + 0.35 * smoothstep(0.15, 0.35, abs(fract(vS * 3.0) - 0.5));
    } else base = texture(uAtlas, vUV).rgb;
    vec3 N = normalize(vN);
    vec3 Lp = vec3(vW.x, uLamp.x, uLamp.y);    // 顶上一排灯：沿 x 的一条线
    vec3 Ld = Lp - vW; float ld = length(Ld); vec3 L = Ld / ld;
    vec3 V = normalize(uEye - vW), H = normalize(L + V);
    float lam = max(dot(N, L), 0.0);
    float fall = 1.0 / (1.0 + pow(ld / uLamp.z, 2.0));
    float spec = pow(max(dot(N, H), 0.0), 40.0) * 0.45 + pow(max(dot(N, H), 0.0), 6.0) * 0.06;
    float amb = 0.42 + 0.12 * N.z;
    if (vKind > 1.5 && vKind < 2.5) spec *= 2.2;          // 正在掉的那张反着顶光
    if (vKind > 2.5) spec *= 0.12;
    float sh = 1.0;
    if (vKind > 0.5 && vKind < 1.5 && vFace > 0.5 && vFace < 1.5) {   // 正在掉的那张压在下半张上的影子
      sh = 1.0 - vI1.w * (1.0 - smoothstep(vI1.z - 0.25, vI1.z + 0.04, vV));
    }
    float ao = vKind < 2.5 ? 0.78 + 0.22 * smoothstep(0.0, 0.18, vV) : 1.0;
    vec3 col = base * (amb + lam * fall * uLamp.w) * sh * ao + vec3(1.0, 0.97, 0.92) * spec * fall * uLamp.w * sh;
    o = vec4(col, 1.0);
  }`;
  // 背后的机壳：深色，每格一个凹槽
  const BG_VS = `#version 300 es
  layout(location=0) in vec2 aQ; uniform mat4 uVP; out vec2 vW;
  void main(){ vW = aQ * vec2(48.0, 30.0); gl_Position = uVP * vec4(vW, -0.03, 1.0); }`;
  const BG_FS = `#version 300 es
  precision highp float; in vec2 vW; uniform vec4 uLamp; out vec4 o;
  void main(){
    vec2 g = vec2(vW.x / 1.0 + 0.5, vW.y / 1.3);
    vec2 f = abs(fract(g) - 0.5);
    float inner = step(abs(vW.x), 30.0) * step(abs(vW.y), 16.9);
    float rim = smoothstep(0.43, 0.47, f.x) + smoothstep(0.44, 0.48, f.y);
    float fall = 1.0 / (1.0 + pow(length(vec2(0.0, uLamp.x - vW.y)) / uLamp.z, 2.0));
    vec3 c = mix(vec3(0.028), vec3(0.05 + 0.03 * clamp(rim, 0.0, 1.0)), inner) * (0.6 + 1.2 * fall);
    o = vec4(c, 1.0);
  }`;
  const ACC_FS = `#version 300 es
  precision highp float; uniform sampler2D uT; uniform float uW; in vec2 vT; out vec4 o;
  void main(){ o = vec4(texture(uT, vT).rgb * uW, uW); }`;
  const Q_VS = `#version 300 es
  layout(location=0) in vec2 aQ; out vec2 vT; void main(){ vT = aQ * 0.5 + 0.5; gl_Position = vec4(aQ, 0.0, 1.0); }`;
  const BLUR_FS = `#version 300 es
  precision highp float; uniform sampler2D uT; uniform vec2 uD; uniform float uThr; in vec2 vT; out vec4 o;
  void main(){ vec3 s = vec3(0.0); float w[5] = float[](0.227, 0.194, 0.121, 0.054, 0.016);
    for (int i = -4; i <= 4; i++) { vec3 c = texture(uT, vT + uD * float(i)).rgb; s += max(c - uThr, 0.0) * w[abs(i)]; }
    o = vec4(s, 1.0); }`;
  const POST_FS = `#version 300 es
  precision highp float; uniform sampler2D uT; uniform sampler2D uB; uniform float uBloom; uniform float uSeed; uniform float uExpo; in vec2 vT; out vec4 o;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed) * 43758.5453); }
  void main(){
    vec3 c = texture(uT, vT).rgb * uExpo + texture(uB, vT).rgb * uBloom;
    vec2 q = vT - 0.5; float vig = 1.0 - 0.55 * dot(q * vec2(1.0, 1.25), q * vec2(1.0, 1.25));
    c *= vig;
    c = c / (1.0 + 0.18 * c);                         // 软肩
    c = pow(c, vec3(0.96, 0.98, 1.02));
    c += (h(gl_FragCoord.xy) - 0.5) * 0.012;
    o = vec4(c, 1.0);
  }`;

  function prog(gl, vs, fs) {
    const p = gl.createProgram();
    for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      gl.attachShader(p, sh);
    }
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    return { p, u };
  }

  // 盒子：6 个面，面号 0 正面(s=1) 1 背面(s=0) 2 边
  function boxMesh() {
    const V = [], F = [], I = [];
    const quad = (a, b, c, d, face) => { const k = V.length / 3; V.push(...a, ...b, ...c, ...d); F.push(face, face, face, face); I.push(k, k + 1, k + 2, k, k + 2, k + 3); };
    const p = (u, v, s) => [u, v, s];
    quad(p(-.5, 0, 1), p(.5, 0, 1), p(.5, 1, 1), p(-.5, 1, 1), 0);
    quad(p(-.5, 0, 0), p(-.5, 1, 0), p(.5, 1, 0), p(.5, 0, 0), 1);
    quad(p(-.5, 1, 0), p(-.5, 1, 1), p(.5, 1, 1), p(.5, 1, 0), 2);   // 尖
    quad(p(-.5, 0, 0), p(.5, 0, 0), p(.5, 0, 1), p(-.5, 0, 1), 2);   // 铰链那头
    quad(p(-.5, 0, 0), p(-.5, 0, 1), p(-.5, 1, 1), p(-.5, 1, 0), 2);
    quad(p(.5, 0, 0), p(.5, 1, 0), p(.5, 1, 1), p(.5, 0, 1), 2);
    return { V: new Float32Array(V), F: new Float32Array(F), I: new Uint16Array(I) };
  }

  // —— 矩阵 ——
  const M4 = {
    persp(fy, a, n, f, jx = 0, jy = 0) { const t = 1 / Math.tan(fy / 2); return [t / a, 0, 0, 0, 0, t, 0, 0, jx, jy, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; },
    look(e, c, up) {
      const z = norm(sub(e, c)), x = norm(cross(up, z)), y = cross(z, x);
      return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1];
    },
    mul(a, b) { const o = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; },
  };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };

  function create(canvas, atlasCanvas, opt = {}) {
    const W = canvas.width, H = canvas.height;
    const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
    const half = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float');
    const P = prog(gl, VS, FS), BG = prog(gl, BG_VS, BG_FS), ACC = prog(gl, Q_VS, ACC_FS), BL = prog(gl, Q_VS, BLUR_FS), PO = prog(gl, Q_VS, POST_FS);
    const box = boxMesh();
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const buf = (data, loc, size, div = 0) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(loc, div); return b; };
    buf(box.V, 0, 3); buf(box.F, 1, 1);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, box.I, gl.STATIC_DRAW);
    const inst = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, inst);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 0); gl.vertexAttribDivisor(2, 1);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 32, 16); gl.vertexAttribDivisor(3, 1);
    const qvao = gl.createVertexArray(); gl.bindVertexArray(qvao);
    const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const atlas = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, atlas);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const an = gl.getExtension('EXT_texture_filter_anisotropic'); if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 8);

    const tex = (w, h, fl) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      if (fl && half) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
    const fbo = (t, depth) => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      if (depth) { const r = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, r); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, W, H); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, r); }
      return f; };
    const tScene = tex(W, H, true), fScene = fbo(tScene, true);
    const tAcc = tex(W, H, true), fAcc = fbo(tAcc, false);
    const bw = W >> 2, bh = H >> 2;
    const tB1 = tex(bw, bh, true), fB1 = fbo(tB1), tB2 = tex(bw, bh, true), fB2 = fbo(tB2);

    let data = new Float32Array(8 * 8000);
    function camera(cam, jx = 0, jy = 0) {
      const proj = M4.persp(cam.fov, W / H, 0.05, 400, jx, jy);
      return M4.mul(proj, M4.look(cam.eye, cam.target, cam.up || [0, 1, 0]));
    }
    // pieces: Float32Array（每片 8 个数），n 片；ghosts 同格式
    function drawScene(VP, cam, pieces, n, ghosts, ng, lamp) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fScene); gl.viewport(0, 0, W, H);
      gl.clearColor(0.02, 0.02, 0.02, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      gl.useProgram(BG.p); gl.uniformMatrix4fv(BG.u.uVP, false, VP); gl.uniform4fv(BG.u.uLamp, lamp);
      gl.bindVertexArray(qvao); gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.useProgram(P.p); gl.uniformMatrix4fv(P.u.uVP, false, VP);
      gl.uniform4f(P.u.uDim, DIM.w, DIM.r0, DIM.L, DIM.th); gl.uniform3fv(P.u.uEye, cam.eye); gl.uniform4fv(P.u.uLamp, lamp);
      gl.uniform1i(P.u.uAtlas, 0); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, inst);
      gl.uniform1f(P.u.uGhost, 0);
      gl.bufferData(gl.ARRAY_BUFFER, pieces.subarray(0, n * 8), gl.DYNAMIC_DRAW);
      gl.drawElementsInstanced(gl.TRIANGLES, box.I.length, gl.UNSIGNED_SHORT, 0, n);
      if (ng > 0) {
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
        gl.uniform1f(P.u.uGhost, 1); gl.uniform3f(P.u.uGhostCol, 1.0, 0.83, 0.0);
        gl.bufferData(gl.ARRAY_BUFFER, ghosts.subarray(0, ng * 8), gl.DYNAMIC_DRAW);
        gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, ng);
        gl.depthMask(true); gl.disable(gl.BLEND);
      }
    }
    // 一帧：sub(i) 返回 {cam, pieces, n, ghosts, ng, lamp}
    function render(S, sub, post = {}) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fAcc); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      const R2 = [[0.25, 0.75], [0.75, 0.25], [0.125, 0.375], [0.625, 0.875], [0.375, 0.125], [0.875, 0.625], [0.5, 0.5], [0.0625, 0.9375], [0.5625, 0.4375], [0.3125, 0.6875], [0.8125, 0.1875], [0.1875, 0.5625]];
      for (let i = 0; i < S; i++) {
        const s = sub(i);
        const j = R2[i % R2.length];
        const VP = camera(s.cam, (j[0] - 0.5) * 2 / W, (j[1] - 0.5) * 2 / H);
        drawScene(VP, s.cam, s.pieces, s.n, s.ghosts, s.ng, s.lamp);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fAcc); gl.viewport(0, 0, W, H); gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(ACC.p); gl.uniform1f(ACC.u.uW, 1 / S); gl.uniform1i(ACC.u.uT, 0); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tScene);
        gl.bindVertexArray(qvao); gl.drawArrays(gl.TRIANGLES, 0, 6); gl.disable(gl.BLEND);
      }
      // 泛光
      gl.useProgram(BL.p); gl.bindVertexArray(qvao);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fB1); gl.viewport(0, 0, bw, bh); gl.bindTexture(gl.TEXTURE_2D, tAcc);
      gl.uniform1i(BL.u.uT, 0); gl.uniform2f(BL.u.uD, 2.5 / W * 4 / 4, 0); gl.uniform1f(BL.u.uThr, 0.55); gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fB2); gl.bindTexture(gl.TEXTURE_2D, tB1); gl.uniform2f(BL.u.uD, 0, 2.5 / H * 4 / 4 * 1.0); gl.uniform1f(BL.u.uThr, 0.0); gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fB1); gl.bindTexture(gl.TEXTURE_2D, tB2); gl.uniform2f(BL.u.uD, 5.0 / W * 4 / 4, 0); gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fB2); gl.bindTexture(gl.TEXTURE_2D, tB1); gl.uniform2f(BL.u.uD, 0, 5.0 / H); gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
      gl.useProgram(PO.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tAcc); gl.uniform1i(PO.u.uT, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tB2); gl.uniform1i(PO.u.uB, 1);
      gl.uniform1f(PO.u.uBloom, post.bloom ?? 0.5); gl.uniform1f(PO.u.uSeed, post.seed ?? 0); gl.uniform1f(PO.u.uExpo, post.expo ?? 1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.activeTexture(gl.TEXTURE0);
      gl.finish();
    }
    return { gl, render, camera, DIM, W, H };
  }
  return { create, DIM, M4 };
})();
