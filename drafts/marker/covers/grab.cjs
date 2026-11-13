const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+path.resolve('film.html')+'?mb=1');await p.waitForFunction(()=>window.ready,null,{timeout:120000});
const shots = await p.evaluate(()=>{
  const res={};
  const S=SC[0], f=188, c={x:960,y:640,z:1.55,r:0}, M=camM(c);
  const draw=(filter,bg)=>{ ctx.setTransform(1,0,0,1,0,0); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.clearRect(0,0,1920,1080); if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,1920,1080);}
    const Mp=M; for(const s of S.all){ if(s.t0>f||s.layer!=='paper'||!filter(s)) continue; if(s.kind==='marker') INK.draw(ctx,s,f,Mp,{noSheen:true}); else INK.line(ctx,s,f,Mp); }
    return ctx.canvas.toDataURL('image/png'); };
  // 用纸的变换：只取旋转后的世界（G.paper 已经落定）
  res.flat = draw(s=>!S.speed.includes(s), '#FBFAF6');
  res.sketch = draw(s=>s.kind==='pencil' || (s.tool==='blue'), '#FBFAF6');
  res.car = draw(s=>!S.speed.includes(s) && s.kind!=='pencil' && s.tool!=='blue' && !(s.prof==='flick' && s.kind==='marker' && s.color==='#24262B'), null); res.shadow = draw(s=>s.prof==='flick' && s.kind==='marker' && s.color==='#24262B', '#FBFAF6');
  return res; });
for (const k in shots) fs.writeFileSync('/tmp/claude-0/cv/'+k+'.png', Buffer.from(shots[k].split(',')[1],'base64'));
await b.close(); console.log('ok');})();
