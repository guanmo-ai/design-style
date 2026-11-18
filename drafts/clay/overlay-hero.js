// 封面（第二版）的标注层：大标题 + 三条能拿走的做法 + 色卡
function overlayHero(scene) {
  const ov = document.getElementById('ov');
  const pr = p => CLAY.project(scene, p, 1920, 1080);
  const M = window.__hero;
  const css = `<style>
  .hv .tl { position:absolute; left:64px; top:50px; font:500 13px GeistMono; letter-spacing:.06em; color:rgba(255,255,255,.72); display:flex; gap:26px; text-transform:uppercase; }
  .hv .tl b { color:#fff; font-weight:700; }
  .hv .tr { position:absolute; right:64px; top:50px; font:500 12px GeistMono; letter-spacing:.06em; color:rgba(255,255,255,.62); }
  .hv .ttl { position:absolute; left:64px; bottom:56px; color:#fff; }
  .hv .ttl h2 { font:600 132px/0.9 Fredoka; letter-spacing:.04em; }
  .hv .ttl p { font:700 30px/1.35 NotoSC; margin-top:16px; }
  .hv .ttl p span { font-weight:400; font-size:19px; color:rgba(255,255,255,.78); display:block; margin-top:8px; }
  .hv .call { position:absolute; width:300px; color:#fff; }
  .hv .call.r { text-align:right; }
  .hv .call .k { display:block; font:700 14px GeistMono; letter-spacing:.02em; }
  .hv .call .k i { font-style:normal; color:#FFC93C; margin-right:8px; }
  .hv .call .z { display:block; font:400 15px/1.55 NotoSC; color:rgba(255,255,255,.85); margin-top:4px; }
  .hv .sw { position:absolute; right:64px; bottom:60px; display:flex; gap:10px; align-items:flex-end; }
  .hv .sw div { width:78px; font:500 11px GeistMono; color:rgba(255,255,255,.8); letter-spacing:.03em; }
  .hv .sw div i { display:block; height:46px; border-radius:23px; margin-bottom:8px; box-shadow:0 6px 14px rgba(10,20,90,.35); }
  .hv .swl { position:absolute; right:64px; bottom:150px; font:500 12px GeistMono; color:rgba(255,255,255,.7); letter-spacing:.06em; text-align:right; }
  </style>`;
  const C = [
    { p: pr(M.nian), dx: 60, dy: -150, side: 'r', k: '<i>01</i>大理石纹 · 揉 3 遍就停', z: '4 色叠在一起揉 3 遍：纹还在、色没混。<br>揉到第 8 遍，就成了一块灰粉。' },
    { p: pr(M.wire), dx: 40, dy: -150, side: 'r', k: '<i>02</i>切泥线 · 0.3 mm 钢丝', z: '一拉到底，切口是平的，<br>纹一点不拖。' },
    { p: pr(M.log), dx: -300, dy: 190, side: 'l', k: '<i>03</i>螺旋截面 · 卷 n 圈 = n 道纹', z: '搓成卷再切：截面上每一圈都是一层。' },
  ];
  let svg = '', html = '';
  for (const c of C) {
    const [x, y] = c.p, ex = x + c.dx, ey = y + c.dy, L = c.side === 'l';
    const len = Math.hypot(c.dx, c.dy), ux = c.dx / len, uy = c.dy / len;
    svg += `<circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="3.4" fill="#FFC93C"/>`;
    const hx = L ? ex - 36 : ex + 36;
    svg += `<polyline points="${x + ux * 12},${y + uy * 12} ${ex},${ey} ${hx},${ey}" fill="none" stroke="#fff" stroke-width="1.3" opacity=".85"/>`;
    const lx = L ? hx - 312 : hx + 12;
    html += `<div class="call${L ? ' r' : ''}" style="left:${lx}px;top:${ey - 12}px"><span class="k">${c.k}</span><span class="z">${c.z}</span></div>`;
  }
  const sw = [['#FF5A2E', '橘'], ['#FF9EC0', '粉'], ['#FFC93C', '黄'], ['#FFF1DC', '奶白'], ['#3A50EE', '底 · 钴蓝']]
    .map(([h, nm]) => `<div><i style="background:${h}"></i>${h}<br>${nm}</div>`).join('');
  ov.innerHTML = `${css}<div class="hv">
  <div class="tl"><span><b>NO. 029</b></span><span>黏土 · Clay</span><span>揉 · 搓 · 切 · 按</span></div>
  <div class="tr">第 0 帧 · 60 FPS · 光线步进 · 0 贴图</div>
  <svg style="position:absolute;inset:0" width="1920" height="1080">${svg}</svg>${html}
  <div class="ttl"><h2>CLAY</h2><p>切开，才看见它是怎么揉的。<span>不回弹、体积不变——手在泥上做过的每件事，都留在里面。</span></p></div>
  <div class="swl">揉进去的 4 色 + 底</div>
  <div class="sw">${sw}</div></div>`;
  ov.style.display = '';
}
