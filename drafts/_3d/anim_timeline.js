// ---------- 时间轴（5 秒，120 BPM，一拍 0.5 秒） ----------
const cam = new THREE.PerspectiveCamera(20, W / H, 1, 400);
const comp = makeComposer(ctx, cam, { ao: true, aoRadius: 0.5, aoDist: 0.3, bloom: 0.5, bloomRadius: 0.45, bloomThreshold: 0.86, vig: 0.2, grain: 0.012, tilt: { focus: 0.56, band: 0.26, amount: 2.0 }, edge: 0.11, paper: '#F7F0E2' });
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const back = (e, s = 1.2) => { e -= 1; return 1 + (s + 1) * e ** 3 + s * e ** 2; };          // 过冲约 5%
const smooth = e => e * e * (3 - 2 * e);
const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
const DAY = ['#F8F1E3', '#F6EEDD', '#F3E8D6'], DUSK = ['#FBE3C4', '#F8C9A8', '#F2B29C'], NIGHT = ['#C3A6E6', '#F0BCD2', '#FFD3B4'];   // 暮色：薰衣草到蜜桃粉，不用深蓝
function sky(t) {
  const a = smooth(clamp((t - 3.0 - D) / 0.6)), b = smooth(clamp((t - 3.5 - D) / 0.7));
  return [0, 1, 2].map(i => '#' + lerpC(lerpC(DAY[i], DUSK[i], a), NIGHT[i], b).getHexString());
}
const BLOOM = comp.passes.find(p => p.constructor.name === 'UnrealBloomPass');
const GTAO = comp.passes.find(p => p.constructor.name === 'GTAOPass'), AO_FULL = GTAO.blendIntensity;
const SHIFT = 0.0, DUR = 6.5, D = 1.3;   // D：底座拼装占用的时间，后面的事件整体往后挪 D
const tOn = EMISSIVE.map((m, i) => D + 3.55 + ((i * 7) % 11) / 11 * 0.9);                  // 窗户一盏盏亮，散在 3.55—4.45 s
window.renderFrame = (f, fps = 30) => {
  const t = f / fps + SHIFT;
  for (const g of GROUPS) {
    const { type, t0, dur, base } = g.userData;
    const e = clamp((t - t0) / dur);
    g.visible = e > 0;
    g.scale.set(1, 1, 1); g.position.y = g.visible ? base : -1e4;
    if (!g.visible) continue;
    if (type === 'rise') g.scale.y = Math.max(0.001, back(e));
    else if (type === 'pop') { const k = Math.max(0.001, back(e, 2.2)); g.scale.set(k, Math.max(0.001, back(clamp((t - t0 - 0.05) / dur), 2.6)), k); }
    else if (type === 'drawx') g.scale.x = Math.max(0.001, smooth(e));
    else if (type === 'drop') {
      const land = 0.55;
      if (e < land) g.position.y = base + 9 * (1 - (e / land) ** 2);
      else { const k = (e - land) / (1 - land), sq = 0.1 * Math.sin(Math.PI * k) * (1 - k); g.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5); }
    } else if (type === 'drive') {                    // 小卡车：先落到路上，入夜后亮着灯开走
      const land = 0.55;
      if (e < land) g.position.y = base + 9 * (1 - (e / land) ** 2);
      g.position.x = 13 * clamp((t - 4.35 - D) / 1.1) ** 2;
    }
  }
  for (const m of PIECES) {
    const { type, t0, dur, y, x } = m.userData, e = clamp((t - t0) / dur);
    m.visible = e > 0; m.scale.set(1, 1, 1); m.position.y = y; m.position.x = x; m.rotation.set(0, 0, 0);
    if (!m.visible) { m.position.y = -1e4; continue; }   // 藏起来的也挪远：GTAO 的法线 / 深度通道会画到“隐藏”的物体
    if (type === 'drop') {
      const land = 0.6;
      if (e < land) m.position.y = y + 6 * (1 - (e / land) ** 2);
      else { const k = (e - land) / (1 - land), sq = 0.16 * Math.sin(Math.PI * k) * (1 - k); m.scale.set(1 + sq * 0.4, 1 - sq, 1 + sq * 0.4); }
    } else if (type === 'flip') {                    // 翻着落下：转半圈，落地带 5% 过冲
      const k = back(e, 1.2); m.position.y = y + 2.4 * (1 - smooth(e)); m.rotation.x = Math.PI * (1 - k);
    } else if (type === 'slide') { m.position.x = x - 30 * (1 - back(e, 1.1)); }
    else if (type === 'unroll') m.scale.x = Math.max(0.001, back(e, 0.9));
    else if (type === 'pop') { const k = Math.max(0.001, back(e, 2.4)); m.scale.set(k, k, k); }
  }
  // 环境光遮蔽：底座拼装时关着（大块平板在掠射角下 GTAO 会出方形空洞），房子长出来时再打开
  GTAO.enabled = t > 1.25; GTAO.blendIntensity = AO_FULL * smooth(clamp((t - 1.25) / 0.4));
  // 白天 → 傍晚 → 入夜
  window.__sky(sky(t));
  const dusk = smooth(clamp((t - 3.0 - D) / 0.6)), night = smooth(clamp((t - 3.5 - D) / 0.7));
  moon.color.copy(lerpC(lerpC('#FFF3E0', '#FFC08A', dusk), '#C9B4FF', night)); moon.intensity = 3.0 - 0.6 * dusk - 0.7 * night;
  HEMI.intensity = 1.25 - 0.1 * dusk - 0.15 * night; HEMI.color.copy(lerpC('#E6F0FF', '#B9A8E8', night));
  EMISSIVE.forEach((m, i) => { const on = smooth(clamp((t - tOn[i]) / 0.12)); m.emissiveIntensity = m.userData.base * (0.35 + on * 2.2); });
  BLOOM.strength = 0.08 + 0.4 * night; BLOOM.threshold = 0.95 - 0.1 * night;
  const lamp = smooth(clamp((t - 4.0 - D) / 0.15));
  LAMPS.forEach(l => l.intensity = 30 * lamp);
  window.__spot.intensity = 45 * smooth(clamp((t - 3.9 - D) / 0.1));
  // 镜头：慢慢绕过去、推近
  const k = smooth(clamp(t / DUR));
  const ang = 0.74 - 0.28 * k, rad = 62 - 15 * k;
  cam.position.set(Math.sin(ang) * rad - 0.5, 34 - 8 * k, Math.cos(ang) * rad + 0.2); cam.lookAt(-0.5, 0.8 + 0.6 * k, 0.2);
  comp.render();
  return true;
};
window.__ready = true; window.__scene = scene; window.__comp = comp;
{ const q = new URLSearchParams(location.search); if (!q.get('anim')) { window.renderFrame(+(q.get('f') || 0)); window.__done = true; } }
