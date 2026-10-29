"""逐像素 / PCM 样本比较两次静帧和配乐记录，缺文件同样失败。"""
import argparse
import hashlib
import json
from pathlib import Path
import wave

import numpy as np
from PIL import Image


def compare(before, after):
    before, after = Path(before), Path(after)
    files = lambda root: {p.relative_to(root) for p in root.rglob('*') if p.suffix in ('.png', '.wav')}
    left, right = files(before), files(after)
    report = {'missing': sorted(map(str, left - right)), 'extra': sorted(map(str, right - left)), 'files': []}
    for rel in sorted(left & right):
        a, b = before / rel, after / rel
        row = {'file': str(rel)}
        if rel.suffix == '.png':
            with Image.open(a) as ia, Image.open(b) as ib:
                x, y = np.asarray(ia.convert('RGBA')), np.asarray(ib.convert('RGBA'))
                row['size'] = list(ia.size)
                row['same'] = bool(x.shape == y.shape and np.array_equal(x, y))
                row['changed_pixels'] = int(np.count_nonzero(np.any(x != y, axis=2))) if x.shape == y.shape else None
        else:
            with wave.open(str(a), 'rb') as wa, wave.open(str(b), 'rb') as wb:
                x, y = wa.readframes(wa.getnframes()), wb.readframes(wb.getnframes())
                row['same'] = wa.getparams() == wb.getparams() and x == y
                row['pcm_sha256'] = hashlib.sha256(x).hexdigest()
                row['frames'] = wa.getnframes()
                row['sample_rate'] = wa.getframerate()
        report['files'].append(row)
    report['same'] = bool(left) and not report['missing'] and not report['extra'] and all(r['same'] for r in report['files'])
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('before')
    parser.add_argument('after')
    parser.add_argument('--report')
    args = parser.parse_args()
    result = compare(args.before, args.after)
    text = json.dumps(result, ensure_ascii=False, indent=2)
    if args.report:
        Path(args.report).write_text(text + '\n', encoding='utf-8')
    print(json.dumps({'same': result['same'], 'files': len(result['files']),
                      'changed': [r['file'] for r in result['files'] if not r['same']],
                      'missing': result['missing'], 'extra': result['extra']}, ensure_ascii=False))
    raise SystemExit(0 if result['same'] else 1)
