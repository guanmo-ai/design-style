# 020 · 字符画：制作过程

[返回风格指南](README.md) · [English](PROCESS.en.md)

## 定稿来源

用户于 2026-11-04 在交接中明确确认两部成片审核通过。本期直接采用制作分支 `claude/vigilant-galileo-j1sfyr` 提交 `ced34bf` 的 `drafts/ascii/film/ascii-film.mp4`，只按正式附件名更名，不重渲或改动音画。来源和 SHA-256 记录于 `process/approved-master.json`。

正式目录使用制作 ID 020；网站期号按首次上架顺序分配，两者可以不同。

## 结构与节奏

Donut、数字雨、网页大字、手机播放器与字符火焰依次接力，再用五条规则和五个手机界面演示可复用的动作。 签名动作是“先乱码，再落定。” 配乐持续使用同一组乐器；换章时改变和弦与旋律。动画与配乐共享 `video/timeline.js`，细小音效读入预先导出的 `video/events.json`。

| 帧（右端不含） | 秒 | 章节 |
|---|---|---|
| 0—90 | 0.00—1.50 | donut.c |
| 90—150 | 1.50—2.50 | 数字雨 |
| 150—240 | 2.50—4.00 | FIGlet 大字 |
| 240—330 | 4.00—5.50 | 字符界面 |
| 330—510 | 5.50—8.50 | 火焰 |
| 510—690 | 8.50—11.50 | 五条规则 |
| 690—900 | 11.50—15.00 | 用在手机上 |
| 900—1080 | 15.00—18.00 | 片尾 · 回到开场 |

## 画面与声音

`window.frame(f)` 接收绝对帧数；Canvas 2D 输出 1920×1080。字形、遮罩、路径和图形都由代码绘制，字体从 `public/fonts/` 加载。火焰模拟带缓存，倒序访问时重新计算。

配乐入口 `audio/make_music.py` 使用共享 `scripts/lib/audio/song.py` 和现有 `AudioKit` 合成器；A 小调、方波主旋律和十六分琶音，鼓、贝斯和铺底持续贯穿。声音为代码合成，未使用外部录音。

## 从源码重新渲染

在仓库根目录运行。需要 Node.js 22.12+、Python 3（NumPy）、FFmpeg 与 Playwright Chromium。

```bash
npm ci
python3 -m pip install numpy fonttools
npx playwright install chromium
npm run fonts
bash styles/020-ascii-art/video/make.sh
```

脚本沿用定稿事件表，合成配乐、输出 1080 帧、编码 MP4；临时帧目录结束后自动清理，结果位于 `out/020-ascii-art.mp4`。这是复现入口，正式发布使用原片。浏览器、字体和编码器版本变化可能改变重渲结果；原片的准确字节由校验值固定。

## 构建图解

```bash
python3 styles/020-ascii-art/images/make_svgs.py
python3 scripts/build_images.py styles/020-ascii-art/images
```

图解使用与影片相同的圆环投影与亮度字符映射，输出可编辑 SVG 和嵌入字体的预览。共用布局与绘制代码为 `scripts/lib/style_svgs.py`。补图与发布封装未改变已审核影片。

## 来源

影片内的代表作名称用于说明视觉来源；未打包原作截图或影片片段。详见 [SOURCES.md](SOURCES.md)，字体原许可证保留于 `fonts/`。
