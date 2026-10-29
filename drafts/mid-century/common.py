PAPER, INK, TANG, MUST, TEAL = '#F1E4C8', '#1B1714', '#E4532C', '#EBA628', '#23736E'

# 纸纹 + 纸片投影：贴在桌上的投影短而实，被手提起来的投影长而虚
DEFS = '''<defs>
<filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="4"/>
  <feColorMatrix values="0 0 0 0 .1  0 0 0 0 .08  0 0 0 0 .05  0 0 0 .55 0"/>
  <feComposite in2="SourceGraphic" operator="in"/>
</filter>
<filter id="fiber" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".012 .08" numOctaves="2" seed="9"/>
  <feColorMatrix values="0 0 0 0 1  0 0 0 0 .97  0 0 0 0 .9  0 0 0 .5 -.1"/>
</filter>
<filter id="flat" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2.5" dy="3.5" stdDeviation="1.6" flood-color="#2a1205" flood-opacity=".38"/></filter>
<filter id="lift" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="16" dy="26" stdDeviation="11" flood-color="#2a1205" flood-opacity=".32"/></filter>
</defs>'''


def texture(w, h):
    """整张画面上盖一层纸纤维和颗粒（multiply 的感觉用低不透明度近似）。"""
    return (f'<rect width="{w}" height="{h}" filter="url(#fiber)" opacity=".35" style="mix-blend-mode:multiply"/>'
            f'<rect width="{w}" height="{h}" fill="#fff" filter="url(#grain)" opacity=".22" style="mix-blend-mode:multiply"/>')
