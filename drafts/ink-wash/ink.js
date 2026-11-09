// 水墨 · 墨的扩散（WebGL2 片元着色器，无贴图）
// 给一个 canvas 和几滴墨（屏幕坐标 0–1，半径按画面高度计，浓度 0–1），按像素算出宣纸纤维、墨晕的深色边、干笔飞白。
// 用法：window.InkWash.paint(canvas, { drops:[{x,y,r,w}], seed })
(function (G) {
  const VS = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

  const FS = `#version 300 es
  precision highp float;
  uniform vec2 R;
  uniform vec4 D[6];        // xy 中心（高度为 1 的坐标，y 从下往上）· z 半径 · w 浓度
  uniform int N;
  uniform float SEED;
  out vec4 o;

  float h(vec2 p){ p = fract(p * vec2(123.34, 456.21) + SEED); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p){
    float s = 0., a = .5;
    for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.02 + 11.7; a *= .5; }
    return s;
  }
  float fbm2(vec2 p){ return .6 * vn(p) + .4 * vn(p * 2.03 + 7.1); }

  void main(){
    vec2 uv  = gl_FragCoord.xy / R;
    float asp = R.x / R.y;
    vec2 q   = vec2(uv.x * asp, uv.y);

    // 宣纸：横向纤维 + 细颗粒
    float fib   = vn(vec2(q.x * 420., q.y * 56.)) * .6 + vn(q * 900.) * .4;
    float paper = .968 + .032 * fib;

    // 墨：每一滴是一个被两层噪声扰动的圆——大乱流定形，小乱流出毛边（羽化的边）
    float ink = 0., edge = 0.;
    float tone = fbm(q * 2.3 + SEED);
    for (int i = 0; i < 6; i++) {
      if (i >= N) break;
      vec4 d = D[i];
      vec2 c = vec2(d.x * asp, d.y);
      float w  = fbm(q * 2.6 + float(i) * 5.3 + SEED);
      float w2 = fbm2(q * 11.0 + float(i) * 2.1 + SEED);
      float dist = length(q - c) + (w - .5) * d.z * .6 + (w2 - .5) * d.z * .16;
      float r = d.z;
      // 浓淡：中心最浓，向外渐淡，淡处由噪声打碎
      float grad = 1. - smoothstep(r * .12, r * 1.0, dist);
      float mask = 1. - smoothstep(r * .97, r * 1.01 + .003, dist);   // 墨的外缘：较利，有毛边
      float body = pow(grad, 1.25) * mask;
      float pch = smoothstep(.25, .8, fbm2(q * 4.5 + float(i) * 9.7 + SEED));
      float a = body * d.w * (.5 + .5 * pch) * (.7 + .3 * tone);
      ink  = 1. - (1. - ink) * (1. - a);
      // 墨晕：边缘外圈一道较深、较宽的水痕，不是硬环
      float rim = exp(-pow((dist - r * .98) / (r * .05 + .003), 2.));
      edge = max(edge, rim * d.w * .22 * smoothstep(.03, .12, r));   // 小墨点不画晕，免得变成圆环
    }

    // 干笔飞白：只在淡墨区出现，纹理粗、稀
    float dry = smoothstep(.42, .8, vn(vec2(q.x * 2.2, q.y * 64.) + SEED));
    float k = clamp(ink * .96 + edge, 0., 1.);
    k *= 1. - .12 * dry * smoothstep(.03, .18, ink) * (1. - smoothstep(.18, .42, ink));

    // 墨色层级：浓 → 焦 → 重 → 淡 → 清（同一种墨，靠浓淡分出层次）
    vec3 inkCol = vec3(.102, .102, .094);
    vec3 paperCol = vec3(.953, .933, .886) * paper;
    vec3 col = mix(paperCol, inkCol, pow(k, 1.12));
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

    const drops = (opts.drops || []).slice(0, 6);
    const arr = new Float32Array(6 * 4);
    drops.forEach((d, i) => {
      arr.set([d.x, 1 - d.y, d.r, d.w == null ? 1 : d.w], i * 4);
    });
    gl.uniform2f(gl.getUniformLocation(p, 'R'), canvas.width, canvas.height);
    gl.uniform4fv(gl.getUniformLocation(p, 'D[0]'), arr);
    gl.uniform1i(gl.getUniformLocation(p, 'N'), drops.length);
    gl.uniform1f(gl.getUniformLocation(p, 'SEED'), opts.seed || 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  }

  G.InkWash = { paint };
})(window);
