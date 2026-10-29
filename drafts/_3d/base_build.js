// ---------- 底座和路面：一块块拼出来（逐块动画，时间轴见 anim_timeline.js 的 PIECES） ----------
const PIECES = [];
// pivot：'b' 底面中心（落下 / 翻转 / 弹出），'l' 左端（从左往右铺开）
function P(w, h, d, x, y, z, color, type, t0, dur = 0.34, o = {}, pivot = 'b') {
  const g = new THREE.BoxGeometry(w, h, d).translate(pivot === 'l' ? w / 2 : 0, h / 2, 0);
  const m = mesh(g, typeof color === 'string' ? mat(color, o) : color, o);
  m.position.set(pivot === 'l' ? x - w / 2 : x, y, z);
  m.userData = { type, t0, dur, y, x: m.position.x };
  scene.add(m); PIECES.push(m); return m;
}
// 1) 底板和顶面的木框：第 0 帧底板刚落地、正压扁
P(26, 1.2, 26, 0, -4.4, 0, '#FFF7EC', 'drop', -0.32, 0.4, { rough: .6 });
P(25.4, 0.15, 25.4, 0, -3.25, 0, '#F6EBDA', 'drop', -0.18, 0.34);
// 2) 土层：每层切成四块，从左边一块块推进来，一层压一层
{
  const layers = [['#C99A72', 1.4], ['#DDB48A', 0.9], ['#EED0A6', 0.5], ['#A9C98A', 0.25]];
  let ly = -3.1;
  layers.forEach(([c, h], li) => {
    for (let k = 0; k < 4; k++) P(5.96, h, 24, -9 + k * 6, ly, 0, c, 'slide', -0.12 + li * 0.13 + k * 0.045, 0.32);
    ly += h;
  });
  for (let i = 0; i < 70; i++) {   // 切面上的小石子：土层铺好后一颗颗“啵”出来
    const s = 0.15 + R() * 0.3, side = R() < .5;
    const m = mesh(lowpoly(new THREE.DodecahedronGeometry(s, 0), s * .3, i), mat('#C9B6A4'));
    m.position.set(side ? -12 + R() * 24 : 12.02, -2.9 + R() * 2.2, side ? 12.02 : -12 + R() * 24);
    m.userData = { type: 'pop', t0: 0.55 + R() * 0.6, dur: 0.25, y: m.position.y, x: m.position.x }; scene.add(m); PIECES.push(m);
  }
}
// 3) 后半块地面：2×2 的方砖，从左后角像波浪一样落下
for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) {
  const x = -11 + i * 2, z = -11 + j * 2;
  P(1.96, 0.1, 1.96, x, 0, z, (i + j) % 2 ? '#E9DFCB' : '#E2D5BD', 'drop', 0.4 + (i + j) * 0.028, 0.3);
}
// 4) 人行道：一块块方砖翻着落下（翻 180°），从左往右一排排铺
for (const [z0, lag] of [[0, 0.62], [9, 0.78]]) for (let i = 0; i < 24; i++) for (let j = 0; j < 3; j++) {
  const x = -11.5 + i, z = z0 + 0.5 + j;
  P(0.96, 0.18, 0.96, x, 0, z, (i + j) % 2 ? '#EFE4D2' : '#F7EEE0', 'flip', lag + i * 0.022 + j * 0.03, 0.3);
}
// 5) 柏油：十二条，从左往右“刷”开；路缘石跟着拉出来
for (let i = 0; i < 12; i++) P(2.0, 0.02, 6, -11 + i * 2, 0, 6, '#B9B6C6', 'unroll', 0.95 + i * 0.035, 0.2, { rough: .8 }, 'l');
P(24, 0.24, 0.2, 0, 0, 3.0, '#9E968C', 'unroll', 1.0, 0.45, {}, 'l'); P(24, 0.24, 0.2, 0, 0, 9.0, '#9E968C', 'unroll', 1.08, 0.45, {}, 'l');
// 6) 中线一段段弹出，斑马线一条条翻下来
{ let k = 0; for (let x = -11; x < 12; x += 2.4) P(1.2, 0.03, 0.18, x, 0.01, 6, '#E8E2D0', 'pop', 1.3 + (k++) * 0.03, 0.22); }
for (let k = 0; k < 7; k++) P(0.55, 0.03, 5.2, 5.2 + k * 0.95, 0.01, 6, '#EDE8DA', 'flip', 1.38 + k * 0.05, 0.28);
