// kit/hud.js — 画面上的字和框（任何风格都能用；依赖 motion.js、../typefx.js、hud.css）。
// 每一块都是可选的：章节外框、参数、规则卡、大数字、标注线、手机框、说明块、手指、片尾署名。不调就不出现。
// 所有的字都走 TFX.decode（从左到右“解码”出来，每落定一个字登记一个声音 cue）——页面初始化时把每一帧空跑一遍，配乐就拿到全部出字时间。
const HUD = (() => {
  const $ = id => document.getElementById(id), D = (h, f, f0, o) => TFX.decode(h, f, f0, o);
  // 把 HUD 的骨架插到舞台里（canvas 后面）
  function mount(stage = $('stage')) {
    stage.insertAdjacentHTML('beforeend', '<div id="hud"><div id="chap"></div><div id="prog"></div><div id="params"></div><div id="big"></div><div id="uiwrap"><div id="phone"></div><div id="spec"></div></div><div id="cursor"></div><div id="end"></div></div>');
  }
  const fonts = (sample = '毛绒Aa1') => Promise.all(['ZCOOL', 'GeistMono', 'NotoSC', 'Unbounded'].map(n => document.fonts.load(`700 40px ${n}`, sample))).then(() => document.fonts.ready);
  // 整层：dark = 浅色背景上用深色字；fade = 整层透明度（片尾淡出）
  function layer({ dark = false, fade = 1 } = {}) { const H = $('hud'); H.classList.toggle('dark', dark); H.style.opacity = fade; }
  // 左上章节（编号 / 标题 / 一句话）+ 右上进度。chapters = [[起始帧, 编号, 标题, 一句话], …]
  // o: total = 进度里的总章数（'07'）；firstAt = 第一章的字第几帧出来；hide = 这一帧不显示章节；noProgress = 不显示进度；progress = 0—1
  function chapter(f, chapters, { total, firstAt = 14, hide = false, noProgress = false, progress = 0 }) {
    const ci = chapterAt(chapters, f), [c0, no, ti, sub] = chapters[ci], cs = ci === 0 ? firstAt : c0;
    $('chap').innerHTML = hide ? '' : `<div class="no">${D(no + ' / ' + total, f, cs, { kind: 'small' })}</div><div class="ti">${D(ti, f, cs + 2, { rate: 2.5, kind: 'title' })}</div><div class="sub">${D(sub, f, cs + 12, { rate: 0.8 })}</div>`;
    $('prog').innerHTML = noProgress ? '' : `<i><b style="width:${Math.min(100, progress * 100).toFixed(1)}%"></b></i>${no} / ${total}`;
    return ci;
  }
  // 左下：这一段的参数。list = [[从第几帧, 到第几帧, [一行, 一行…]], …]
  function params(f, list) {
    const pr = list.find(p => f >= p[0] && f < p[1]);
    $('params').innerHTML = pr ? pr[2].map((l, i) => `<div class="mono">${D(l, f, pr[0] + i * 12, { rate: 0.7 })}</div>`).join('') : '';
  }
  // —— 下面四个返回 HTML，拼起来交给 big() ——
  // 规则卡：大字 7 帧从 1.5 倍砸到原大（登记一次“砸字”的声音），小字跟着解码。tag = { on, onText, offText } 是“关 / 开”的小标签；out = 0—1 收走
  function ruleCard(f, { at, label, word, subs, tag = null, out = 0 }) {
    const k = prog(f, at, at + 7), sc = lerp(1.5, 1, ease.out5(k)); TFX.slam(at);
    const t = tag ? `<span class="tag ${tag.on ? 'on' : ''}">${tag.on ? tag.onText : tag.offText}</span>` : '';
    return `<div class="rno">${D(label, f, at, { kind: 'small' })}${f >= at + 4 ? t : ''}</div><div class="word" style="transform:scale(${sc.toFixed(3)});opacity:${(Math.min(1, k * 3) * (1 - out)).toFixed(2)}">${word}</div>`
      + `<div class="rsub mono" style="opacity:${(1 - out).toFixed(2)}">${subs.map((l, i) => `<div>${D(l, f, at + 9 + i * 9, { rate: 0.6 })}</div>`).join('')}</div>`;
  }
  // 右下的大数字（会跳的读数）
  const count = (f, { text, at, prefix = '×&thinsp;', unit = '' }) => `<div class="count">${prefix}${D(text, f, at, { rate: 1 })}<small>${unit}</small></div>`;
  // 标注线：p = 屏幕上的点（用 proj(VP, 3D 点) 算），字在它右边
  const callout = (f, { p, text, at, opacity = 1 }) => `<div class="call mono" style="left:${p[0] + 120}px;top:${p[1] - 20}px;opacity:${opacity}">${D(text, f, at, { rate: 0.7 })}</div>`;
  const big = html => { $('big').innerHTML = html; };
  // 手机框 + 旁边的说明块。show = 这一帧有没有；y = 手机往下偏多少像素（弹上来 / 滑下去）；wrap = 整层的 transform（镜头贴着墙推拉时用 wallCam().css）；
  // inner = 屏幕里的内容（HTML，自己排）；blocks = [[第几帧出现, 名字, [一行…]], …]，tops = 每块的 top，active = 现在讲到第几块
  function phone(f, { show, y = 0, wrap = '', inner = '', time = '9:41', blocks = [], tops = [], active = 0, specOpacity = 1 }) {
    const ph = $('phone'), sp = $('spec');
    ph.style.display = sp.style.display = show ? 'block' : 'none';
    if (!show) return;
    ph.style.transform = `translateY(${y.toFixed(1)}px)`;
    $('uiwrap').style.transform = wrap;
    ph.innerHTML = `<div class="isl"></div><div class="time">${time}</div>${inner}`;
    sp.style.opacity = specOpacity;
    sp.innerHTML = blocks.map(([t, name, ls], i) => f < t ? '' : `<div class="b" style="top:${tops[i]}px;opacity:${i === active ? 1 : i === active - 1 ? 0.35 : 0}"><div class="t"><span>0${i + 1}</span>${D(name, f, t, { rate: 3, kind: 'title' })}</div>${ls.map((l, j) => `<div class="l mono">${D(l, f, t + 8 + j * 9, { rate: 0.6 })}</div>`).join('')}</div>`).join('');
  }
  // 手指：p = 屏幕上的点（null = 不显示），press = 正按着
  function cursor(p, press = false) {
    const cu = $('cursor'); cu.style.display = p ? 'block' : 'none';
    if (p) { cu.style.left = p[0].toFixed(1) + 'px'; cu.style.top = p[1].toFixed(1) + 'px'; cu.style.transform = `scale(${press ? 0.78 : 1})`; }
  }
  // 片尾：一行英文 + 署名（最后一帧要看得到“观默”）
  function endCard(f, { at, en, by = '每天一个设计风格 · 观默 @guanmo_ai', signAt }) {
    $('end').innerHTML = f < at ? '' : `<div class="en">${D(en, f, at, { rate: 3, kind: 'title' })}</div><div class="by">${D(by, f, signAt, { rate: 1.2 })}</div>`;
  }
  return { mount, fonts, layer, chapter, params, ruleCard, count, callout, big, phone, cursor, endCard, D };
})();
