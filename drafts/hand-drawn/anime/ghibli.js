// 让背景更像手绘：每一层（除了赛璐璐）用水粉笔触重画一遍——和吉卜力背景一样，是“画”出来的，不是填出来的。
// 天横着刷，云顺着轮廓走，地上竖着点（草），远山顺着山脊。笔触只落在这一层有颜色的地方，轮廓用原层的边裁齐。
const GHIBLI = (() => {
  const GOUACHE = [
    { R: 8, step: 6, len: 8, thr: 30, p: 1 },
    { R: 4, step: 3.2, len: 7, thr: 20, p: 1, detail: .008 },
    { R: 2, step: 2, len: 5, thr: 14, p: 1, detail: .05 },
  ];
  const def = key => (X, Y, nz) => {
    const n = HD.fbm(nz, X * .002, Y * .002, 2);
    if (key === 'sky') return n * .25 - .08;
    if (key === 'clouds') return n * .6;
    if (key === 'mountains') return n * .3;
    if (Y > 770) return Math.PI / 2 + n * .5 - .25;
    return n * .4;
  };
  function paintLayers(L, S) {
    return L.map(l => {
      if (l.key === 'cel' || l.key === 'sky' || l.key === 'poles') return l;
      PAINT_BRISTLE.v = .08; PAINT_BRISTLE.a = .4;
      const fl = PAINT.flow(l.canvas, { def: def(l.key), edge: () => l.key === 'clouds' ? 1.2 : .7 });
      const c = PAINT.paint(l.canvas, fl, S, { passes: l.key === 'sky' ? [{ R: 16, step: 12, len: 10, thr: 50, p: 1 }, { R: 8, step: 6, len: 9, thr: 30, p: .8 }] : GOUACHE,
        jv: .06, jw: 6, hi: 0, rain: 0, impasto: .14, weave: 3, weaveAmp: 6, underBlur: 1.5, mask: !l.opaque, seed: l.key.length * 7 });
      PAINT_BRISTLE.v = .22; PAINT_BRISTLE.a = .55;
      return { ...l, canvas: c };
    });
  }
  return { paintLayers };
})();
