import importlib.util
from pathlib import Path
import tempfile
import unittest
import wave
from PIL import Image

spec = importlib.util.spec_from_file_location('compare_media', Path(__file__).resolve().parents[2] / 'scripts/compare_media.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class MediaComparison(unittest.TestCase):
    def test_detects_one_pixel_and_missing_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            a, b = Path(tmp) / 'before', Path(tmp) / 'after'
            a.mkdir()
            b.mkdir()
            image = Image.new('RGBA', (3, 3), (20, 30, 40, 255))
            image.save(a / 'frame.png')
            image.save(b / 'frame.png')
            self.assertTrue(module.compare(a, b)['same'])
            image.putpixel((1, 1), (21, 30, 40, 255))
            image.save(b / 'frame.png')
            report = module.compare(a, b)
            self.assertFalse(report['same'])
            self.assertEqual(report['files'][0]['changed_pixels'], 1)
            (b / 'frame.png').unlink()
            self.assertEqual(module.compare(a, b)['missing'], ['frame.png'])

    def test_detects_one_changed_audio_sample(self):
        with tempfile.TemporaryDirectory() as tmp:
            a, b = Path(tmp) / 'before', Path(tmp) / 'after'
            a.mkdir()
            b.mkdir()
            def write(p, pcm):
                with wave.open(str(p), 'wb') as w:
                    w.setnchannels(1)
                    w.setsampwidth(2)
                    w.setframerate(48000)
                    w.writeframes(pcm)
            write(a / 'music.wav', b'\0\0\0\0')
            write(b / 'music.wav', b'\0\0\0\0')
            self.assertTrue(module.compare(a, b)['same'])
            write(b / 'music.wav', b'\0\0\1\0')
            self.assertFalse(module.compare(a, b)['same'])

    def test_empty_directories_do_not_count_as_verified(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertFalse(module.compare(tmp, tmp)['same'])
