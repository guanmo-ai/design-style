// 极光渐变 · 网格渐变（WebGL2 片元着色器，无贴图）
// 五个色团在域扭曲后的平面上缓慢游走；每个像素按距离做加权混合，权重不够的地方落回深色底。
// 颗粒是一层极轻的噪声，防止大面积渐变出现色带。
// 用法：window.AuroraMesh.paint(canvas, { t, seed, grain })   t 为相位（0–6.28），用来换一帧
(function (G) {
  const VS = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

  const FS = `#version 300 es
  precision highp float;
  uniform vec2 R;
  uniform float T;
  uniform float SEED;
  uniform float GRAIN;
  out vec4 o;

  float h(vec2 p){ p = fract(p * vec2(123.34, 456.21) + SEED); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / R;
    vec2 q = vec2(uv.x * R.x / R.y, uv.y);
    float asp = R.x / R.y;

    // 域扭曲：让色团边界像流动的丝绸，而不是圆
    vec2 w = vec2(vn(q * 1.6 + vec2(T * .4, 1.3)), vn(q * 1.6 + vec2(4.1, T * .35)));
    vec2 z = q + (w - .5) * .55;

    // 五个色团的位置（随 T 慢慢走）
    vec2 c0 = vec2(.18 * asp + .10 * sin(T),       .30 + .10 * cos(T * .8));    // 橙
    vec2 c1 = vec2(.62 * asp + .12 * cos(T * .7),  .72 + .08 * sin(T * 1.1));   // 珊瑚
    vec2 c2 = vec2(.92 * asp + .09 * sin(T * 1.3), .26 + .12 * cos(T * .6));    // 紫
    vec2 c3 = vec2(.42 * asp + .10 * sin(T * .9),  .48 + .14 * cos(T * 1.2));   // 青
    vec2 c4 = vec2(.80 * asp + .08 * cos(T * 1.5), .60 + .10 * sin(T * .5));    // 粉

    vec3 cOr = vec3(1.00, .624, .353);  // #FF9F5A
    vec3 cCo = vec3(1.00, .369, .494);  // #FF5E7E
    vec3 cVi = vec3(.482, .380, 1.00);  // #7B61FF
    vec3 cAq = vec3(.180, .902, .839);  // #2EE6D6
    vec3 cPi = vec3(1.00, .478, .851);  // #FF7AD9
    vec3 base = vec3(.051, .051, .102); // #0D0D1A

    float s = .24;
    float w0 = exp(-dot(z - c0, z - c0) / (s * s));
    float w1 = exp(-dot(z - c1, z - c1) / (s * s));
    float w2 = exp(-dot(z - c2, z - c2) / (s * s));
    float w3 = exp(-dot(z - c3, z - c3) / (s * s));
    float w4 = exp(-dot(z - c4, z - c4) / (s * s));
    float sum = w0 + w1 + w2 + w3 + w4;
    vec3 col = (w0 * cOr + w1 * cCo + w2 * cVi + w3 * cAq + w4 * cPi) / max(sum, 1e-4);
    col = mix(base, col, smoothstep(.02, .9, sum));

    // 颗粒：±1.2% 的亮度噪声，压住色带
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
    gl.uniform2f(gl.getUniformLocation(p, 'R'), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(p, 'T'), opts.t || 0);
    gl.uniform1f(gl.getUniformLocation(p, 'SEED'), opts.seed || 0);
    gl.uniform1f(gl.getUniformLocation(p, 'GRAIN'), opts.grain == null ? .024 : opts.grain);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  }

  G.AuroraMesh = { paint };
})(window);
