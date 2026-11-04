// node stills.cjs page.html out.png f1,f2,...  → 一张 4 列联系表（每帧 480 宽）
const { chromium } = require('playwright'); const path=require('path');
(async()=>{const [, , inp, out, list]=process.argv;const fr=list.split(',').map(Number);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
p.on('pageerror',e=>console.error('ERR',e.message));p.on('console',m=>console.log('log',m.text()));
await p.goto('file://'+path.resolve(inp));await p.waitForFunction(()=>window.ready===true);
const imgs=[];for(const f of fr){const t=Date.now();await p.evaluate(f=>frame(f),f);imgs.push((await p.screenshot()).toString('base64'));console.log(f,Date.now()-t,'ms')}
const cols=Math.min(4,fr.length),rows=Math.ceil(fr.length/cols);
const q=await b.newPage({viewport:{width:cols*480,height:rows*270}});
await q.setContent(`<body style="margin:0;display:grid;grid-template-columns:repeat(${cols},480px);background:#000">${imgs.map((s,i)=>`<div style="position:relative"><img src="data:image/png;base64,${s}" width=480 height=270><b style="position:absolute;left:4px;top:2px;color:#ff0;font:12px monospace;background:#000">${fr[i]}</b></div>`).join('')}</body>`);
await q.screenshot({path:out});await b.close()})();
