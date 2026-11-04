// 字符画候选共用：解析式光线求交（星球 + 环 + 卫星）、字符阶梯、配色
const RAMP = " .,:;-~=+*o#%&8@";
function norm(v){const l=Math.hypot(...v);return v.map(x=>x/l)}
function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]}
function mul(a,s){return [a[0]*s,a[1]*s,a[2]*s]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function rampChar(L){L=Math.max(0,Math.min(1,L));return RAMP[Math.min(RAMP.length-1,Math.floor(L*(RAMP.length-1)+0.5))]||' '}
function lerpHex(stops,t){
  t=Math.max(0,Math.min(1,t));
  for(let k=1;k<stops.length;k++){const [t1,c1]=stops[k];const [t0,c0]=stops[k-1];
    if(t<=t1){const f=(t-t0)/(t1-t0||1);const a=hex(c0),b=hex(c1);return `rgb(${a.map((x,i)=>Math.round(x+(b[i]-x)*f)).join(',')})`}}
  return stops[stops.length-1][1];
}
function hex(h){return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16))}
const HOT=[[0,'#2A1A8C'],[0.22,'#5B2BFF'],[0.42,'#FF2D8A'],[0.62,'#FF6A1A'],[0.8,'#FFC531'],[1,'#FFF8E1']];
const COOL=[[0,'#1B2A6B'],[0.35,'#2F6BFF'],[0.65,'#38E1FF'],[1,'#F2FFFF']];
const MOON=[[0,'#2B2547'],[0.6,'#9C8CFF'],[1,'#F3EEFF']];
function heat(L,kind){return lerpHex(kind===2?COOL:kind===3?MOON:HOT,L)}

// 场景：原点星球半径 R，倾斜的环（内 RI 外 RO），一颗小卫星
const P={R:1.0,RI:1.3,RO:2.05,moon:[0.42,0.6,-1.6],mr:0.14};
// 环平面法线：先朝镜头倒 0.42 rad（看得见环面），再绕视线转 0.38 rad（斜着穿过画面）
function rotX(v,a){return [v[0],v[1]*Math.cos(a)-v[2]*Math.sin(a),v[1]*Math.sin(a)+v[2]*Math.cos(a)]}
function rotZ(v,a){return [v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a),v[2]]}
const RN=norm(rotZ(rotX([0,1,0],-0.17),0.2));
function hitSphere(o,d,c,r){const oc=sub(o,c);const b=dot(oc,d);const q=dot(oc,oc)-r*r;const h=b*b-q;if(h<0)return -1;const t=-b-Math.sqrt(h);return t>1e-4?t:-1}
function hitRing(o,d){const den=dot(d,RN);if(Math.abs(den)<1e-6)return -1;const t=-dot(o,RN)/den;if(t<=1e-4)return -1;const p=add(o,mul(d,t));const r=Math.hypot(...p);return (r>P.RI&&r<P.RO)?t:-1}
function ringAlbedo(r){
  const x=(r-P.RI)/(P.RO-P.RI);
  let a=0.55+0.35*Math.sin(x*38)+0.15*Math.sin(x*97);
  if(x>0.58&&x<0.64)a*=0.08;     // 卡西尼缝
  if(x<0.06||x>0.95)a*=0.4;
  return Math.max(0,Math.min(1,a));
}
function march(S,u,v){
  const o=S.cam.pos;const f=norm(sub(S.cam.look,o));const r=norm(cross([0,1,0],f));const up=cross(f,r);
  const d=norm(add(f,mul(add(mul(r,u),mul(up,v)),S.cam.fov)));
  const ts=hitSphere(o,d,[0,0,0],P.R), tr=hitRing(o,d), tm=hitSphere(o,d,P.moon,P.mr);
  let best=-1,kind=0;
  for(const [t,k] of [[ts,1],[tr,2],[tm,3]]) if(t>0&&(best<0||t<best)){best=t;kind=k}
  if(kind===0)return{L:0,kind:0};
  const p=add(o,mul(d,best));const Ld=S.light;
  if(kind===1){
    const n=norm(p);let diff=Math.max(0,dot(n,Ld));
    const lat=Math.asin(n[1]);const lon=Math.atan2(n[2],n[0]);
    const band=0.72+0.18*Math.sin(lat*11+0.8*Math.sin(lon*2+lat*5))+0.1*Math.sin(lat*31);
    // 环投在星球上的影子
    if(hitRing(add(p,mul(n,1e-3)),Ld)>0){const q=add(p,mul(Ld,hitRing(add(p,mul(n,1e-3)),Ld)));diff*=1-0.45*ringAlbedo(Math.hypot(...q))}
    const h=norm(sub(Ld,d));const spec=Math.pow(Math.max(0,dot(n,h)),40)*0.55;
    const rim=Math.pow(1-Math.max(0,-dot(n,d)),2.5)*0.32;
    const fill=Math.max(0,dot(n,norm([0.7,-0.45,-0.3])))*0.3;
    return{L:Math.min(1,0.06+diff*band*0.95+spec+rim+fill*band),kind};
  }
  if(kind===2){
    const rr=Math.hypot(...p);let a=ringAlbedo(rr);
    let lit=Math.abs(dot(RN,Ld))*0.6+0.5;
    if(hitSphere(p,Ld,[0,0,0],P.R)>0)lit*=0.12;   // 星球投在环上的影子
    return{L:Math.min(1,a*lit*0.95),kind: a<0.05?0:kind};
  }
  const n=norm(sub(p,P.moon));const diff=Math.max(0,dot(n,Ld));
  return{L:0.04+diff*0.92,kind};
}
// 把文字画到全尺寸画布，再按格子取覆盖率
function textMask(cols,rows,CW,CH,items){
  const c=document.createElement('canvas');c.width=Math.ceil(cols*CW);c.height=Math.ceil(rows*CH);
  const g=c.getContext('2d');g.fillStyle='#fff';g.textBaseline='alphabetic';
  for(const it of items){g.font=it.font;g.fillText(it.t,it.x,it.y)}
  const img=g.getImageData(0,0,c.width,c.height).data;const out=new Float32Array(cols*rows);
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let s=0,n=0;
    for(let a=0;a<3;a++)for(let b=0;b<3;b++){const x=Math.floor(i*CW+(a+0.5)*CW/3),y=Math.floor(j*CH+(b+0.5)*CH/3);if(x<c.width&&y<c.height){s+=img[(y*c.width+x)*4+3]/255;n++}}
    out[j*cols+i]=n?s/n:0}
  return out;
}

// 在一块画布上画字符星球：opts {cw, ch, fs, bg, ink(L,kind)→颜色, invert, cx, cy, scale, scan}
function renderAscii(cv, o){
  const g=cv.getContext('2d');const W=cv.width,H=cv.height;
  if(o.bg){g.fillStyle=o.bg;g.fillRect(0,0,W,H)}
  g.textBaseline='top';g.font=`700 ${o.fs}px JBM`;
  const cols=Math.ceil(W/o.cw),rows=Math.ceil(H/o.ch);const rng=mulberry(o.seed||5);
  const S={cam:{pos:[0,0.25,-5.4],fov:o.fov||0.47,look:[0,0,0]},light:norm(o.light||[-0.62,0.58,-0.55])};
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const x=i*o.cw,y=j*o.ch;const u=((x+o.cw/2)-W*(o.cx||0.5))/H,v=-((y+o.ch/2)-H*(o.cy||0.5))/H;
    const {L,kind}=march(S,u,v);
    if(kind===0){if(o.stars&&rng()<0.012){g.fillStyle=o.stars;g.fillText('.',x,y)}continue}
    let ch=rampChar(o.invert?0.2+0.8*(1-L):L),col=o.ink(L,kind);
    if(o.scan&&i>cols*o.scan){ch='!<>-_\\/[]{}=+*^?#01'[Math.floor(rng()*19)];col=o.scanInk}
    if(ch===' ')continue;
    g.shadowBlur=o.glow&&L>0.82?o.glow:0;g.shadowColor=col;g.fillStyle=col;g.fillText(ch,x,y);
  }
  g.shadowBlur=0;
}
