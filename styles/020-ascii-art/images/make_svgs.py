"""生成四张可编辑字符画图解。"""
import sys
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE.parents[1]/'scripts/lib'))
from style_svgs import Sheets
Sheets(BASE,'ascii').build()
