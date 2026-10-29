"""Archivo 字宽表；调用共用生成器，输出格式和采样点保持不变。"""
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'scripts'))
from lib.font_metrics import write_metrics
write_metrics(ROOT / 'public/fonts/Archivo.ttf', Path(__file__).with_name('metrics.ts'))
