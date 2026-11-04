// 生成艺术候选：流场色带（界面图用）。drawFlow(ctx, W, H, {seed, pal, wid, freq, step, gap, count, bg, rot})
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const PAL_MAIN=[['#E8392B',14],['#FF7A1A',10],['#FFC530',12],['#FF8FB8',8],['#2346E0',12],['#7CC6F2',8],['#1F9E6A',7],['#161616',8],['#FFFFFF',6]];
function drawFlow(g,W,H,o){
  const rnd=mulberry(o.seed||1),f=o.freq||1,rot=o.rot||0;
  const ang=(x,y)=>rot+1.25*Math.sin(x*0.0019*f+0.4+o.seed%7)+0.9*Math.cos(y*0.0026*f-x*0.0009*f+1.1)+0.45*Math.sin((x*0.6+y)*0.0042*f)-0.35;
  const pal=o.pal||PAL_MAIN,wid=o.wid||[[6,20],[10,26],[16,18],[26,12],[40,8],[64,4]];
  const pickW=()=>{let s=wid.reduce((a,b)=>a+b[1],0)*rnd();for(const [w,k] of wid){if((s-=k)<0)return w}return wid[0][0]};
  const pick=()=>{let s=pal.reduce((a,b)=>a+b[1],0)*rnd();for(const [c,w] of pal){if((s-=w)<0)return c}return pal[0][0]};
  const CS=3,GW=Math.ceil(W/CS)+2,GH=Math.ceil(H/CS)+2,occ=new Int32Array(GW*GH).fill(-1);
  const each=(x,y,r,fn)=>{const r2=r*r;for(let yy=Math.floor((y-r)/CS);yy<=Math.ceil((y+r)/CS);yy++)for(let xx=Math.floor((x-r)/CS);xx<=Math.ceil((x+r)/CS);xx++){
    if(xx<0||yy<0||xx>=GW||yy>=GH)continue;const dx=xx*CS-x,dy=yy*CS-y;if(dx*dx+dy*dy<=r2&&fn(yy*GW+xx)===false)return false}return true};
  const free=(x,y,r,id)=>each(x,y,r,k=>!(occ[k]!==-1&&occ[k]!==id));
  const mark=(x,y,r,id)=>each(x,y,r,k=>{occ[k]=id});
  const STEP=o.step||4,GAP=o.gap||5;const out=[];
  if(o.bg){g.fillStyle=o.bg;g.fillRect(0,0,W,H)}
  for(let n=0;n<(o.tries||6000);n++){
    const w=pickW()*(o.scale||1);const x0=rnd()*(W+100)-50,y0=rnd()*(H+100)-50;
    if(!free(x0,y0,w/2+GAP,-2))continue;
    const id=out.length;const pts=[[x0,y0]];
    for(const dir of [1,-1]){let x=x0,y=y0;
      for(let s=0;s<200;s++){const a=ang(x,y);const nx=x+Math.cos(a)*STEP*dir,ny=y+Math.sin(a)*STEP*dir;
        if(nx<-80||nx>W+80||ny<-80||ny>H+80)break;if(!free(nx,ny,w/2+GAP,id))break;
        mark(x,y,w/2+GAP*0.3,id);x=nx;y=ny;dir>0?pts.push([x,y]):pts.unshift([x,y])}}
    if(pts.length*STEP<Math.max(40,w*4))continue;
    pts.forEach(p=>mark(p[0],p[1],w/2+GAP*0.3,id));
    const c=pick();out.push(1);
    g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';
    g.beginPath();g.moveTo(...pts[0]);for(const p of pts)g.lineTo(...p);g.stroke();
  }
  return out.length;
}
