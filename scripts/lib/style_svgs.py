"""020/021 的可编辑 SVG 图解；字体与 PNG 使用项目统一构建器。"""
from pathlib import Path
from html import escape
import math, json, subprocess

W,H=1080,1350
MONO='JetBrains Mono'
SC='Noto Sans SC'

def text(x,y,size,s,color,weight=500,font=SC,anchor='start'):
    return f'<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{escape(str(s))}</text>'

def rect(x,y,w,h,color,r=0,stroke=None):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{color}"'+(f' stroke="{stroke}" stroke-width="2"' if stroke else '')+'/>'

def line(x1,y1,x2,y2,c,w=2):
    return f'<path d="M{x1} {y1}L{x2} {y2}" fill="none" stroke="{c}" stroke-width="{w}"/>'

def circle(x,y,r,c):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>'

def group(x,y,scale,body):return f'<g transform="translate({x} {y}) scale({scale})">{body}</g>'

class Sheets:
    def __init__(self,base,kind):
        self.base,self.kind=Path(base),kind
        self.ascii=kind=='ascii'
        self.bg='#06060A' if self.ascii else '#F3EEE2'
        self.ink='#FFF6DA' if self.ascii else '#161616'
        self.mute='#ACADD0' if self.ascii else '#625E54'
        self.panel='#12121F' if self.ascii else '#FFF9EF'
        self.border='#35354D' if self.ascii else '#CFC7B7'
        self.accent='#FF8A3D' if self.ascii else '#E8392B'
        self.blue='#7CC6F2' if self.ascii else '#2346E0'
        self.no='020' if self.ascii else '021'
        self.name='字符画' if self.ascii else '生成艺术'
        self.en='ASCII ART' if self.ascii else 'GENERATIVE ART'
        self.signature='先乱码，再落定。' if self.ascii else '从一个点长出来。'
        self._flows={}

    def t(self,x,y,size,s,c=None,w=500,font=SC):return text(x,y,size,s,c or self.ink,w,font)
    def box(self,x,y,w,h):return rect(x,y,w,h,self.panel,16,self.border)
    def flow(self,seed=7):
        if seed not in self._flows:
            code="const vm=require('node:vm'),fs=require('node:fs');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(process.argv[1],'utf8')+';globalThis.result=build('+process.argv[2]+',PAL_A.filter(p=>p[0]!==\"#1F9E6A\"),0).ribbons;',c);process.stdout.write(JSON.stringify(c.result));"
            paths=json.loads(subprocess.check_output(['node','-e',code,str(self.base/'video/lib.js'),str(seed)]))
            self._flows[seed]=''.join(f'<path d="M'+ 'L'.join(f'{x:.1f},{y:.1f}' for x,y in p['pts'])+f'" fill="none" stroke="{p["c"]}" stroke-width="{p["w"]}" stroke-linecap="round" stroke-linejoin="round"/>' for p in paths)
        return self._flows[seed]
    def flow_panel(self,x,y,w,h,seed=7):
        key=f'c{x}-{y}-{seed}'
        return f'<defs><clipPath id="{key}">{rect(x,y,w,h,"white",12)}</clipPath></defs><g clip-path="url(#{key})">'+rect(x,y,w,h,'#F3EEE2')+f'<g transform="translate({x} {y}) scale({w/1920} {h/1080})">'+self.flow(seed)+'</g></g>'
    def donut(self,cx,cy,scale=120,fs=15):
        # 与原片相同的圆环表面投影、深度缓冲和亮度字符阶梯。
        A,B=1.0,0.3; ca,sa,cb,sb=math.cos(A),math.sin(A),math.cos(B),math.sin(B)
        out={}; ramp='.,-~:;=!*#$@'; cw=fs*.6
        for ti in range(140):
            th=ti*math.tau/140; ct,st=math.cos(th),math.sin(th)
            for pi in range(420):
                ph=pi*math.tau/420; cp,sp=math.cos(ph),math.sin(ph)
                h=ct+2; D=1/(sp*h*sa+st*ca+5); tt=sp*h*ca-st*sa
                x,y=(scale*D*(cp*h*cb-tt*sb),-scale*D*(cp*h*sb+tt*cb))
                i,j=math.floor(x/cw),math.floor(y/fs)
                N=(st*sa-sp*ct*ca)*cb-sp*ct*sa-st*ca-cp*ct*sb
                if (i,j) not in out or D>out[i,j][0]:out[i,j]=(D,max(0,min(1,N/1.414)))
        buf=[]
        for (i,j),(_,L) in out.items():
            if L<.03:continue
            c=['#5B2BFF','#FF2D8A','#FF6A1A','#FFC531','#FFF8E1'][min(4,int(L*5))]
            buf.append(text(cx+i*cw,cy+j*fs,fs,ramp[min(11,int(L*11.99))],c,700,MONO))
        return ''.join(buf)
    def header(self,tag,title,sub):
        b=rect(0,0,W,H,self.bg)
        b+=self.t(64,68,17,f'DESIGN STYLE / {self.no} / {tag}',self.accent,700,MONO)
        b+=text(1016,62,25,'观默',self.ink,900,SC,'end')+text(1016,90,15,'@guanmo_ai',self.mute,500,MONO,'end')
        b+=self.t(64,191,74,title,w=900)+self.t(66,242,24,sub,self.mute)
        return b
    def footer(self):
        return line(64,1255,1016,1255,self.border)+self.t(64,1298,17,self.en,self.accent,700,MONO)+text(1016,1298,19,self.signature,self.mute,500,SC,'end')
    def save(self,name,body):
        p=self.base/'images'/f'{name}.svg'
        p.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><title>{self.name} · {name}</title><defs></defs>{body}{self.footer()}</svg>')

    def poster(self):
        b=self.header('01 / POSTER',self.name,'没有像素，只有字。' if self.ascii else '不画画，写规则。')
        if self.ascii:
            b+=self.box(64,290,952,650)+self.donut(540,610,440,14)
            b+=self.t(100,888,21,'.,-~:;=!*#$@',self.accent,700,MONO)
            cards=[('亮度 → 字符','暗处稀疏，亮处饱满'),('0.6em × 1em','固定字格，改变字形'),('decode → settle','先扰动，再按顺序锁定')]
        else:
            b+=self.flow_panel(64,290,952,650,7)
            cards=[('FIELD','每一点，都有一个方向'),('SEED','同一个种子，同一张画'),('GAP = 5px','留出空隙，碰到就停')]
        for i,(en,zh) in enumerate(cards):
            x=64+i*324
            b+=self.box(x,975,304,208)+self.t(x+24,1035,20,en,self.accent,700,MONO)+self.t(x+24,1090,22,zh)+self.t(x+24,1146,16,f'0{i+1} / RULE',self.mute,500,MONO)
        self.save('poster',b)
    def cheatsheet(self):
        b=self.header('02 / RULES','五条规则','每条规则，都能在画面里看见。')
        rules=[('越亮，字越满','先算亮度，再选择字符。','ch = ramp[floor(L * 11)]'),('固定等宽字格','字格位置不动，形状才不乱。','cell = 0.6em * 1em'),('颜色跟着光走','用同一份亮度选择颜色。','color = palette[L]'),('位置不动，只换字','加载、呼吸、转圈都能复用。','glyph = sample(x, y, t)'),('先乱码，再落定','逐字锁定；完成后显示原文。','noise -> resolve -> hold')] if self.ascii else [('换种子，换一张画','规则不变，只换随机数起点。','seed = 0x2A7F'),('同种子，可复现','保留种子、参数和生成器版本。','random(seed)'),('加权色板','比例决定气质，别平均分色。','pick(palette, weights)'),('留间距，才透气','有占用网格，才知道哪里该停。','step = 4px; gap = 5px'),('大的先放，小的填缝','少量大形定结构，小形补节奏。','large -> medium -> small')]
        for i,(title,desc,code) in enumerate(rules):
            y=290+i*184
            b+=self.box(64,y,952,164)+self.t(92,y+62,44,f'{i+1:02}',self.accent,700,MONO)
            b+=self.t(212,y+48,28,title,w=900)+self.t(212,y+88,21,desc,self.mute)+self.t(212,y+130,18,code,self.blue,700,MONO)
        self.save('cheatsheet',b)
    def app(self):
        b=self.header('03 / ON PHONE','用在手机上','五种小动效，一套视觉语法。')
        b+=rect(90,302,366,840,self.ink,48)+rect(100,312,346,820,self.bg,40)
        b+=rect(214,326,118,22,self.ink,11)+self.t(126,402,23,'ASCII RADIO' if self.ascii else 'SEED SONG',self.accent,700,MONO)
        if self.ascii:
            b+=self.donut(274,603,210,11)
            b+=self.t(132,843,24,'NOW PLAYING',self.blue,700,MONO)
            b+=self.t(132,895,29,'先乱码，再落定',w=900)
            b+=self.t(130,958,17,'[======....]  60%',self.mute,700,MONO)
            b+=self.t(173,1040,28,'<<  [>]  >>',self.accent,700,MONO)
            items=[('01 / 加载','旋转字符 + 进度条'),('02 / 按钮','按下，先乱码再确认'),('03 / 骨架屏','逐行解码出真实内容'),('04 / 正在输入','.  ..  ...  循环'),('05 / 完成提示','[+] saved  短暂锁定')]
        else:
            b+=self.flow_panel(126,439,294,330,13)+self.t(126,832,30,'Seed Song',w=900)
            b+=self.t(126,875,17,'cover = seed(13)',self.mute,500,MONO)+line(130,956,414,956,self.border,3)+circle(235,956,7,self.accent)
            b+=circle(273,1030,35,self.accent)+text(273,1041,26,'II','#FFF9EF',700,MONO,'middle')
            items=[('01 / 头像','每个用户，一颗种子'),('02 / 封面','同一规则，生成系列'),('03 / 加载','从一个点逐渐长出'),('04 / 票券','用种子记录视觉身份'),('05 / 完成','图形收拢，给出反馈')]
        for i,(title,desc) in enumerate(items):
            y=310+i*170
            b+=self.box(510,y,506,146)+self.t(540,y+48,25,title,self.accent,900)+self.t(540,y+98,23,desc)
        self.save('app-ui',b)
    def steps(self):
        b=self.header('04 / BUILD IT','四步，做出来','从一条规则，到可以复用的视觉。')
        titles=['取样亮度','放进字格','统一配色','按时间解码'] if self.ascii else ['固定种子','定义方向场','沿方向前进','留间距再停下']
        subs=['L = normal · light','cell = 0.6 × 1','palette[L]','resolve(x, y, t)'] if self.ascii else ['seed = 7','angle(x, y)','p += direction * 4','gap = 5px']
        for i in range(4):
            x=64+(i%2)*488;y=292+(i//2)*468
            b+=self.box(x,y,464,442)+self.t(x+28,y+50,20,f'0{i+1} / {titles[i]}',self.accent,700)+self.t(x+28,y+394,18,subs[i],self.mute,500,MONO)
            if self.ascii:
                if i==0:
                    for n in range(10):
                        v=round(30+n*22);b+=rect(x+28+n*40,y+102,38,180,f'rgb({v},{v},{v})')
                elif i==1:
                    for row in range(6):
                        for col in range(12):
                            xx=x+28+col*34;yy=y+92+row*39
                            b+=rect(xx,yy,31,37,'none',0,self.border)+self.t(xx+7,yy+28,24,'.:-=+*#%@'[min(8,(col+row)//2)],self.ink,700,MONO)
                elif i==2:b+=self.donut(x+232,y+215,275,11)
                else:
                    for n,s in enumerate(['?1$#_+%','AS#_+%?','ASCI_?!','ASCII !']):b+=self.t(x+38,y+125+n*51,31,s,self.accent if n==3 else self.mute,700,MONO)
            else:
                if i==0:b+=self.flow_panel(x+26,y+90,412,252,7)
                elif i==1:
                    for yy in range(4):
                        for xx in range(7):
                            px=x+46+xx*57;py=y+119+yy*58;a=math.sin(xx*.4)+math.cos(yy*.7)
                            dx,dy=21*math.cos(a),21*math.sin(a)
                            b+=line(px-dx/2,py-dy/2,px+dx/2,py+dy/2,self.blue,3)+circle(px+dx/2,py+dy/2,4,self.accent)
                elif i==2:
                    for k in range(7):
                        pts=[(x+30+n*5,y+108+k*30+20*math.sin(n*.06+k*.6)) for n in range(80)]
                        b+='<path d="M'+'L'.join(f'{a:.1f} {z:.1f}' for a,z in pts)+f'" fill="none" stroke="{[self.accent,self.blue,"#FF8FB8"][k%3]}" stroke-width="13"/>'
                else:
                    b+=rect(x+35,y+128,310,38,self.accent,19)+rect(x+35,y+190,240,38,self.blue,19)+rect(x+35,y+252,352,38,'#FFC530',19)
                    b+=self.t(x+295,y+221,20,'stop',self.mute,700,MONO)
        self.save('steps',b)
    def build(self):
        self.poster();self.cheatsheet();self.app();self.steps()
