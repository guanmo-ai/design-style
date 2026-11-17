"""配乐 + 音效：用一首生成好的曲子（Sonilo 等）当 BGM，只剪两头；片子里的音效（出字、刷子、落地……）照旧用 Band 合成，压在音乐下面。

    from scoremix import finish
    S = Band(END, CH, ...)        # 只往 S.sfx / S.text_cues 里放东西，不放乐器
    finish(S, music='…/曲子.m4a', start=8.11, dur=51.09, out='out.wav', sfx_db=-9)

start / dur：从原曲第几秒开始、取多长（开头 15 毫秒淡入，结尾 0.8 秒淡出）；最后整体 -14 LUFS、峰值 -1 dBTP。"""
import os
import subprocess
import tempfile


def finish(S, music, start, dur, out, sfx_db=-9.0, music_db=0.0):
    tmp = tempfile.mkdtemp()
    sfx = os.path.join(tmp, 'sfx.wav')
    S.mix(sfx, levels=dict(drums=1, bass=1, keys=1, lead=1, pad=1, brass=1), room=.8, plate=.5, air=.6)
    fo = max(.05, dur - .8)
    filt = (f'[0:a]atrim=start={start}:duration={dur},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,afade=t=out:st={fo}:d=0.8,volume={music_db}dB[m];'
            f'[1:a]atrim=duration={dur},volume={sfx_db}dB[s];[m][s]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1:LRA=11[o]')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', music, '-i', sfx, '-filter_complex', filt, '-map', '[o]', '-ar', '48000', '-ac', '2', out], check=True)
    print('wrote', out)
