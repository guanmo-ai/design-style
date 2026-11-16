// 手绘两支片子共用：缓动、出字（每个字落定登记一个声音）、单调插值的关键帧
const FK = (() => {
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const smr = (a, b, x) => sm((x - a) / (b - a));
  const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
  const easeIO = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  // 五次缓动：速度和加速度在两端都是 0（镜头推拉用，起停都不顿）
  const quint = t => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
  const spring = (t, z = .5, w = 10) => { if (t <= 0) return 0; return 1 - Math.exp(-z * w * t) * Math.cos(w * Math.sqrt(1 - z * z) * t); };
  // 关键帧 [[f, v], ...] 之间用五次缓动走（每段起停都是 0 速度）
  const keys = (K, f) => { if (f <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (f <= K[i][0]) return lerp(K[i - 1][1], K[i][1], quint((f - K[i - 1][0]) / (K[i][0] - K[i - 1][0]))); return K[K.length - 1][1]; };
  const cues = new Map();
  const cue = (f0, n, rate, kind) => { f0 = Math.max(0, Math.round(f0)); const k = f0 + '|' + kind + '|' + n; if (!cues.has(k)) cues.set(k, [f0, n, rate, kind]); };
  // 一个字一个字升起来；out 之后一个字一个字沉下去
  function rise(ctx, txt, x, y, f, f0, o = {}) {
    if (f < f0) return 0;
    const dur = o.dur || 16, rate = o.rate ?? 1.2, size = o.size;
    if (o.kind !== 'none') cue(f0, [...txt].length, rate, o.kind || 'text');
    ctx.save(); ctx.font = o.font; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.shadowBlur ?? 18; }
    const chars = [...txt], Wt = ctx.measureText(txt).width;
    let cx = o.align === 'center' ? x - Wt / 2 : o.align === 'right' ? x - Wt : x;
    if (o.ls) cx -= o.ls * chars.length / (o.align === 'center' ? 2 : o.align === 'right' ? 1 : 1e9);
    ctx.beginPath(); ctx.rect(cx - size, y - size * 1.3, Wt + size * 2 + (o.ls || 0) * chars.length, size * 1.65); ctx.clip();
    let vis = 0;
    for (let i = 0; i < chars.length; i++) {
      const p = easeOut((f - f0 - i * rate) / dur), q = o.out ? 1 - easeOut((f - o.out - i * .5) / 18) : 1;
      const w = ctx.measureText(chars[i]).width + (o.ls || 0);
      if (p > 0 && q > 0) { ctx.globalAlpha = (o.alpha ?? 1) * clamp(p * 1.5) * clamp(q); ctx.fillStyle = o.color; ctx.fillText(chars[i], cx, y + (1 - p) * size * .9 - (1 - q) * size * .6); vis = Math.max(vis, p * q); }
      cx += w;
    }
    ctx.restore(); return vis;
  }
  const rng = s => { let a = s >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  async function fonts(list) { for (const [n, file, w] of list) { const ff = new FontFace(n, `url(../../../public/fonts/${file})`, { weight: w || 'normal' }); await ff.load(); document.fonts.add(ff); } }
  return { clamp, lerp, sm, smr, easeOut, easeIO, quint, spring, keys, cue, cues, rise, rng, fonts };
})();
