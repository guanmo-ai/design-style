// fur.js — 毛绒渲染器（专用组件：毛、草、地毯、毛线、羽毛这类“很多根细东西”才用得上）。依赖 kit/motion.js + kit/stage.js。
// 一根毛 = 一条带锥度的细带；整片从头到尾是同一批 N 根毛。
// 两步：① 每根毛算一次（片元着色器，一根毛一个像素）：落在哪、朝哪、被弹簧甩到哪、什么颜色、亮不亮；② 每根毛画成 2(K+1) 个顶点的细带。
// 用法：const F = FUR.create(STAGE.create(canvas), { rows: 400 }); F.tone(…); F.addShape(名字, SHAPES.fromPrims(F.N, …)); 每帧 F.setPart(…) 再 F.render(s)。
const FUR = (() => {
  const { m4, srgb, springKernel } = KIT;

  const SIM_FS = `#version 300 es
  precision highp float; precision highp sampler2D;
  uniform sampler2D uA0, uA1, uB0, uB1, uRnd;
  vec4 aA, aNA, aB, aNB, aR;
  uniform sampler2D uMat, uPal;
  uniform float uT, uLen, uWidth;
  uniform vec4 uMorph;                 // 进度·(1+spread), spread, 弧高, 波前方向的权重（0 = 随机先后）
  uniform vec3 uMorphDir;              // 波从哪边扫过来
  uniform vec4 uGrowA, uGrowB;         // 生长波：dir.xyz · 位置 < w 的地方已经长出来
  uniform vec4 uWind;                  // 方向.xyz, 强度
  uniform vec4 uPush[4];               // 把毛拨开的球：位置.xyz, 半径（<=0 关）
  uniform vec4 uOcc[10];               // 挡光的球：位置.xyz, 半径
  uniform vec3 uKey, uEye, uGrav;
  uniform float uSpring, uFrizz, uFlat, uClump, uClumpSize, uVar;
  layout(location=0) out vec4 o0; layout(location=1) out vec4 o1; layout(location=2) out vec4 o2;
  layout(location=3) out vec4 o3; layout(location=4) out vec4 o4; layout(location=5) out vec4 o5;
  mat4 M(float part, int k){ int b = int(part)*16 + k*4;
    return mat4(texelFetch(uMat, ivec2(b,0),0), texelFetch(uMat, ivec2(b+1,0),0), texelFetch(uMat, ivec2(b+2,0),0), texelFetch(uMat, ivec2(b+3,0),0)); }
  mat3 NM(float part){ int b = int(part)*16 + 12;
    return mat3(texelFetch(uMat, ivec2(b,0),0).xyz, texelFetch(uMat, ivec2(b+1,0),0).xyz, texelFetch(uMat, ivec2(b+2,0),0).xyz); }
  float h3(vec3 p){ p = fract(p*vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y)*p.z); }
  vec4 tuft(vec3 p){                                            // 值噪声：xyz = 这一撮往哪倒，w = 这一撮的深浅
    vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); vec4 a = vec4(0.);
    for (int k=0;k<8;k++){ vec3 o = vec3(float(k&1), float((k>>1)&1), float((k>>2)&1)); vec3 c = i + o;
      vec3 w3 = mix(1.0-f, f, o); float w = w3.x*w3.y*w3.z;
      a += w*vec4(h3(c), h3(c+7.1), h3(c+13.7), h3(c+29.3)); }
    return a*2.0 - 1.0; }
  struct Root { vec3 p; vec3 n; vec3 lag; float grow; vec3 cr; vec3 ct; vec4 q; };
  Root root(vec4 a, vec4 an, vec4 gw){
    Root r; vec4 P = vec4(a.xyz, 1.0);
    r.p = (M(a.w,0)*P).xyz;
    vec3 soft = (M(a.w,1)*P).xyz, stiff = (M(a.w,2)*P).xyz;
    r.lag = mix(stiff, soft, aR.y) - r.p;                       // 弹簧滤过的身体 − 现在的身体 = 毛尖被甩开多远
    r.n = normalize(NM(a.w)*an.xyz);
    vec4 ex = texelFetch(uMat, ivec2(int(a.w)*16+15, 0), 0);
    float wave = clamp((gw.w - dot(a.xyz, gw.xyz))*6.0 - aR.z*0.6, 0.0, 1.4);
    wave = wave < 1.0 ? wave*wave*(3.0-2.0*wave) : 1.0 + 0.22*sin((wave-1.0)*7.85)*(1.4-wave)/0.4;   // 长过头一点再缩回来
    r.grow = ex.x * wave;
    int t = int(an.w)*4;
    vec4 c0 = texelFetch(uPal, ivec2(0, int(an.w)),0), c1 = texelFetch(uPal, ivec2(1, int(an.w)),0);
    r.cr = c0.rgb; r.ct = c1.rgb; r.q = vec4(c0.a*ex.y, c1.a, texelFetch(uPal, ivec2(2, int(an.w)),0).xy);   // 长度, 卷度, 光泽, 下垂
    return r;
  }
  void main(){
    ivec2 ij = ivec2(gl_FragCoord.xy);
    aA = texelFetch(uA0, ij, 0); aNA = texelFetch(uA1, ij, 0); aB = texelFetch(uB0, ij, 0); aNB = texelFetch(uB1, ij, 0); aR = texelFetch(uRnd, ij, 0);
    float d = mix(aR.x, clamp(dot(aA.xyz, uMorphDir)*0.5+0.5, 0., 1.), uMorph.w);
    float u = uMorph.x - d*uMorph.y;
    float e = clamp(u, 0., 1.); e = e*e*(3.-2.*e);
    Root r = root(aA, aNA, uGrowA);
    float fly = 0.0; vec3 vel = vec3(0.);
    if (u > 0.0) {
      Root b = root(aB, aNB, uGrowB);
      if (u < 1.0) {
        fly = sin(3.14159*e);
        vec3 dp = b.p - r.p; float dl = length(dp) + 1e-5;
        vec3 side = normalize(cross(dp, vec3(aR.z-0.5, aR.w-0.5, aR.y-0.5)) + 1e-5);
        vec3 arc = (side*(0.35+aR.w) + vec3(0., 0.6, 0.))*uMorph.z*fly*min(dl, 2.0);
        vel = normalize(dp/dl + side*cos(3.14159*e)*uMorph.z);
        r.p = mix(r.p, b.p, e) + arc; r.n = normalize(mix(r.n, b.n, e)); r.lag = mix(r.lag, b.lag, e);
        r.grow = mix(r.grow, b.grow, e); r.cr = mix(r.cr, b.cr, e); r.ct = mix(r.ct, b.ct, e); r.q = mix(r.q, b.q, e);
      } else {
        float tl = (u - 1.0);                                   // 落定以后：整根毛“噗”地蓬一下
        b.grow *= 1.0 + 0.35*exp(-tl*9.0)*cos(tl*30.0);
        r = b;
      }
    }
    vec4 tf = tuft(aA.xyz/uClumpSize + aA.w*19.0)*0.65 + tuft(aA.xyz/(uClumpSize*0.37) + 5.0)*0.35;
    float L = uLen * r.q.x * r.grow * (1.0 + (0.56*aR.w - 0.28)*uVar) * (1.0 + 0.35*tf.w*uClump) * (1.0 - 0.45*fly);
    vec3 jit = vec3(aR.x, aR.y, aR.z)*2.0 - 1.0;
    vec3 d0 = normalize(r.n*(1.0-uFlat) + uGrav*r.q.w + jit*uFrizz + tf.xyz*uClump*(1.0-fly) - vel*fly*1.6);
    float tint = 1.0 + 0.16*tf.w*uClump + 0.14*(aR.z - 0.5)*uVar;
    // 弯：弹簧（甩）+ 风 + 被拨开
    vec3 bend = r.lag*uSpring / max(L, 1e-4);
    float ph = dot(r.p, vec3(1.7, 0.9, 1.3));
    vec3 wd = uWind.xyz*uWind.w*(0.55 + 0.45*sin(ph*1.3 - uT*5.1) + 0.3*sin(ph*3.1 + uT*8.3 + aR.x*6.28));
    wd += cross(uWind.xyz, vec3(0.,1.,0.))*uWind.w*0.35*sin(ph*2.2 - uT*6.7 + aR.z*3.0);
    bend += wd;
    for (int i=0;i<4;i++){ if (uPush[i].w > 0.0){ vec3 dv = (r.p + d0*L*0.6) - uPush[i].xyz; float dd = length(dv);
      float k = clamp(1.0 - dd/uPush[i].w, 0., 1.); bend += normalize(dv + r.n*0.001)*k*k*2.6; } }
    bend -= d0*dot(bend, d0)*0.85;                              // 只留垂直于毛的部分：毛会弯，不会变长
    float bl = length(bend); if (bl > 1.6) bend *= 1.6/bl;
    // 这一撮的明暗（按身体的法线算）：主光、被别的球挡住、挤在一起的地方暗
    float nl = dot(r.n, uKey);
    float vis = smoothstep(-0.3, 0.65, nl), ao = 1.0;
    for (int i=0;i<10;i++){ if (uOcc[i].w > 0.0){
      vec3 oc = uOcc[i].xyz - r.p; float t = dot(oc, uKey); float rr = uOcc[i].w;
      float dist = length(oc - uKey*t); float inside = length(oc)/rr;
      if (inside > 1.02) { if (t > 0.0) vis *= mix(1.0, smoothstep(rr*0.75, rr*(1.05 + 0.25*t/rr), dist), 0.85);
        ao *= 1.0 - 0.5*clamp(1.0 - (length(oc)-rr)/(rr*0.9), 0., 1.)*clamp(dot(normalize(oc), r.n)*0.5+0.6, 0., 1.); } } }
    o0 = vec4(r.p, L);
    o1 = vec4(d0, uWidth*(0.75 + 0.5*aR.z));
    o2 = vec4(bend, r.q.y*(0.5 + aR.x));
    o3 = vec4(r.cr*tint, vis);
    o4 = vec4(r.ct*tint, ao);
    o5 = vec4(r.n, r.q.z + floor(aR.y*255.0)*4.0);              // 法线, 光泽 + 一个随机相位
  }`;

  const HAIR_VS = `#version 300 es
  precision highp float;
  precision highp sampler2D;
  uniform sampler2D uS0, uS1, uS2, uS3, uS4, uS5; uniform int uK, uTW;
  uniform mat4 uVP; uniform vec3 uEye, uKey, uKeyCol, uAmb, uRim, uRimCol, uFill;
  uniform float uPx, uMinPx, uDeep, uTip, uCull;
  centroid out vec3 vCol; centroid out float vSide;             // centroid：细带只盖住半个像素时，别拿像素中心去外推颜色（会出彩色坏点）
  void main(){
    int VPS = 2*uK + 2, id = gl_VertexID / VPS, kk = gl_VertexID - id*VPS;             // 一根毛 2(K+1) 个顶点，三角形靠索引拼
    ivec2 ij = ivec2(id % uTW, id / uTW);
    vec4 i0 = texelFetch(uS0, ij, 0), i1 = texelFetch(uS1, ij, 0), i2 = texelFetch(uS2, ij, 0), i3 = texelFetch(uS3, ij, 0), i4 = texelFetch(uS4, ij, 0), i5 = texelFetch(uS5, ij, 0);
    vec2 aS = vec2(float(kk/2)/float(uK), (kk & 1) == 0 ? -1.0 : 1.0);
    float s = aS.x*0.998 + 0.002, L = i0.w;                      // 不取 0：pow(0, y) 在软件渲染里会出坏点
    float phase = floor(i5.w/4.0)*0.0246, gloss = mod(i5.w, 4.0);
    vec3 d0 = i1.xyz, bend = i2.xyz, N = i5.xyz;
    vec3 ax = normalize(cross(d0, vec3(0.31, 0.83, 0.46)) + 1e-4), ay = cross(d0, ax);
    float ca = i2.w, w1 = 5.0 + phase*3.0, a1 = s*w1 + phase*40.0;
    vec3 curl = (ax*sin(a1) + ay*cos(a1*0.83 + 1.0))*ca*s;
    vec3 dcurl = (ax*(sin(a1) + s*w1*cos(a1)) + ay*(cos(a1*0.83+1.0) - s*w1*0.83*sin(a1*0.83+1.0)))*ca;
    vec3 p = i0.xyz + L*(d0*s + bend*s*s + curl);
    vec3 T = normalize(d0 + bend*2.0*s + dcurl);
    vec3 V = normalize(uEye - p);
    vec4 clip = uVP*vec4(p, 1.0);
    float wpx = i1.w*uPx/max(clip.w, 0.05);                      // 这根毛在屏幕上有几个像素宽
    float taper = 1.0 - (1.0-uTip)*pow(s, 1.6);
    float wworld = i1.w*taper*max(1.0, uMinPx/max(wpx*taper, 1e-3));
    vec3 side = normalize(cross(T, V) + 1e-5);
    p += side*aS.y*wworld*0.5;
    gl_Position = uVP*vec4(p, 1.0);
    if (L < 1e-4 || dot(N, normalize(uEye - i0.xyz)) < uCull) gl_Position = vec4(2., 2., 2., 1.);   // 背面的毛看不见，不画（省一半时间）
    // —— 光：Kajiya–Kay（1989）。漫反射 = sin(T, L)，高光 = sin(T, H)^n：高光是一条垂直于毛的亮带 ——
    float TL = dot(T, uKey), dif = sqrt(max(1.0 - TL*TL, 0.0));
    vec3 H = normalize(uKey + V); float TH = dot(T, H), sth = sqrt(max(1.0 - TH*TH, 0.0));
    float depth = mix(uDeep, 1.0, pow(s, 0.75));                // 根深：越靠根越照不到
    float vis = i3.w, ao = i4.w;
    vec3 col = mix(i3.rgb, i4.rgb, pow(s, 0.9));                // 尖浅
    float wrap = mix(0.5, 1.0, dif);
    vec3 lit = uKeyCol*vis*wrap*depth + uAmb*ao*mix(0.35, 1.0, s) + uFill*(0.5 + 0.5*N.y)*ao*depth;
    vec3 c = col*lit; c = mix(c, c*col*2.2, (1.0 - vis*depth)*0.45);
    c += uKeyCol*vis*(pow(sth, 90.0)*0.32 + pow(sth, 18.0)*0.08)*gloss*smoothstep(0.2, 0.8, s)*mix(vec3(1.0), col, 0.5);
    float fr = pow(max(1.0 - abs(dot(N, V)), 1e-4), 3.0);                   // 逆光：轮廓上的毛尖透光，镶一圈亮边
    float back = clamp(dot(normalize(uRim), -V)*0.5 + 0.75, 0., 1.)*clamp(dot(N, uRim)*0.6 + 0.6, 0., 1.);
    c += uRimCol*mix(vec3(1.0), col*2.4, 0.7)*fr*back*pow(s, 1.5)*ao;
    vCol = c; vSide = aS.y;
  }`;
  const HAIR_FS = `#version 300 es
  precision highp float; centroid in vec3 vCol; centroid in float vSide; out vec4 o;
  void main(){ o = vec4(clamp(vCol, 0.0, 12.0)*(0.78 + 0.22*(1.0 - min(vSide*vSide, 1.0))), 1.0); }`;

  // 底绒：每个毛根一个小圆片，把毛之间的缝堵上（颜色 = 根色，最暗）
  const BASE_VS = `#version 300 es
  precision highp float;
  precision highp sampler2D; uniform sampler2D uS0, uS1, uS3, uS4; uniform int uTW;
  uniform mat4 uVP; uniform float uPx, uBase, uDeep; uniform vec3 uKeyCol, uAmb;
  out vec3 vCol;
  void main(){ ivec2 ij = ivec2(gl_VertexID % uTW, gl_VertexID / uTW);
    vec4 i0 = texelFetch(uS0, ij, 0), i1 = texelFetch(uS1, ij, 0), i3 = texelFetch(uS3, ij, 0), i4 = texelFetch(uS4, ij, 0);
    vec3 p = i0.xyz; gl_Position = uVP*vec4(p, 1.0);
    gl_PointSize = uBase*uPx/max(gl_Position.w, 0.05);
    vCol = i3.rgb*(uKeyCol*i3.w*0.5 + uAmb*i4.w*0.6); }`;
  const BASE_FS = `#version 300 es
  precision highp float; in vec3 vCol; out vec4 o;
  void main(){ vec2 d = gl_PointCoord - 0.5; if (dot(d,d) > 0.25) discard; o = vec4(vCol, 1.0); }`;

  const TW = 1024;                                               // 每根毛的数据放在一张 1024 宽的浮点纹理里，一根毛一个像素
  function create(stage, { rows = 400, K = 4, parts = 32, tones = 32 } = {}) {
    const { gl, W, H, ftex, U, TX, draw3, emptyVAO } = stage, N = TW * rows;
    const P = { sim: stage.prog(stage.FSQ_VS, SIM_FS), hair: stage.prog(HAIR_VS, HAIR_FS), base: stage.prog(BASE_VS, BASE_FS) };
    // 随机数：每根毛四个，全片不变（所以同一根毛永远是同一个脾气）
    let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const R = new Float32Array(N * 4); for (let i = 0; i < R.length; i++) R[i] = rnd();
    const rndTex = ftex(TW, rows, R);
    const matData = new Float32Array(parts * 16 * 4), matTex = ftex(parts * 16, 1, matData);
    const palData = new Float32Array(tones * 4 * 4), palTex = ftex(4, tones, palData);
    // ① 的输出：六张纹理（位置 + 长度 / 方向 + 粗细 / 弯 + 卷 / 根色 + 受光 / 尖色 + 遮蔽 / 法线 + 光泽）
    const simTex = Array.from({ length: 6 }, () => ftex(TW, rows, null)), simFB = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, simFB);
    simTex.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
    gl.drawBuffers(simTex.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('sim fbo incomplete');
    const hairVAO = gl.createVertexArray(), idx = new Uint32Array(N * K * 6);
    for (let i = 0, o = 0; i < N; i++) for (let j = 0; j < K; j++) { const b = i * (2 * K + 2) + j * 2; idx[o++] = b; idx[o++] = b + 1; idx[o++] = b + 2; idx[o++] = b + 2; idx[o++] = b + 1; idx[o++] = b + 3; }
    gl.bindVertexArray(hairVAO); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);

    const shapes = new Map();
    // 形状：{ pos, nrm（各 N×3）, part, tone（各 N）}。part 是零件号（对应 setPart）
    function addShape(name, s) {
      const a = new Float32Array(N * 4), b = new Float32Array(N * 4);
      for (let i = 0; i < N; i++) { a[i * 4] = s.pos[i * 3]; a[i * 4 + 1] = s.pos[i * 3 + 1]; a[i * 4 + 2] = s.pos[i * 3 + 2]; a[i * 4 + 3] = s.part ? s.part[i] : 0;
        b[i * 4] = s.nrm[i * 3]; b[i * 4 + 1] = s.nrm[i * 3 + 1]; b[i * 4 + 2] = s.nrm[i * 3 + 2]; b[i * 4 + 3] = s.tone ? s.tone[i] : 0; }
      shapes.set(name, [ftex(TW, rows, a), ftex(TW, rows, b)]);
    }
    // 色板的一行：根色、尖色、长度倍数、卷度、光泽（0—3）、下垂
    function tone(i, { root, tip, len = 1, curl = 0.05, gloss = 1, droop = 0.15 }) {
      palData.set([...srgb(root), len, ...srgb(tip), curl, gloss, droop, 0, 0], i * 16);
      gl.bindTexture(gl.TEXTURE_2D, palTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 4, tones, gl.RGBA, gl.FLOAT, palData);
    }
    // 零件：now / soft / stiff 三个姿态（后两个是弹簧滤过的，见 motion.js 的 springPoses），grow = 长出来多少，len = 这个零件的毛长倍数
    function setPart(i, now, soft, stiff, grow = 1, len = 1) {
      const o = i * 64; matData.set(now, o); matData.set(soft || now, o + 16); matData.set(stiff || soft || now, o + 32);
      const n = m4.normal(now); matData.set([n[0], n[1], n[2], 0, n[3], n[4], n[5], 0, n[6], n[7], n[8], 0, grow, len, 0, 0], o + 48);
    }

    // s：舞台的参数（见 stage.js）+ 毛的参数：A / B / mix / settle / arc / spread（在两个形状之间飞）、len / width / count、
    // frizz / clump / clumpSize / vary（乱）、spring（慢半拍）、wind、push（被拨开）、grav、deep（根有多暗）、rimCol（逆光）、base（“皮”的大小，0 = 不画）、beads。
    function render(s) {
      const A = shapes.get(s.A), B = shapes.get(s.B || s.A), c = stage.frame(s), { VP, key, rim, px, occ, amb, keyCol } = c;
      const push = new Float32Array(16); (s.push || []).slice(0, 4).forEach((o, i) => push.set(o, i * 4));
      gl.bindTexture(gl.TEXTURE_2D, matTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, parts * 16, 1, gl.RGBA, gl.FLOAT, matData);
      // ① 每根毛算一次
      gl.bindFramebuffer(gl.FRAMEBUFFER, simFB); gl.viewport(0, 0, TW, rows); gl.disable(gl.DEPTH_TEST); gl.useProgram(P.sim);
      TX(P.sim, 'uA0', A[0], 0); TX(P.sim, 'uA1', A[1], 1); TX(P.sim, 'uB0', B[0], 2); TX(P.sim, 'uB1', B[1], 3); TX(P.sim, 'uRnd', rndTex, 4); TX(P.sim, 'uMat', matTex, 5); TX(P.sim, 'uPal', palTex, 6);
      const sp = s.spread ?? 0.6, mix = s.mix ?? 0;
      U(P.sim, 'uT', s.t ?? 0); U(P.sim, 'uLen', s.len ?? 0.12); U(P.sim, 'uWidth', s.width ?? 0.004);
      U(P.sim, 'uMorph', [mix * (1 + sp) + (s.settle ?? 0), sp, s.arc ?? 0.5, s.sweep ?? 0]); U(P.sim, 'uMorphDir', s.sweepDir ?? [1, 0, 0]);
      U(P.sim, 'uGrowA', s.growA ?? [0, 0, 0, 9]); U(P.sim, 'uGrowB', s.growB ?? [0, 0, 0, 9]);
      U(P.sim, 'uWind', s.wind ?? [1, 0, 0, 0]); gl.uniform4fv(P.sim.u.uPush, push); gl.uniform4fv(P.sim.u.uOcc, occ);
      U(P.sim, 'uKey', key); U(P.sim, 'uEye', s.eye); U(P.sim, 'uGrav', s.grav ?? [0, -1, 0]);
      U(P.sim, 'uSpring', s.spring ?? 1); U(P.sim, 'uFrizz', s.frizz ?? 0.35); U(P.sim, 'uFlat', s.flat ?? 0); U(P.sim, 'uClump', s.clump ?? 0.55); U(P.sim, 'uClumpSize', s.clumpSize ?? 0.11); U(P.sim, 'uVar', s.vary ?? 1);
      draw3();
      // ② 布景 → 底绒 → 毛 → 珠子 → 后期
      stage.begin(s, c);
      const cnt = Math.min(N, Math.round(s.count ?? N));
      if ((s.base ?? 0) > 0) { gl.useProgram(P.base);
        TX(P.base, 'uS0', simTex[0], 0); TX(P.base, 'uS1', simTex[1], 1); TX(P.base, 'uS3', simTex[3], 3); TX(P.base, 'uS4', simTex[4], 4); gl.uniform1i(P.base.u.uTW, TW);
        U(P.base, 'uVP', VP); U(P.base, 'uPx', px); U(P.base, 'uBase', s.base); U(P.base, 'uDeep', s.deep ?? 0.3); U(P.base, 'uKeyCol', keyCol); U(P.base, 'uAmb', amb);
        gl.drawArrays(gl.POINTS, 0, N >> 1); }                 // 隔一个画一个就够盖住
      gl.useProgram(P.hair);
      simTex.forEach((t, i) => TX(P.hair, 'uS' + i, t, i)); gl.uniform1i(P.hair.u.uTW, TW); gl.uniform1i(P.hair.u.uK, K);
      U(P.hair, 'uVP', VP); U(P.hair, 'uEye', s.eye); U(P.hair, 'uKey', key); U(P.hair, 'uKeyCol', keyCol); U(P.hair, 'uAmb', amb);
      U(P.hair, 'uRim', rim); U(P.hair, 'uRimCol', s.rimCol ?? [1.1, 1.0, 1.2]); U(P.hair, 'uFill', s.fill ?? [0.12, 0.13, 0.2]);
      U(P.hair, 'uPx', px); U(P.hair, 'uMinPx', s.minPx ?? 1.1); U(P.hair, 'uDeep', s.deep ?? 0.3); U(P.hair, 'uTip', s.tip ?? 0.25); U(P.hair, 'uCull', s.cull ?? -0.3);
      gl.bindVertexArray(hairVAO); gl.drawElements(gl.TRIANGLES, cnt * 6 * K, gl.UNSIGNED_INT, 0); gl.bindVertexArray(emptyVAO);
      stage.beads(s.beads, s, c);
      return stage.end(s, c);
    }
    return { gl, N, K, addShape, tone, setPart, render, rnd };
  }
  return { create, m4, springKernel, srgb };
})();
