"""Isotype 图形：Gerd Arntz 式的平涂剪影。每个图形放在自己的 viewBox 里，用 <use> 重复。
规则：一个图形 = 一个固定数量；多就多摆几个，绝不放大；不满一个就竖着切掉一截。"""
PAPER, INK, RED, BLUE, OCHRE, GREEN = '#EDE5D1', '#1E1C19', '#C7372C', '#2C5A8A', '#D9A33A', '#4F7A4A'

SYMBOLS = {
    # 人：头、带圆肩的身子、两条腿
    'man': ('0 0 60 150', '<circle cx="30" cy="14" r="13"/><path d="M8,40 Q8,30 18,30 H42 Q52,30 52,40 V92 H8Z"/>'
                          '<rect x="11" y="90" width="17" height="60"/><rect x="32" y="90" width="17" height="60"/>'),
    'car': ('0 0 170 84', '<path d="M8,40 L40,40 L58,12 H118 L140,40 H162 Q168,40 168,48 V66 H2 V48 Q2,40 8,40Z"/>'
                          '<circle cx="40" cy="66" r="17" fill="{bg}"/><circle cx="40" cy="66" r="12"/>'
                          '<circle cx="130" cy="66" r="17" fill="{bg}"/><circle cx="130" cy="66" r="12"/>'
                          '<path d="M66,20 H88 V38 H52Z M96,20 H114 L128,38 H96Z" fill="{bg}"/>'),
    'bike': ('0 0 160 96', '<g fill="none" stroke-width="9"><circle cx="34" cy="62" r="27"/><circle cx="126" cy="62" r="27"/>'
                           '<path d="M34,62 L64,24 H112 L126,62 M64,24 L82,62 L112,24 M58,14 H76 M112,24 L106,8 H122"/></g>'),
    'tram': ('0 0 150 110', '<rect x="4" y="18" width="142" height="74" rx="10"/><rect x="66" y="0" width="18" height="18"/>'
                            '<g fill="{bg}"><rect x="16" y="30" width="28" height="26"/><rect x="61" y="30" width="28" height="26"/><rect x="106" y="30" width="28" height="26"/></g>'
                            '<circle cx="34" cy="98" r="11"/><circle cx="116" cy="98" r="11"/>'),
    'cup': ('0 0 60 80', '<path d="M4,8 H56 L50,78 H10Z"/><rect x="4" y="20" width="52" height="6" fill="{bg}"/>'),
    'moon': ('0 0 70 70', '<path d="M46,4 A33,33 0 1,0 66,46 A27,27 0 1,1 46,4Z"/>'),
}


def defs(bg=PAPER):
    out = []
    for k, (vb, body) in SYMBOLS.items():
        out.append(f'<symbol id="{k}" viewBox="{vb}">{body.replace("{bg}", bg)}</symbol>')
    return '<defs>' + ''.join(out) + '</defs>'


def size(k, h):
    vb = SYMBOLS[k][0].split()
    return float(vb[2]) / float(vb[3]) * h


def row(k, n, x, y, h, color, gap=0.22, raise_last=0, ghost_last=False):
    """n 可以是小数：最后一个只画前 frac 宽。raise_last：最后一个整的正从上面落下来。"""
    w = size(k, h)
    out, i = [], 0
    stroke = ' stroke="%s"' % color if k == 'bike' else ''
    while n - i > 1e-6:
        frac = min(1, n - i)
        xi = x + i * w * (1 + gap)
        dy = 0
        whole_last = frac == 1 and (n - i - 1) < 1e-6 or (frac == 1 and 0 < n - i - 1 < 1)
        if raise_last and frac == 1 and n - i - 1 < 1:
            dy = -raise_last
            if ghost_last:
                out.append(f'<rect x="{xi - 6:.1f}" y="{y - 6:.1f}" width="{w + 12:.1f}" height="{h + 12:.1f}" fill="none" stroke="{color}" stroke-width="3" stroke-dasharray="10 8" opacity=".7"/>')
        if frac < 1:
            cid = f'c{k}{int(xi)}{int(y)}{color[1:]}{int(h)}'
            out.append(f'<clipPath id="{cid}"><rect x="{xi:.1f}" y="{y - 10:.1f}" width="{w * frac:.1f}" height="{h + 20:.1f}"/></clipPath>'
                       f'<g clip-path="url(#{cid})"><use href="#{k}" x="{xi:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{color}"{stroke}/></g>')
        else:
            out.append(f'<use href="#{k}" x="{xi:.1f}" y="{y + dy:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{color}"{stroke}/>')
        i += 1
    return ''.join(out), w * (1 + gap)
