// 果冻软糖渲染器：场景 → 多次抖动采样累加（抗锯齿；做片子时同时是运动模糊）→ 景深 → 泛光 + 横向光晕 → 胶片调色
// 用法：const R = await GummyRenderer(canvas, {W,H});  await R.render(scene, {spp});
(function (G) {
  const K = G.GLK;
  const FS_DOF = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D src; uniform vec2 res; uniform float focus, aper, maxR;
  float coc(float d){ return clamp(aper*abs(d-focus)/max(d,1e-3), 0., maxR); }
  void main(){
    vec4 c0 = texture(src, uv); float r0 = coc(c0.a);
    vec3 acc = c0.rgb; float wsum = 1.0;
    const int N = 72; const float GA = 2.39996323;
    for (int k=1;k<N;k++){
      float rr = sqrt(float(k)/float(N))*maxR; float a = float(k)*GA;
      vec2 off = vec2(cos(a), sin(a))*rr;
      vec4 s = texture(src, uv + off/res);
      float rs = coc(s.a);
      // 采样点自己的弥散圈够大才算进来（前景糊到背景上），背景不糊到清晰的前景上
      float w = smoothstep(rr-1.5, rr+0.5, min(rs, s.a < c0.a ? rs : r0));
      acc += s.rgb*w; wsum += w;
    }
    o = vec4(acc/wsum, c0.a);
  }`;
  const FS_BRIGHT = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform float thr;
  void main(){ vec3 c = texture(src, uv).rgb; float l = max(c.r,max(c.g,c.b)); o = vec4(c*smoothstep(thr, thr*3.0, l), 1.); }`;
  const FS_BLUR = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform vec2 dir;
  void main(){ vec3 s = vec3(0.); float w[7] = float[](0.1964,0.1747,0.1210,0.0656,0.0277,0.0091,0.0024);
    s += texture(src, uv).rgb*w[0];
    for(int i=1;i<7;i++){ s += texture(src, uv+dir*float(i)).rgb*w[i]; s += texture(src, uv-dir*float(i)).rgb*w[i]; }
    o = vec4(s,1.); }`;
  const FS_COMP = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D src, b1, b2, b3, st; uniform vec2 res;
  uniform float exposure, bloom, streak, grain, vign, ca, seed, sat, contrast;
  uniform vec3 shadowTint, highTint;
  // 胶片感的色调曲线（肩部柔和，高光不发灰）
  vec3 filmic(vec3 x){ x = max(x, 0.); vec3 a = x*(2.51*x+0.03), b = x*(2.43*x+0.59)+0.14; return clamp(a/b, 0., 1.); }
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))+seed)*43758.5453); }
  void main(){
    vec2 d = uv-0.5; float r2 = dot(d,d);
    vec3 c;
    c.r = texture(src, uv - d*ca*r2).r; c.g = texture(src, uv).g; c.b = texture(src, uv + d*ca*r2).b;
    vec3 bl = texture(b1,uv).rgb*0.6 + texture(b2,uv).rgb*0.5 + texture(b3,uv).rgb*0.35;
    c += bl*bloom + texture(st,uv).rgb*streak*vec3(1.0,0.78,0.6);
    c *= exposure;
    // 保色相的色调映射：按最亮的通道压，红就还是红；只在很亮时才向白过渡
    float m = max(c.r, max(c.g, c.b));
    vec3 hp = c * (filmic(vec3(m)).r / max(m, 1e-4));
    c = mix(hp, filmic(c), smoothstep(1.5, 8.0, m)*0.6);
    float l = dot(c, vec3(0.2126,0.7152,0.0722));
    c = mix(vec3(l), c, sat);
    c *= mix(shadowTint, highTint, smoothstep(0.0, 0.75, l));
    c = pow(c, vec3(1.0/2.2));
    c = mix(c, c*c*(3.0-2.0*c), contrast);
    c *= 1.0 - vign*smoothstep(0.1, 0.9, r2*2.0);
    c += (h(uv*res)-0.5)*grain;
    o = vec4(c,1.);
  }`;
  const FS_ACC = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform float k;
  void main(){ o = texture(src, uv)*k; }`;

  function quat2mat(yaw, pitch, roll) {   // 物体 → 世界的旋转，返回其逆（世界 → 物体），列主序
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    // R = Ry(yaw) * Rx(pitch) * Rz(roll)
    const Rz = [cr, sr, 0, -sr, cr, 0, 0, 0, 1];
    const Rx = [1, 0, 0, 0, cp, sp, 0, -sp, cp];
    const Ry = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
    const mul = (A, B) => { const C = new Array(9).fill(0); for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) C[c * 3 + r] += A[k * 3 + r] * B[c * 3 + k]; return C; };
    const R = mul(Ry, mul(Rx, Rz));
    return [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]];   // 转置 = 逆
  }

  G.GummyRenderer = async function (canvas, { W, H, nobj = 8 }) {
    canvas.width = W; canvas.height = H;
    const gl = K.create(canvas);
    const P = {
      scene: K.program(gl, G.GUMMY_FS(nobj)),
      dof: K.program(gl, FS_DOF), bright: K.program(gl, FS_BRIGHT), blur: K.program(gl, FS_BLUR),
      comp: K.program(gl, FS_COMP), acc: K.program(gl, FS_ACC),
    };
    const one = K.fbo(gl, W, H, gl.RGBA16F), acc = K.fbo(gl, W, H, gl.RGBA16F), dof = K.fbo(gl, W, H, gl.RGBA16F);
    const lv = [4, 8, 16].map(s => [K.fbo(gl, Math.ceil(W / s), Math.ceil(H / s)), K.fbo(gl, Math.ceil(W / s), Math.ceil(H / s))]);
    const stk = [K.fbo(gl, Math.ceil(W / 4), Math.ceil(H / 4)), K.fbo(gl, Math.ceil(W / 4), Math.ceil(H / 4))];

    function setScene(sc, jx, jy) {
      const p = P.scene, u = p.u; gl.useProgram(p);
      gl.uniform2f(u.res, W, H); gl.uniform2f(u.jitter, jx, jy); gl.uniform1i(u.dbg, sc.dbg || 0);
      gl.uniform3fv(u.camPos, sc.cam.pos); gl.uniform3fv(u.camTgt, sc.cam.tgt); gl.uniform1f(u.fov, sc.cam.fov);
      const sd = sc.sun.dir, l = Math.hypot(...sd);
      gl.uniform3f(u.sunDir, sd[0] / l, sd[1] / l, sd[2] / l); gl.uniform3fv(u.sunCol, sc.sun.col);
      gl.uniform3fv(u.skyHor, sc.sky.hor); gl.uniform3fv(u.skyZen, sc.sky.zen); gl.uniform3fv(u.skyBack, sc.sky.back);
      gl.uniform1f(u.fieldNear, sc.field ? sc.field.near : 1); gl.uniform1f(u.fieldCell, sc.field ? sc.field.cell : 1);
      gl.uniform3fv(u.floorCol, sc.floor.col); gl.uniform1f(u.floorGloss, sc.floor.gloss);
      const n = nobj, pos = new Float32Array(n * 3), rot = new Float32Array(n * 9), sh = new Float32Array(n * 4), sh2 = new Float32Array(n * 4), mat = new Float32Array(n * 4), bd = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const ob = sc.objs[i];
        if (!ob) { bd.set([0, -100, 0, 0.001], i * 4); sh.set([1, 1, 0, 2], i * 4); rot.set([1, 0, 0, 0, 1, 0, 0, 0, 1], i * 9); continue; }
        pos.set(ob.pos, i * 3);
        rot.set(quat2mat(ob.yaw || 0, ob.pitch || 0, ob.roll || 0), i * 9);
        const type = { bear: 0, ring: 1, drop: 2, cube: 3 }[ob.type];
        sh.set([ob.scale, ob.squash || 1, ob.lagZ || 0, type], i * 4);
        sh2.set([ob.lagX || 0, ob.round || 0.2, 0, 0], i * 4);
        mat.set([...ob.sigA, ob.sigS], i * 4);
        // 包围球：物体局部中心（高度一半）旋转回世界
        const hgt = { bear: 2.05, ring: 0.62, drop: 0.9, cube: 1.0 }[ob.type] * ob.scale * (ob.squash || 1);
        const R = quat2mat(ob.yaw || 0, ob.pitch || 0, ob.roll || 0); // 世界→物体；物体→世界 = 转置
        const ly = hgt * 0.5; const wc = [R[1] * ly, R[4] * ly, R[7] * ly];   // 转置后的第二列
        const rad = { bear: 1.25, ring: 0.95, drop: 0.55, cube: 1.0 }[ob.type] * ob.scale / Math.sqrt(Math.min(1, ob.squash || 1)) * 1.12;
        bd.set([ob.pos[0] + wc[0], ob.pos[1] + wc[1], ob.pos[2] + wc[2], rad], i * 4);
      }
      gl.uniform3fv(u.oPos, pos); gl.uniformMatrix3fv(u.oRot, false, rot); gl.uniform4fv(u.oShape, sh); gl.uniform4fv(u.oShape2, sh2);
      gl.uniform4fv(u.oMat, mat); gl.uniform4fv(u.oBound, bd);
    }

    // 每个采样一次场景，按块画（不让一次绘制太久）；加法混合累加
    async function render(sc, { spp = 1, tiles = 4, frameAt } = {}) {
      const t0 = performance.now();
      gl.bindFramebuffer(gl.FRAMEBUFFER, acc.fb); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      for (let s = 0; s < spp; s++) {
        // R2 低差异序列做像素内抖动
        const jx = ((0.5 + s * 0.7548776662) % 1) - 0.5, jy = ((0.5 + s * 0.5698402909) % 1) - 0.5;
        const scs = frameAt ? frameAt((s + 0.5) / spp) : sc;      // 运动模糊：每个采样取快门里的一个时刻
        setScene(scs, spp > 1 ? jx : 0, spp > 1 ? jy : 0);
        await K.drawTiled(gl, one, tiles);
        gl.useProgram(P.acc); K.bindTex(gl, P.acc, 'src', one.tex, 0); gl.uniform1f(P.acc.u.k, 1 / spp);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); K.draw(gl, acc); gl.disable(gl.BLEND);
      }
      { const px = new Uint8Array(4); gl.bindFramebuffer(gl.FRAMEBUFFER, acc.fb); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, new Float32Array(4)); }
      const tScene = performance.now() - t0;
      const sc0 = frameAt ? frameAt(0.5) : sc, pp = sc0.post;
      // 景深
      gl.useProgram(P.dof); K.bindTex(gl, P.dof, 'src', acc.tex, 0);
      gl.uniform2f(P.dof.u.res, W, H); gl.uniform1f(P.dof.u.focus, sc0.cam.focus); gl.uniform1f(P.dof.u.aper, pp.aper * W / 1920); gl.uniform1f(P.dof.u.maxR, pp.maxR * W / 1920);
      await K.drawTiled(gl, dof, 2);
      // 泛光
      gl.useProgram(P.bright); K.bindTex(gl, P.bright, 'src', dof.tex, 0); gl.uniform1f(P.bright.u.thr, pp.thr); K.draw(gl, lv[0][0]);
      for (let i = 0; i < 3; i++) {
        if (i > 0) { gl.useProgram(P.acc); K.bindTex(gl, P.acc, 'src', lv[i - 1][0].tex, 0); gl.uniform1f(P.acc.u.k, 1); K.draw(gl, lv[i][0]); }
        for (let r = 0; r < 2; r++) {
          gl.useProgram(P.blur); K.bindTex(gl, P.blur, 'src', lv[i][0].tex, 0); gl.uniform2f(P.blur.u.dir, 1.6 / lv[i][0].w, 0); K.draw(gl, lv[i][1]);
          K.bindTex(gl, P.blur, 'src', lv[i][1].tex, 0); gl.uniform2f(P.blur.u.dir, 0, 1.6 / lv[i][0].h); K.draw(gl, lv[i][0]);
        }
      }
      // 横向光晕（变形宽银幕镜头的那条线，只给最亮的日轮）
      gl.useProgram(P.bright); K.bindTex(gl, P.bright, 'src', dof.tex, 0); gl.uniform1f(P.bright.u.thr, pp.thr * 6); K.draw(gl, stk[0]);
      let a = stk[0], b = stk[1];
      for (let r = 0; r < 4; r++) { gl.useProgram(P.blur); K.bindTex(gl, P.blur, 'src', a.tex, 0); gl.uniform2f(P.blur.u.dir, (6 + r * 10) / a.w, 0); K.draw(gl, b); [a, b] = [b, a]; }
      // 合成
      const u = P.comp.u; gl.useProgram(P.comp);
      K.bindTex(gl, P.comp, 'src', dof.tex, 0); K.bindTex(gl, P.comp, 'b1', lv[0][0].tex, 1); K.bindTex(gl, P.comp, 'b2', lv[1][0].tex, 2); K.bindTex(gl, P.comp, 'b3', lv[2][0].tex, 3); K.bindTex(gl, P.comp, 'st', a.tex, 4);
      gl.uniform2f(u.res, W, H); gl.uniform1f(u.exposure, pp.exposure); gl.uniform1f(u.bloom, pp.bloom); gl.uniform1f(u.streak, pp.streak);
      gl.uniform1f(u.grain, pp.grain); gl.uniform1f(u.vign, pp.vign); gl.uniform1f(u.ca, pp.ca); gl.uniform1f(u.seed, pp.seed || 0); gl.uniform1f(u.sat, pp.sat); gl.uniform1f(u.contrast, pp.contrast ?? 0.3);
      gl.uniform3fv(u.shadowTint, pp.shadowTint); gl.uniform3fv(u.highTint, pp.highTint);
      K.draw(gl, null);
      const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);   // 等真画完
      return { scene: tScene, total: performance.now() - t0 };
    }
    return { gl, render };
  };
})(window);
