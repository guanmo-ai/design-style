"""把斯坦福兔子的 OBJ 压成 bunny.js（顶点量化成 uint16，三角形下标 uint16，base64）。
数据：Stanford 3D Scanning Repository（Turk & Levoy 1994），OBJ 镜像：
https://raw.githubusercontent.com/alecjacobson/common-3d-test-models/master/data/stanford-bunny.obj
用法：python3 make_bunny.py stanford-bunny.obj bunny.js"""
import base64
import sys

import numpy as np

src, out = sys.argv[1], sys.argv[2]
V, F = [], []
for line in open(src):
    if line.startswith('v '):
        V.append([float(x) for x in line.split()[1:4]])
    elif line.startswith('f '):
        F.append([int(x.split('/')[0]) - 1 for x in line.split()[1:4]])
V, F = np.array(V), np.array(F, dtype=np.uint16)
lo, hi = V.min(0), V.max(0)
q = np.round((V - lo) / (hi - lo).max() * 65535).astype(np.uint16)
b64 = base64.b64encode(q.tobytes() + F.tobytes()).decode()
ext = (hi - lo) / (hi - lo).max()
open(out, 'w').write('// 斯坦福兔子（Stanford Bunny）：Greg Turk & Marc Levoy, 1994。数据来自 Stanford 3D Scanning Repository（http://graphics.stanford.edu/data/3Dscanrep/）。\n'
                     '// 这里只存网格：顶点量化成 uint16（按最长边归一化），三角形下标 uint16。由 drafts/point-cloud/data/make_bunny.py 从 OBJ 生成。\n'
                     'window.BUNNY = { nv: %d, nf: %d, ext: [%f, %f, %f], b64: "%s" };\n' % (len(V), len(F), *ext, b64))
