LEATHER, STITCH, LINEN, ALU, INKB = '#5A3622', '#E9D9B6', '#DCD5C6', '#C9CDD2', '#1C1C1E'

FONTS = '''
@font-face{font-family:Heros;src:url(../../public/fonts/TeXGyreHeros-Bold.otf);font-weight:700}
@font-face{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}
@font-face{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Bold.otf);font-weight:700}
@font-face{font-family:NotoSCB;src:url(../../public/fonts/NotoSansSC-Black.otf);font-weight:900}
@font-face{font-family:Caveat;src:url(../../public/fonts/Caveat.ttf);font-weight:400 700}
'''


def leather(w, h, base=LEATHER, seed=3, light_az=245):
    """用噪声 + 漫反射光照做出皮革的颗粒凸起：光从左上来。"""
    return f'''<svg width="{w}" height="{h}" style="position:absolute;left:0;top:0">
<filter id="lth{seed}" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" seed="{seed}" result="n"/>
  <feDiffuseLighting in="n" surfaceScale="1.6" lighting-color="#fff" result="l"><feDistantLight azimuth="{light_az}" elevation="55"/></feDiffuseLighting>
  <feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/>
</filter>
<radialGradient id="vig{seed}" cx="45%" cy="35%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
<rect width="{w}" height="{h}" fill="{base}" filter="url(#lth{seed})"/>
<rect width="{w}" height="{h}" fill="url(#vig{seed})"/>
</svg>'''


def stitch(x, y, w, h, r=18):
    """缝线：先压一道凹槽，再在里面走一圈虚线，每一针带一点投影。"""
    return f'''<svg width="{w + 20}" height="{h + 20}" style="position:absolute;left:{x - 10}px;top:{y - 10}px;overflow:visible">
<rect x="10" y="10" width="{w}" height="{h}" rx="{r}" fill="none" stroke="#00000055" stroke-width="5"/>
<rect x="10.5" y="11.5" width="{w}" height="{h}" rx="{r}" fill="none" stroke="#ffffff22" stroke-width="2"/>
<rect x="11" y="12" width="{w}" height="{h}" rx="{r}" fill="none" stroke="#00000066" stroke-width="3.2" stroke-dasharray="11 7" stroke-linecap="round"/>
<rect x="10" y="10" width="{w}" height="{h}" rx="{r}" fill="none" stroke="{STITCH}" stroke-width="3" stroke-dasharray="11 7" stroke-linecap="round"/>
</svg>'''
