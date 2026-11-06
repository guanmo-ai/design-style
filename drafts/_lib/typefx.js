// 文字“解码”出场 + 给配乐登记“字的事件”（主人 2026-11-06：“文字变得很快，但是少了音效跟它搭配”）。
// TFX.decode(html, f, f0, { rate, lead, glyphs, kind }) —— 从左到右每 rate 帧落定一个字，前沿 lead 个字是乱码；
// 标签和 &实体; 原样保留，只替换 / 隐藏看得见的字。每次调用都按 (f0, 文本) 登记一条 cue：
// [f0, 字数, rate, kind]。页面初始化时把每一帧的 HUD 空跑一遍，window.events() 就能把全部 cue 交给 audio.py，
// 声音和画面用同一份数字：每落定一个字，一声“嗒”。
// TFX.slam(f0, kind) —— 登记一次大字砸下来（规则卡），audio.py 配一记“砸字”。
const TFX = (() => {
  const SETS = { mono: '01<>/\\|_=+*#%$&@', blocks: '░▒▓█▚▞▖▝', dots: '·:∙•◦∘○●' };
  const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
  const tok = s => s.match(/<[^>]*>|&[#a-zA-Z0-9]+;|[\s\S]/gu) || [];
  const cues = new Map();
  function decode(html, f, f0, o = {}) {
    const rate = o.rate ?? 1, lead = o.lead ?? 3, gs = SETS[o.glyphs || 'mono'] || o.glyphs, kind = o.kind || 'type';
    const T = tok(html);
    const vis = T.filter(t => t[0] !== '<' && !/^\s$/.test(t) && t !== '&nbsp;').length;
    const key = f0 + '|' + html.replace(/\d+(\.\d+)?/g, '#');      // 数字会跳（读数）的同一行只登记一次
    if (!cues.has(key)) cues.set(key, [f0, vis, rate, kind]);
    if (f < f0) return '';
    const n = (f - f0) / rate;
    let out = '', i = 0;
    for (const t of T) {
      if (t[0] === '<') { out += t; continue; }
      if (/^\s$/.test(t) || t === '&nbsp;') { if (i < n + lead) out += t; continue; }
      if (i < n) out += t;
      else if (i < n + lead) out += gs[Math.floor(hash(i, Math.floor(f / 2)) * gs.length)];
      i++;
    }
    return out;
  }
  function slam(f0, kind = 'slam') { const key = 'slam|' + f0; if (!cues.has(key)) cues.set(key, [f0, 1, 1, kind]); }
  const list = () => [...cues.values()].sort((a, b) => a[0] - b[0]);
  return { decode, slam, list };
})();
