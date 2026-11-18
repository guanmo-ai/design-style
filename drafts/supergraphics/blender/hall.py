# 超级平面 · Blender 场景共用：旧厂房（锈铁柱 + 木屋架 + 高窗 + 旧石膏墙 + 混凝土地）、CC0 材质、
# “漆”（按镜头画面坐标刷形状，从这个机位看完美；保留墙面的凹凸，被光照、被遮挡）、天光 + 太阳 + 薄雾、比例尺小人。
import bpy, math, os
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, 'assets')

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    return sc

# ---------- 材质 ----------
def tex_node(nt, path, non_color=False):
    n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(path, check_existing=True)
    if non_color: n.image.colorspace_settings.name = 'Non-Color'
    return n

def pbr(name, folder, scale=1.0, tint=None, rough_mul=1.0, paint=None, puddle=0.0):
    """folder = ambientCG 材质名；scale = 每米重复几次（用物体坐标，不需要 UV）；paint = 漆的遮罩函数"""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; L = nt.links
    bsdf = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (scale, scale, scale)
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    base = os.path.join(A, folder, f'{folder}_2K-JPG_')
    col = tex_node(nt, base + 'Color.jpg'); rough = tex_node(nt, base + 'Roughness.jpg', True); nrm = tex_node(nt, base + 'NormalGL.jpg', True)
    for t in (col, rough, nrm): t.projection = 'BOX'; t.projection_blend = 0.25; L.new(mp.outputs['Vector'], t.inputs['Vector'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 1.2; L.new(nrm.outputs['Color'], nm.inputs['Color']); L.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    c_out = col.outputs['Color']
    if tint:
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1.0
        L.new(c_out, mx.inputs['A']); mx.inputs['B'].default_value = (*tint, 1); c_out = mx.outputs['Result']
    rm = nt.nodes.new('ShaderNodeMath'); rm.operation = 'MULTIPLY'; rm.inputs[1].default_value = rough_mul; L.new(rough.outputs['Color'], rm.inputs[0])
    r_out = rm.outputs['Value']
    if paint:
        c_out, r_out = paint(nt, c_out, r_out)
    if puddle:   # 积水：大尺度噪声取阈值，水里更暗、几乎镜面
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.13; nz.inputs['Detail'].default_value = 10; nz.inputs['Roughness'].default_value = 0.68
        tc2 = nt.nodes.new('ShaderNodeTexCoord'); L.new(tc2.outputs['Object'], nz.inputs['Vector'])
        mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = 0.58 - puddle * 0.04; mr.inputs['From Max'].default_value = 0.58 - puddle * 0.04 + 0.035; L.new(nz.outputs['Fac'], mr.inputs['Value'])
        dk = nt.nodes.new('ShaderNodeMix'); dk.data_type = 'RGBA'; dk.blend_type = 'MULTIPLY'; L.new(mr.outputs['Result'], dk.inputs['Factor']); L.new(c_out, dk.inputs['A']); dk.inputs['B'].default_value = (0.55, 0.55, 0.56, 1); c_out = dk.outputs['Result']
        wr = nt.nodes.new('ShaderNodeMix'); wr.data_type = 'FLOAT'; L.new(mr.outputs['Result'], wr.inputs['Factor']); L.new(r_out, wr.inputs['A']); wr.inputs['B'].default_value = 0.02; r_out = wr.outputs['Result']
        fl = nt.nodes.new('ShaderNodeMath'); fl.operation = 'MULTIPLY'; fl.inputs[1].default_value = -1; L.new(mr.outputs['Result'], fl.inputs[0])
        nm2 = nt.nodes.new('ShaderNodeMix'); nm2.data_type = 'VECTOR'; L.new(mr.outputs['Result'], nm2.inputs['Factor']); L.new(nm.outputs['Normal'], nm2.inputs[4]); L.new(tc2.outputs['Normal'], nm2.inputs[5])
        L.new(nm2.outputs[1], bsdf.inputs['Normal'])
    L.new(c_out, bsdf.inputs['Base Color']); L.new(r_out, bsdf.inputs['Roughness'])
    return m

def flat(name, rgb, rough=0.6, emit=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough
    if emit: b.inputs['Emission Color'].default_value = (*rgb, 1); b.inputs['Emission Strength'].default_value = emit
    return m

# ---------- 漆：在镜头画面坐标里算遮罩 ----------
def projector_coord(nt, proj):
    """固定投影机：世界坐标 → 投影机画面坐标（和 Texture Coordinate 的 Window 一样：0—1，左下为原点）+ 只刷朝向投影机的面。
    proj = dict(pos, look, lens, sensor=36, aspect=16/9, shift_y=0)"""
    L = nt.links; C = Vector(proj['pos']); f = (Vector(proj['look']) - C).normalized()
    r = f.cross(Vector((0, 0, 1))).normalized(); u = r.cross(f)
    asp = proj.get('aspect', 16 / 9); tan_y = (proj.get('sensor', 36) / 2 / proj['lens']) / asp
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    d = nt.nodes.new('ShaderNodeVectorMath'); d.operation = 'SUBTRACT'; L.new(geo.outputs['Position'], d.inputs[0]); d.inputs[1].default_value = C
    def dot(v):
        n = nt.nodes.new('ShaderNodeVectorMath'); n.operation = 'DOT_PRODUCT'; L.new(d.outputs[0], n.inputs[0]); n.inputs[1].default_value = v; return n.outputs['Value']
    xc, yc, zc = dot(r), dot(u), dot(f)
    def div_scale(a, add):
        q = nt.nodes.new('ShaderNodeMath'); q.operation = 'DIVIDE'; L.new(a, q.inputs[0]); L.new(zc, q.inputs[1])
        m = nt.nodes.new('ShaderNodeMath'); m.operation = 'MULTIPLY_ADD'; L.new(q.outputs[0], m.inputs[0]); return q, m
    qx, mx = div_scale(xc, 0); mx.inputs[1].default_value = 1 / (2 * tan_y) / asp; mx.inputs[2].default_value = 0.5
    qy, my = div_scale(yc, 0); my.inputs[1].default_value = 1 / (2 * tan_y); my.inputs[2].default_value = 0.5 - proj.get('shift_y', 0) * asp
    cb = nt.nodes.new('ShaderNodeCombineXYZ'); L.new(mx.outputs[0], cb.inputs['X']); L.new(my.outputs[0], cb.inputs['Y'])
    # 门：在投影机前面，且这一面朝着投影机
    g1 = nt.nodes.new('ShaderNodeMath'); g1.operation = 'GREATER_THAN'; L.new(zc, g1.inputs[0]); g1.inputs[1].default_value = 0.05
    nd = nt.nodes.new('ShaderNodeVectorMath'); nd.operation = 'DOT_PRODUCT'; L.new(geo.outputs['True Normal'], nd.inputs[0]); L.new(d.outputs[0], nd.inputs[1])
    g2 = nt.nodes.new('ShaderNodeMath'); g2.operation = 'LESS_THAN'; L.new(nd.outputs['Value'], g2.inputs[0]); g2.inputs[1].default_value = 0.0
    g = nt.nodes.new('ShaderNodeMath'); g.operation = 'MULTIPLY'; L.new(g1.outputs[0], g.inputs[0]); L.new(g2.outputs[0], g.inputs[1])
    return cb.outputs[0], g.outputs[0]

def window_paint(mask_builder, colors, proj=None):
    """mask_builder(nt, uv_vec_socket) -> [(mask_socket, color_index)]；colors = 漆的颜色（线性 RGB）；
    proj=None 时跟着当前镜头（Window 坐标），给了 proj 就固定在那台投影机上"""
    def f(nt, c_in, r_in):
        L = nt.links
        tc = nt.nodes.new('ShaderNodeTexCoord')
        out_c, out_r = c_in, r_in
        coord, gate = (tc.outputs['Window'], None) if proj is None else projector_coord(nt, proj)
        # 漆有一点点透底：用噪声让遮罩边缘和面里有轻微的不均
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 40.0; nz.inputs['Detail'].default_value = 6
        L.new(tc.outputs['Object'], nz.inputs['Vector'])
        for mask, ci in mask_builder(nt, coord):
            if gate is not None:
                gm = nt.nodes.new('ShaderNodeMath'); gm.operation = 'MULTIPLY'; L.new(mask, gm.inputs[0]); L.new(gate, gm.inputs[1]); mask = gm.outputs[0]
            k = nt.nodes.new('ShaderNodeMath'); k.operation = 'MULTIPLY_ADD'; k.inputs[1].default_value = 0.12; k.inputs[2].default_value = 0.86
            L.new(nz.outputs['Fac'], k.inputs[0])
            fm = nt.nodes.new('ShaderNodeMath'); fm.operation = 'MULTIPLY'; fm.use_clamp = True; L.new(mask, fm.inputs[0]); L.new(k.outputs['Value'], fm.inputs[1])
            mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; L.new(fm.outputs['Value'], mx.inputs['Factor']); L.new(out_c, mx.inputs['A']); mx.inputs['B'].default_value = (*colors[ci], 1)
            out_c = mx.outputs['Result']
            mr = nt.nodes.new('ShaderNodeMix'); mr.data_type = 'FLOAT'; L.new(fm.outputs['Value'], mr.inputs['Factor']); L.new(out_r, mr.inputs['A']); mr.inputs['B'].default_value = 0.62
            out_r = mr.outputs['Result']
        return out_c, out_r
    return f

def _sep(nt, uv, aspect):
    """画面坐标 → 以画面中心为原点、按宽高比修正后的 (x, y)"""
    L = nt.links; s = nt.nodes.new('ShaderNodeSeparateXYZ'); L.new(uv, s.inputs['Vector'])
    x = nt.nodes.new('ShaderNodeMath'); x.operation = 'MULTIPLY_ADD'; x.inputs[1].default_value = aspect; x.inputs[2].default_value = -aspect / 2; L.new(s.outputs['X'], x.inputs[0])
    y = nt.nodes.new('ShaderNodeMath'); y.operation = 'SUBTRACT'; y.inputs[1].default_value = 0.5; L.new(s.outputs['Y'], y.inputs[0])
    return x, y

def disc_masks(cx, cy, radii, aspect=16 / 9, soft=0.0015):
    """同心圆环：radii = [(r_outer, r_inner, color_index)]，坐标以画面高度为 1"""
    def b(nt, uv):
        L = nt.links; x, y = _sep(nt, uv, aspect)
        dx = nt.nodes.new('ShaderNodeMath'); dx.operation = 'SUBTRACT'; dx.inputs[1].default_value = cx; L.new(x.outputs[0], dx.inputs[0])
        dy = nt.nodes.new('ShaderNodeMath'); dy.operation = 'SUBTRACT'; dy.inputs[1].default_value = cy; L.new(y.outputs[0], dy.inputs[0])
        cb = nt.nodes.new('ShaderNodeCombineXYZ'); L.new(dx.outputs[0], cb.inputs['X']); L.new(dy.outputs[0], cb.inputs['Y'])
        ln = nt.nodes.new('ShaderNodeVectorMath'); ln.operation = 'LENGTH'; L.new(cb.outputs[0], ln.inputs[0])
        out = []
        for ro, ri, ci in radii:
            a = nt.nodes.new('ShaderNodeMapRange'); a.inputs['From Min'].default_value = ro + soft; a.inputs['From Max'].default_value = ro - soft; L.new(ln.outputs['Value'], a.inputs['Value'])
            if ri > 0:
                bb = nt.nodes.new('ShaderNodeMapRange'); bb.inputs['From Min'].default_value = ri - soft; bb.inputs['From Max'].default_value = ri + soft; L.new(ln.outputs['Value'], bb.inputs['Value'])
                m = nt.nodes.new('ShaderNodeMath'); m.operation = 'MULTIPLY'; L.new(a.outputs['Result'], m.inputs[0]); L.new(bb.outputs['Result'], m.inputs[1]); out.append((m.outputs[0], ci))
            else: out.append((a.outputs['Result'], ci))
        return out
    return b

def image_masks(path, color_index=0):
    """一张黑底白字的图当遮罩，贴满画面（画面坐标）"""
    def b(nt, uv):
        t = tex_node(nt, path, True); t.extension = 'CLIP'; nt.links.new(uv, t.inputs['Vector'])
        return [(t.outputs['Color'], color_index)]
    return b

# ---------- 几何 ----------
def box(name, size, loc, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.name = name
    o.scale = size; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); o.data.materials.append(mat); return o

def beam(name, p0, p1, w, h, mat):
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0; L = d.length
    bpy.ops.mesh.primitive_cube_add(size=1, location=(p0 + p1) / 2); o = bpy.context.object; o.name = name
    o.scale = (w, h, L); bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    o.data.materials.append(mat); return o

def ibeam(name, x, y, H, mat, s=0.42):
    """工字钢柱：两块翼缘 + 一块腹板"""
    box(name + 'w', (0.05, s, H), (x, y, H / 2), mat)
    for sx in (-1, 1): box(name + f'f{sx}', (s * 0.9, 0.06, H), (x, y + sx * s / 2, H / 2), mat)
    box(name + 'cap', (s * 1.2, s * 1.2, 0.08), (x, y, 0.04), mat)

def hall(mats, W=18.0, Lh=64.0, H=11.0, bay=6.0, col_x=5.6, windows=True):
    """沿 +Y 的长厂房；地面 z=0；镜头一般放在 y<0 往里看"""
    wall, floor_m, steel, wood = mats['wall'], mats['floor'], mats['steel'], mats['wood']
    box('floor', (W + 2, Lh + 10, 0.2), (0, Lh / 2, -0.1), floor_m)
    # 尽头墙：中间一个大门洞，门外是白天（一块亮地 + 天空）
    dw, dh = 5.0, 6.2
    box('endL', ((W + 2 - dw) / 2, 0.5, H + 4), (-(dw / 2 + (W + 2 - dw) / 4), Lh + 0.25, (H + 4) / 2), wall)
    box('endR', ((W + 2 - dw) / 2, 0.5, H + 4), ((dw / 2 + (W + 2 - dw) / 4), Lh + 0.25, (H + 4) / 2), wall)
    box('endT', (dw, 0.5, H + 4 - dh), (0, Lh + 0.25, dh + (H + 4 - dh) / 2), wall)
    box('outside', (60, 60, 0.2), (0, Lh + 30, -0.1), floor_m)
    # 侧墙：下段实墙，上段一排高窗（窗间墙）
    win_lo, win_hi = 7.0, 9.4
    for sx in (-1, 1):
        x = sx * (W / 2 + 0.25)
        box(f'wall_lo{sx}', (0.5, Lh + 4, win_lo), (x, Lh / 2, win_lo / 2), wall)
        box(f'wall_hi{sx}', (0.5, Lh + 4, H + 3 - win_hi), (x, Lh / 2, (win_hi + H + 3) / 2), wall)
        n = int(Lh / bay)
        for i in range(n + 1):
            y = i * bay
            box(f'pier{sx}_{i}', (0.5, 2.4 if windows else bay, win_hi - win_lo), (x, y, (win_lo + win_hi) / 2), wall)
        if windows:   # 窗棂：细铁条
            for i in range(n):
                yc = i * bay + bay / 2
                for k in (-1, 0, 1): box(f'mull{sx}_{i}_{k}', (0.08, 0.06, win_hi - win_lo), (x, yc + k * 0.9, (win_lo + win_hi) / 2), steel)
                box(f'tran{sx}_{i}', (0.08, bay - 2.4, 0.06), (x, yc, (win_lo + win_hi) / 2), steel)
    # 柱子 + 屋架
    n = int(Lh / bay)
    for i in range(1, n + 1):
        y = i * bay - 2.0
        for sx in (-1, 1): ibeam(f'col{sx}_{i}', sx * col_x, y, H - 1.2, steel)
        zb, zt = H - 1.2, H + 2.6
        beam(f'tb{i}', (-W / 2, y, zb), (W / 2, y, zb), 0.22, 0.3, steel)          # 下弦
        beam(f'tl{i}', (-W / 2, y, zb), (0, y, zt), 0.22, 0.3, steel)               # 上弦
        beam(f'tr{i}', (W / 2, y, zb), (0, y, zt), 0.22, 0.3, steel)
        for k in range(1, 6):                                                        # 腹杆
            for sx in (-1, 1):
                xa = sx * W / 2 * (1 - k / 6); za = zb + (zt - zb) * (k / 6)
                beam(f'tv{i}_{k}_{sx}', (xa, y, zb), (xa, y, za), 0.12, 0.12, steel)
                xb = sx * W / 2 * (1 - (k - 1) / 6)
                beam(f'td{i}_{k}_{sx}', (xb, y, zb), (xa, y, za), 0.1, 0.1, steel)
    # 屋面：两坡木板，中间一条天窗缝
    for sx in (-1, 1):
        o = box(f'roof{sx}', (W / 2 + 1.2, Lh + 4, 0.15), (sx * (W / 4 + 0.45), Lh / 2, (H - 1.2 + H + 2.6) / 2 + 0.25), wood)
        o.rotation_euler = (0, sx * math.atan2(3.8, W / 2), 0)

def person(loc, rot_z=0.0, h=1.75, mat=None):
    mat = mat or flat('person', (0.03, 0.03, 0.035), 0.7)
    s = h / 1.75; x, y, z = loc
    parts = []
    def cap(r, l, px, py, pz, rx=0.0):
        bpy.ops.mesh.primitive_cylinder_add(radius=r * s, depth=l * s, location=(x + px * s, y + py * s, z + pz * s), rotation=(rx, 0, 0), vertices=16)
        o = bpy.context.object; o.data.materials.append(mat); parts.append(o)
        for e in (1, -1):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=r * s, location=(x + px * s, y + py * s, z + (pz + e * l / 2) * s), segments=16, ring_count=8); bpy.context.object.data.materials.append(mat)
    cap(0.075, 0.78, -0.1, 0, 0.47); cap(0.075, 0.78, 0.1, 0.02, 0.47)
    cap(0.18, 0.45, 0, 0, 1.18); cap(0.055, 0.55, -0.26, 0, 1.15); cap(0.055, 0.55, 0.26, 0, 1.15)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11 * s, location=(x, y, z + 1.64 * s), segments=24, ring_count=12); bpy.context.object.data.materials.append(mat)

def lights(sun_dir=(-0.55, 0.25, 0.42), sun_strength=7.0, sky_strength=0.8, haze=0.012, bounds=None):
    sc = bpy.context.scene
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; nt = w.node_tree
    bg = nt.nodes['Background']; env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(os.path.join(A, 'sky.hdr'))
    nt.links.new(env.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = sky_strength
    d = Vector(sun_dir).normalized()
    bpy.ops.object.light_add(type='SUN'); sun = bpy.context.object; sun.data.energy = sun_strength; sun.data.angle = math.radians(0.6)
    sun.data.color = (1.0, 0.9, 0.78)
    sun.rotation_mode = 'QUATERNION'; sun.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
    if haze and bounds:   # 一个装满薄雾的盒子：光柱就是它
        (x0, y0, z0), (x1, y1, z1) = bounds
        bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)); v = bpy.context.object; v.scale = (x1 - x0, y1 - y0, z1 - z0)
        vm = bpy.data.materials.new('haze'); vm.use_nodes = True; vn = vm.node_tree; vn.nodes.remove(vn.nodes['Principled BSDF'])
        pv = vn.nodes.new('ShaderNodeVolumePrincipled'); pv.inputs['Density'].default_value = haze; pv.inputs['Anisotropy'].default_value = 0.55
        vn.links.new(pv.outputs['Volume'], vn.nodes['Material Output'].inputs['Volume']); v.data.materials.append(vm)
        v.visible_shadow = False
    return sun

def camera(loc, look, lens=32.0):
    bpy.ops.object.camera_add(location=loc); c = bpy.context.object
    d = Vector(look) - Vector(loc); c.rotation_mode = 'QUATERNION'; c.rotation_quaternion = d.to_track_quat('-Z', 'Y')
    c.data.lens = lens; c.data.sensor_width = 36; bpy.context.scene.camera = c; return c

def render(out, w=960, h=540, samples=64, denoise=True, threads=4):
    sc = bpy.context.scene; r = sc.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = w, h, 100
    sc.cycles.samples = samples; sc.cycles.use_denoising = denoise
    try: sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception: pass
    sc.cycles.max_bounces = 6; sc.cycles.volume_bounces = 1; sc.cycles.volume_step_rate = 4.0
    sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.02
    r.threads_mode = 'FIXED'; r.threads = threads
    r.image_settings.file_format = 'PNG'; r.filepath = out
    import time; t = time.time(); bpy.ops.render.render(write_still=True); print(f'RENDER {out} {w}x{h} spp={samples} {time.time() - t:.1f}s')
