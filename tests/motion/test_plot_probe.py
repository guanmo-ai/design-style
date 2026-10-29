import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[2] / 'scripts/plot_probe.py'


class ProbePlot(unittest.TestCase):
    def test_one_channel_and_beat_argument_keep_frame_range(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = root / 'probe.json'
            data.write_text(json.dumps([{'f': i, 'speed': i if i != 27 else None} for i in range(50)]))
            image = root / 'probe.png'
            result = subprocess.run([sys.executable, str(SCRIPT), str(data), str(image), '25', '40', '--beat', '25'], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertGreater(image.stat().st_size, 100)
