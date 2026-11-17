// still.js — 风格图用：一张正对纸面的毛绒静帧。parts 交给 SC.build，pose[零件] = [现在的姿态, 弹簧滤过的姿态（毛尖往那边弯）]。
const STILL = {
  async run({ W, H, C, parts, pose = {}, s = {}, rows }) {
    try {
      await document.fonts.ready;
      const Q = new URLSearchParams(location.search);
      const F = FUR.create(STAGE.create(document.getElementById('c')), { rows: +(Q.get('rows') || rows || 400), K: 4 });
      SC.tones(F);
      F.addShape('poster', SC.build(F.N, parts, { W, H, ppu: C.ppu, k: +(Q.get('k') || 0.6) }));
      for (let i = 0; i < 32; i++) { const p = pose[i] || [ID], now = p[0], soft = p[1] || now; F.setPart(i, now, soft, p[2] || soft, 1, 1); }
      const st = Object.assign({ t: 0, eye: C.eye, at: C.at, fov: C.fov, bg: [SC.COL.paper, SC.COL.paper], wall: -0.02, wallMix: 1, shadow: 0, spot: [0.5, 0.5, 0],
        key: [0.35, 0.75, 0.9], keyCol: [2.0, 1.95, 1.9], amb: [0.42, 0.4, 0.42], vignette: 0.04, thr: 8, len: 0.1, width: 0.005, base: 0.016, clumpSize: 0.06, clump: 0.5, frizz: 0.3,
        wind: [1, 0, 0, 0.03], occ: [], beads: [], push: [], A: 'poster' }, s);
      if (Q.get('wmul')) st.width *= +Q.get('wmul');
      F.render(st);
      await new Promise(r => requestAnimationFrame(() => r()));
      window.__done = true; window.ready = true;
    } catch (e) { console.log('ERR ' + (e.stack || e.message)); }
  },
};
