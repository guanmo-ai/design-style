// 极光 v2 · 网格渐变 + 玻璃球折射（WebGL2，无贴图）
// 背景：五个色团 + 双层域扭曲 + 颗粒；玻璃球：按法线折射背景（RGB 三通道略微错开 = 色散），
// 菲涅尔边缘发亮，左上一块硬高光。球的轮廓用三个正弦叠出“呼吸”的形变。
// paint(canvas, { t, seed, orb:{x,y,r} | null, grain })
(function (G) {
  const VS = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

  const FS = `#version 300 es
  precision highp float;
  uniform vec2 R;
  uniform float T;
  uniform float SEED;
  uniform float GRAIN;
  uniform vec4 ORB;     // xy 中心（0–1，y 向上）· z 半径（高度为 1）· w 是否开启
  out vec4 o;

  float h(vec2 p){ p = fract(p * vec2(123.34, 456.21) + SEED); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
  }

  // 网格渐变：五个色团在双层域扭曲后的平面上游走
  vec3 mesh(vec2 q, float t){
    float asp = R.x / R.y;
    vec2 w1 = vec2(vn(q * 1.5 + vec2(t * .35, 1.3)), vn(q * 1.5 + vec2(4.1, t * .3)));
    vec2 z = q + (w1 - .5) * .6;
    vec2 w2 = vec2(vn(z * 2.6 - vec2(t * .2, 0.)), vn(z * 2.6 + vec2(0., t * .25)));
    z += (w2 - .5) * .18;

    vec2 c0 = vec2(.16 * asp + .10 * sin(t),        .30 + .12 * cos(t * .8));
    vec2 c1 = vec2(.64 * asp + .12 * cos(t * .7),   .74 + .08 * sin(t * 1.1));
    vec2 c2 = vec2(.94 * asp + .09 * sin(t * 1.3),  .24 + .12 * cos(t * .6));
    vec2 c3 = vec2(.40 * asp + .10 * sin(t * .9),   .50 + .14 * cos(t * 1.2));
    vec2 c4 = vec2(.82 * asp + .08 * cos(t * 1.5),  .62 + .10 * sin(t * .5));

    vec3 cOr = vec3(1.00, .639, .294);
    vec3 cCo = vec3(1.00, .294, .436);
    vec3 cVi = vec3(.420, .318, 1.00);
    vec3 cAq = vec3(.125, .949, .867);
    vec3 cPi = vec3(1.00, .420, .878);
    vec3 base = vec3(.040, .040, .090);

    float s = .25;
    float a0 = exp(-dot(z - c0, z - c0) / (s * s));
    float a1 = exp(-dot(z - c1, z - c1) / (s * s));
    float a2 = exp(-dot(z - c2, z - c2) / (s * s));
    float a3 = exp(-dot(z - c3, z - c3) / (s * s));
    float a4 = exp(-dot(z - c4, z - c4) / (s * s));
    float sum = a0 + a1 + a2 + a3 + a4;
    vec3 col = (a0 * cOr + a1 * cCo + a2 * cVi + a3 * cAq + a4 * cPi) / max(sum, 1e-4);
    return mix(base, col, smoothstep(.02, .9, sum));
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / R;
    float asp = R.x / R.y;
    vec2 q = vec2(uv.x * asp, uv.y);
    vec3 col = mesh(q, T);

    if (ORB.w > .5) {
      vec2 c = vec2(ORB.x * asp, ORB.y);
      vec2 d = q - c;
      float a = atan(d.y, d.x);
      // 呼吸：轮廓被两组正弦轻微鼓起
      float rr = ORB.z * (1. + .012 * sin(3. * a + T * 2.1) + .008 * sin(5. * a - T * 1.4));
      float dd = length(d);
      float inside = smoothstep(rr + .002, rr - .002, dd);
      vec2 pn = d / rr;
      float zz = sqrt(max(1. - dot(pn, pn), 0.));
      vec3 n = vec3(pn, zz);
      vec2 off = n.xy * -.85 * (1. - zz * .35);   // 凸透镜：边缘折得更狠，中心几乎直射
      // 色散：三个通道按不同强度折射
      vec3 refr = vec3(mesh(q + off * .94, T).r, mesh(q + off, T).g, mesh(q + off * 1.07, T).b);
      float edgeDark = smoothstep(.0, .55, zz);                   // 边缘压暗，给玻璃厚度
      refr *= mix(.45, 1., edgeDark);
      float fres = pow(1. - zz, 2.6);
      vec3 L = normalize(vec3(-.45, .6, .7));
      vec3 Rf = reflect(vec3(0., 0., -1.), n);
      float spec = pow(max(dot(normalize(Rf), L), 0.), 40.);
      vec3 glass = refr + fres * vec3(1.) * .55 + spec * vec3(1.);
      // 硬高光：左上角一块椭圆（像棚拍的柔光箱）
      float bx = length((pn - vec2(-.40, .46)) / vec2(.24, .13));
      float box = exp(-bx * bx * 2.4);          // 柔光箱的高光：软边，不像贴纸
      glass = mix(glass, vec3(1.), box * .55);
      col = mix(col, glass, inside);
      // 外圈发光（光晕，让球从背景里“浮”出来）
      float halo = exp(-max(dd - rr, 0.) * 14.) * (1. - inside);
      col += halo * .18 * vec3(1., .85, .95);
    }

    float g = vn(gl_FragCoord.xy * .9 + SEED) - .5;
    col += g * GRAIN;
    o = vec4(clamp(col, 0., 1.), 1.);
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
    const orb = opts.orb;
    gl.uniform2f(gl.getUniformLocation(p, 'R'), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(p, 'T'), opts.t || 0);
    gl.uniform1f(gl.getUniformLocation(p, 'SEED'), opts.seed || 0);
    gl.uniform1f(gl.getUniformLocation(p, 'GRAIN'), opts.grain == null ? .022 : opts.grain);
    gl.uniform4f(gl.getUniformLocation(p, 'ORB'), orb ? orb.x : 0, orb ? orb.y : 0, orb ? orb.r : 0, orb ? 1 : 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  }

  G.Aurora = { paint };
})(window);
