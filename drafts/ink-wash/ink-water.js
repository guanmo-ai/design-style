// 水墨 v2 · 墨滴入水（WebGL2，无贴图）
// 墨在水里的样子：嵌套的域扭曲噪声（Inigo Quilez 的 fbm warp）给出卷须、墨丝和留白；
// 墨滴的注入中心浓、向外散开；朱砂作为第二种颜色，从另一处慢慢渗出。
// paint(canvas, { t, seed, c:[x,y], spread, scale, red:[x,y,on] })   c、red 为 0–1（y 向上）
(function (G) {
  const VS = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

  const FS = `#version 300 es
  precision highp float;
  uniform vec2 R;
  uniform float T;
  uniform float SEED;
  uniform vec2 C;
  uniform float SPREAD;
  uniform float SCALE;
  uniform vec4 RED;      // xy 朱砂中心 · z 半径 · w 是否开启
  out vec4 o;

  float h(vec2 p){ p = fract(p * vec2(123.34, 456.21) + SEED); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p){
    float s = 0., a = .5;
    for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + vec2(3.1, 1.7); a *= .5; }
    return s;
  }
  // 域扭曲：q 把点搅一下，r 再搅一下，最后取值 → 卷须
  float flow(vec2 p, float t){
    vec2 q = vec2(fbm(p + vec2(0., 0.) + .07 * t), fbm(p + vec2(5.2, 1.3) - .05 * t));
    vec2 r = vec2(fbm(p + 4. * q + vec2(1.7, 9.2) + .14 * t), fbm(p + 4. * q + vec2(8.3, 2.8) + .11 * t));
    return fbm(p + 4. * r);
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / R;
    float asp = R.x / R.y;
    vec2 q = vec2(uv.x * asp, uv.y);
    vec3 paper = vec3(.953, .933, .886);   // #F3EEE2
    vec3 ink0  = vec3(.102, .102, .094);   // #1A1A18
    vec3 zhu   = vec3(.784, .216, .176);   // #C8372D

    vec2 cc = C * vec2(asp, 1.);
    float d = length(q - cc);
    vec2 p = (q - cc) * SCALE + SEED;
    float f = flow(p, T);

    // 墨：注入处浓，向外散开，边缘由卷须决定
    float inj = exp(-d * d / (SPREAD * SPREAD));
    float dens = smoothstep(.60, .80, f + inj * .30);
    float rim  = smoothstep(.52, .60, f) * (1. - smoothstep(.60, .70, f));
    float k = clamp(dens * .95 + rim * .22 * inj, 0., 1.);

    vec3 col = mix(paper, ink0, pow(k, 1.1));

    // 朱砂：另一处渗出的一小团，只染淡处，压在墨下面
    if (RED.w > .5) {
      vec2 rc = RED.xy * vec2(asp, 1.);
      float rd = length(q - rc);
      float fr = flow(p * .9 + vec2(3.3, 1.1), T * 1.2);
      float halo = exp(-rd * rd / (RED.z * RED.z));
      float rk = smoothstep(.50, .72, fr + halo * .38) * min(halo * 1.5, 1.);
      col = mix(col, zhu, rk * (1. - k * .85));
    }

    col *= .978 + .03 * vn(gl_FragCoord.xy * .8 + SEED);   // 宣纸颗粒
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
    const u = n => gl.getUniformLocation(p, n);
    const c = opts.c || [.5, .5];
    const red = opts.red || [0, 0, .1, 0];
    gl.uniform2f(u('R'), canvas.width, canvas.height);
    gl.uniform1f(u('T'), opts.t || 0);
    gl.uniform1f(u('SEED'), opts.seed || 0);
    gl.uniform2f(u('C'), c[0], c[1]);
    gl.uniform1f(u('SPREAD'), opts.spread || .3);
    gl.uniform1f(u('SCALE'), opts.scale || 2.2);
    gl.uniform4f(u('RED'), red[0], red[1], red[2], red[3] ? 1 : 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  }

  G.InkWater = { paint };
})(window);
