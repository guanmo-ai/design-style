// 第 0 帧的标注层：标题 + 四个能拿走的数（塑性、体积守恒、搓条、指纹）
function overlayCover(scene) {
  const ov = document.getElementById('ov');
  const pr = p => CLAY.project(scene, p, 1920, 1080);
  const M = window.__marks;
  const C = [
    { p: pr(M.tu), dx: -150, dy: -230, side: 'l', k: '<i>01</i>塑性 · 按下去不回弹', z: '拇指按出的坑就是记录。<br>毛绒按下去会弹回来，黏土不会。' },
    { p: pr(M.tuR), dx: 40, dy: 150, side: 'r', k: '<i>02</i>体积守恒 · s × (1/√s)² = 1', z: '“土”被按到 <b>72%</b> 厚，<br>前后左右各摊开 <b>18%</b>。' },
    { p: pr(M.coilStart), dx: -120, dy: 70, side: 'l', k: '<i>03</i>搓条 · 长 ×4 → 粗 ×½', z: '体积不变：半径 ∝ 1/√长度。' },
    { p: pr(window.__disc), dx: -40, dy: -130, side: 'l', k: '<i>04</i>指纹 · 脊距 ≈ 0.45 mm', z: '一个拇指肚约 40 道纹，<br>碰一下就印上去。' },
  ];
  let svg = '', html = '';
  for (const c of C) {
    const [x, y] = c.p, ex = x + c.dx, ey = y + c.dy, L = c.side === 'l';
    const len = Math.hypot(c.dx, c.dy), ux = c.dx / len, uy = c.dy / len;
    svg += `<circle cx="${x}" cy="${y}" r="11" fill="none" stroke="#2b2420" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="3" fill="#E5512A"/>`;
    const hx = L ? ex - 36 : ex + 36;
    svg += `<polyline points="${x + ux * 11},${y + uy * 11} ${ex},${ey} ${hx},${ey}" fill="none" stroke="#2b2420" stroke-width="1.2" opacity=".75"/>`;
    const lx = L ? hx - 302 : hx + 12;
    html += `<div class="call${L ? ' r' : ''}" style="left:${lx}px;top:${ey - 12}px"><span class="k mono">${c.k}</span><span class="z">${c.z}</span></div>`;
  }
  ov.innerHTML = `
  <div class="tl mono"><span><b>NO. 029</b></span><span>黏土 · Clay</span><span>1897 橡皮泥 → 1955 定格黏土动画 → 今天的 3D 黏土字</span></div>
  <div class="tr mono">FRAME 0000 / 1200 · 60 FPS · 第 0 帧</div>
  <div class="title"><h2>CLAY</h2><p><em>按下去，就留在那里。</em><br>黏土是塑性的：不回弹、体积不变，<br>每碰一下都留下指纹。</p></div>
  <svg class="lines" width="1920" height="1080">${svg}</svg>${html}
  <div class="br mono"><b>plastic · volume-preserving · fingerprinted</b><br>RAYMARCHED · 1 KEY LIGHT · 0 TEXTURES · 哑光 + 6% 油光</div>`;
  ov.style.display = '';
}
