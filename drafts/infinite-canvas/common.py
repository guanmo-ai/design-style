CANVAS, DOT, SEL, INK = '#F3F2EE', '#C9C5BA', '#2F6BFF', '#1D1D1F'
STICKY = {'y': '#FFE27A', 'p': '#FFB3C7', 'g': '#B5E8A6', 'b': '#A9D4FF', 'o': '#FFC48A'}
CUR = {'you': '#1D1D1F', 'Mia': '#E8437A', 'Leo': '#1E9E5A', 'Ana': '#7A4DFF'}

CSS = '''
@font-face{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}
@font-face{font-family:Caveat;src:url(../../public/fonts/Caveat.ttf);font-weight:400 700}
@font-face{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Black.otf);font-weight:900}
@font-face{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Bold.otf);font-weight:700}
.cv{position:absolute;inset:0;background-color:%(CANVAS)s;background-image:radial-gradient(%(DOT)s 1.6px,transparent 1.8px);background-size:28px 28px}
.st{position:absolute;padding:16px 18px;box-sizing:border-box;font:600 30px/1.1 Caveat;color:#2a2620;box-shadow:0 2px 3px #0002,0 6px 12px #0001}
.st.drag{box-shadow:0 18px 30px #0003,0 4px 8px #0002}
.fr{position:absolute;background:#fff;border-radius:6px;box-shadow:0 1px 2px #0002,0 0 0 1px #0000000d}
.fl{position:absolute;top:-30px;left:0;font:600 17px Inter;color:#6b675f}
.sel{position:absolute;border:2px solid %(SEL)s}
.sel i{position:absolute;width:14px;height:14px;background:#fff;border:2px solid %(SEL)s;box-sizing:border-box}
.cur{position:absolute;width:0;height:0}
.cur svg{position:absolute;left:-3px;top:-2px;filter:drop-shadow(0 2px 2px #0003)}
.cur b{position:absolute;left:22px;top:26px;font:700 16px Inter;color:#fff;padding:5px 11px;border-radius:12px 12px 12px 3px;white-space:nowrap}
''' % dict(CANVAS=CANVAS, DOT=DOT, SEL=SEL)


def cursor(name, x, y, label=None):
    c = CUR[name]
    return (f'<div class="cur" style="left:{x}px;top:{y}px"><svg width="28" height="32" viewBox="0 0 28 32">'
            f'<path d="M3,2 L3,26 L9.5,20 L14,30 L18.5,28 L14,18.5 L23,18 Z" fill="{c}" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>'
            f'<b style="background:{c}">{label or name}</b></div>')


def sel(x, y, w, h):
    hs = [(0, 0), (w / 2, 0), (w, 0), (w, h / 2), (w, h), (w / 2, h), (0, h), (0, h / 2)]
    return (f'<div class="sel" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px">'
            + ''.join(f'<i style="left:{a - 7}px;top:{b - 7}px"></i>' for a, b in hs) + '</div>')


def sticky(x, y, w, text, col, rot=0, drag=False):
    return (f'<div class="st{" drag" if drag else ""}" style="left:{x}px;top:{y}px;width:{w}px;height:{w}px;background:{STICKY[col]};'
            f'transform:rotate({rot}deg)">{text}</div>')
