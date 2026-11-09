// 赛璐璐 v4 · 三维卡通字（WebGL2 光线步进，无贴图素材）
// 文字先在画布上写出来 → 精确欧氏距离变换得到 2D 距离场 → 沿 z 挤出成 3D 字 → 光线步进；
// 正面三阶红、侧面三阶蓝，正面与侧面的交界 + 轮廓画墨线，暗部叠网点；
// 背景是黄底放射速度线；冲击帧把画面反相成黑白，只留红字。
// MODE：0 成片 · 1 距离场 · 2 挤出（普通灯光）· 3 三阶上色 · 4 上色 + 描线 + 网点（纯色底）
// BG：0 漫画背景 · 1 纯色 BGC · 2 透明（贴纸）
(function (G) {
  const VS = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

  const FS = `#version 300 es
  precision highp float;
  uniform vec2 R;
  uniform sampler2D SDF;
  uniform vec2 TS;
  uniform float PXW;
  uniform float DEPTH;
  uniform mat3 RI;
  uniform vec3 POS;
  uniform vec3 SQ;
  uniform vec3 CAM;
  uniform vec3 TGT;
  uniform float FOV;
  uniform int MODE;
  uniform int BG;
  uniform vec3 BGC;
  uniform float IMPACT;
  uniform float FLASH;
  uniform float BURST;
  uniform float SLA;
  uniform vec2 CEN;
  uniform float TIME;
  uniform float BARS;
  uniform float LW;
  uniform float THICK;
  out vec4 o;

  const vec3 YEL = vec3(1., .824, .247);
  const vec3 YDK = vec3(.95, .69, .07);
  const vec3 CREAM = vec3(1., .953, .69);
  const vec3 INK = vec3(.078, .078, .169);
  const vec3 WHITE = vec3(1., .992, .961);
  const vec3 REDL = vec3(1., .42, .40);
  const vec3 RED = vec3(1., .231, .278);
  const vec3 REDD = vec3(.66, .07, .23);
  const vec3 BLUE = vec3(.18, .42, 1.);
  const vec3 BLUED = vec3(.12, .24, .72);
  const vec3 NAVY = vec3(.09, .09, .34);

  float h1(float n){ return fract(sin(n * 127.1 + .3) * 43758.5453); }
  float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // 2D 距离场：贴图里存的是像素距离，乘 PXW 换成世界单位；贴图外面再加到包围框的距离
  float sd2(vec2 p){
    vec2 uv = p / TS + .5;
    uv.y = 1. - uv.y;
    vec2 c = clamp(uv, vec2(.002), vec2(.998));
    float d = texture(SDF, c).r * PXW - THICK;
    vec2 q = abs(p) - TS * .5;
    return d + length(max(q, 0.));
  }
  // 挤出：2D 距离 × 厚度方向，倒一点圆角
  float sdText(vec3 q){
    float d = sd2(q.xy);
    vec2 w = vec2(d, abs(q.z) - DEPTH);
    return min(max(w.x, w.y), 0.) + length(max(w, 0.)) - .015;
  }
  float map(vec3 p){
    vec3 q = RI * (p - POS);
    q /= SQ;
    float s = min(SQ.x, min(SQ.y, SQ.z));
    vec3 b = abs(q) - vec3(TS * .5 + .05, DEPTH + .05);
    float db = length(max(b, 0.)) + min(max(b.x, max(b.y, b.z)), 0.);
    if (db > .3) return db * s;
    return sdText(q) * s;
  }
  vec3 nrm(vec3 p){
    vec2 e = vec2(.002, 0.);
    return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
  }

  vec3 comicBG(vec2 uv){
    float r = length(uv), ab = atan(uv.y, uv.x);
    vec3 c = YEL;
    vec2 g = fract(gl_FragCoord.xy / 12.) - .5;
    float dr = .07 + .25 * smoothstep(.3, 1.4, r);
    if (length(g) < dr) c = YDK;
    float jag = (.34 + .10 * BURST) + .035 * sin(ab * 17. + TIME * 2.) + .02 * sin(ab * 41.);
    if (r < jag * (.7 + .5 * BURST)) c = CREAM;
    float tt = (ab / 6.2831853 + .5) * 80.;
    float seg = floor(tt), f = fract(tt);
    float hv = h1(seg);
    if (hv > 1. - SLA) {
      float st = .30 + h1(seg + 17.) * .35;
      float hw = .05 * (1. - smoothstep(.4, 1.5, r));
      c = mix(c, INK, smoothstep(hw + .012, hw - .012, abs(f - .5)) * step(st, r));
    }
    return c;
  }

  void main(){
    vec2 px = gl_FragCoord.xy;
    vec2 uv = (px - .5 * R) / R.y;
    float asp = R.x / R.y;
    vec3 col = BG == 0 ? comicBG(uv - (CEN - .5) * vec2(asp, 1.)) : BGC;
    float alpha = BG == 2 ? 0. : 1.;

    if (MODE == 1) {
      // 距离场可视化：红 = 字内，蓝色等距线 = 字外，墨线 = 0 等值线
      vec2 p = uv * TS.y * 1.25;
      float d = sd2(p);
      float band = fract(d / .12);
      col = d < 0. ? mix(REDD, RED, smoothstep(-.35, 0., d)) : mix(BGC, vec3(.62, .70, 1.), exp(-d * 1.6));
      float ln = smoothstep(.43, .47, abs(band - .5));
      col = mix(col, d > 0. ? BLUE : REDL, ln * (d > 0. ? .6 * exp(-d * .7) : .7));
      col = mix(col, INK, smoothstep(.02, .008, abs(d)));
      o = vec4(col, 1.);
      return;
    }

    vec3 f = normalize(TGT - CAM);
    vec3 rr = normalize(cross(f, vec3(0., 1., 0.)));
    vec3 u = cross(rr, f);
    vec3 rd = normalize(f * FOV + uv.x * rr + uv.y * u);
    float t = 0.;
    bool hit = false;
    for (int i = 0; i < 150; i++) {
      float d = map(CAM + rd * t);
      if (d < .0012) { hit = true; break; }
      t += d * .75;
      if (t > 40.) break;
    }
    if (hit) {
      vec3 p = CAM + rd * t;
      vec3 n = nrm(p);
      vec3 no = RI * n;
      vec3 q = (RI * (p - POS)) / SQ;
      vec3 L = normalize(vec3(.42, .78, .62));
      float ndl = dot(n, L);
      float sh = 1.;
      float ts = .05;
      for (int i = 0; i < 40; i++) {
        float d = map(p + n * .004 + L * ts);
        if (d < .001) { sh = 0.; break; }
        ts += max(d, .02) * .9;
        if (ts > 6.) break;
      }
      float lit = ndl * sh;
      bool front = abs(no.z) > .55;
      vec3 c;
      if (MODE == 2) {
        c = vec3(.16) + vec3(.76) * max(lit, 0.) + .06 * n.y;
      } else {
        if (front) c = lit > .62 ? REDL : (lit > .12 ? RED : REDD);
        else c = lit > .45 ? BLUE : (lit > .05 ? BLUED : NAVY);
        float sp = pow(max(dot(reflect(rd, n), L), 0.), 28.);
        if (front && sp > .5) c = WHITE;
        if (MODE == 0 || MODE == 4) {
          if (lit < .12) { vec2 g = fract(px / 9.) - .5; if (length(g) < .3) c *= .62; }
          float d2 = sd2(q.xy);
          if (front) {
            // 漫画高光：两道斜向亮带 + 左上内侧一道白色反光线
            float k = q.x * .55 + q.y;
            if (abs(k - .95) < .085 || abs(k - .62) < .035) c = REDL;
            vec2 e = vec2(.01, 0.);
            vec2 gr = vec2(sd2(q.xy + e.xy) - sd2(q.xy - e.xy), sd2(q.xy + e.yx) - sd2(q.xy - e.yx));
            gr = normalize(gr + 1e-5);
            if (d2 < -LW * 1.7 && d2 > -LW * 2.6 && dot(gr, vec2(-.7, .7)) > .45) c = WHITE;
          }
          float dz = abs(q.z) - DEPTH;
          bool edge = abs(d2) < LW * 1.2 && abs(dz) < LW;
          bool sil = dot(n, -rd) < .2;
          if (edge || sil) c = INK;
        }
      }
      col = c;
      alpha = 1.;
    }

    if (MODE == 0) {
      if (IMPACT > 0.) {
        float lum = dot(col, vec3(.3, .59, .11));
        vec3 bw = lum > .55 ? INK : WHITE;
        bool redish = col.r > .6 && col.g < .45 && col.b < .45;
        col = mix(col, redish ? RED : bw, IMPACT);
      }
      col = mix(col, WHITE, FLASH);
      if (abs(uv.y) > .5 - .11 * BARS) col = INK;
      if (BG == 0) {
        col *= 1. - .18 * dot(uv, uv);
        col += (h2(px + TIME * 61.) - .5) * .025;
      }
    }
    o = vec4(clamp(col, 0., 1.), alpha);
  }`;

  const sdfCache = {};
  function buildSDF(text, font, W, H) {
    const key = text + '|' + font + '|' + W + 'x' + H;
    if (sdfCache[key]) return sdfCache[key];
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    let size = H * .9;
    x.font = `${size}px "${font}"`;
    const w = x.measureText(text).width;
    size = Math.min(size, size * (W * .88) / w);
    x.font = `${size}px "${font}"`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = '#fff';
    x.fillText(text, W / 2, H / 2 + size * .04);
    const img = x.getImageData(0, 0, W, H).data;
    const a = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) a[i] = img[i * 4 + 3];
    const sdf = G.GLK.sdfFromAlpha(a, W, H);
    G.GLK.blurField(sdf, W, H, 1.2);
    return (sdfCache[key] = sdf);
  }

  function rows(rx, ry, rz) {
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    const Rx = [[1, 0, 0], [0, cx, -sx], [0, sx, cx]], Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], Rz = [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]];
    const mul = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
    const M = mul(mul(Ry, Rx), Rz);
    // GLSL 按列读：把 R 的行依次放进去，读出来就是 Rᵀ = R⁻¹
    return new Float32Array([M[0][0], M[0][1], M[0][2], M[1][0], M[1][1], M[1][2], M[2][0], M[2][1], M[2][2]]);
  }

  function setup(canvas, o) {
    if (canvas._ct) return canvas._ct;
    const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
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
    const W = 1024, H = 512;
    const sdf = buildSDF(o.text || '咔!', o.font || 'ZCOOL QingKe HuangYou', W, H);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, W, H, 0, gl.RED, gl.FLOAT, sdf);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const U = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const inf = gl.getActiveUniform(p, i); U[inf.name] = gl.getUniformLocation(p, inf.name); }
    const TSx = 4.0, TSy = 2.0;
    gl.uniform2f(U.TS, TSx, TSy);
    gl.uniform1f(U.PXW, TSx / W);
    gl.uniform1i(U.SDF, 0);
    return (canvas._ct = { gl, U });
  }

  // o: { text, font, mode, bg, bgc:[r,g,b], depth, rot:[x,y,z], pos:[x,y,z], sq:[x,y,z], cam:[x,y,z], tgt:[x,y,z], fov,
  //      impact, flash, burst, sla, cen:[x,y], time, bars, lw }
  function paint(canvas, o) {
    const { gl, U } = setup(canvas, o);
    const r = o.rot || [.12, -.45, .06];
    gl.uniform2f(U.R, canvas.width, canvas.height);
    gl.uniform1f(U.DEPTH, o.depth == null ? .34 : o.depth);
    gl.uniformMatrix3fv(U.RI, false, rows(r[0], r[1], r[2]));
    gl.uniform3fv(U.POS, o.pos || [0, 0, 0]);
    gl.uniform3fv(U.SQ, o.sq || [1, 1, 1]);
    gl.uniform3fv(U.CAM, o.cam || [1.4, -1.5, 7.2]);
    gl.uniform3fv(U.TGT, o.tgt || [0, .15, 0]);
    gl.uniform1f(U.FOV, o.fov || 1.9);
    gl.uniform1i(U.MODE, o.mode || 0);
    gl.uniform1i(U.BG, o.bg || 0);
    gl.uniform3fv(U.BGC, o.bgc || [1, .992, .961]);
    gl.uniform1f(U.IMPACT, o.impact || 0);
    gl.uniform1f(U.FLASH, o.flash || 0);
    gl.uniform1f(U.BURST, o.burst == null ? 1 : o.burst);
    gl.uniform1f(U.SLA, o.sla == null ? .7 : o.sla);
    gl.uniform2fv(U.CEN, o.cen || [.5, .5]);
    gl.uniform1f(U.TIME, o.time || 0);
    gl.uniform1f(U.BARS, o.bars || 0);
    gl.uniform1f(U.LW, o.lw || .035);
    gl.uniform1f(U.THICK, o.thick == null ? .07 : o.thick);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  }

  G.CelType = { paint };
})(window);
