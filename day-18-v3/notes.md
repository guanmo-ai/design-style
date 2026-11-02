## 风格 018 · 微缩景观 Diorama · 第三版

一支 20 秒短片：圆润的街角、房间剖面与模型铁路在同一张桌面逐块搭起，收成手机界面，一起入夜；镜头缓推房间，台灯熄灭，片名与署名「观默」停在小彩灯和月光里。配乐为贯穿全片的 F 大调、120 BPM 电影配乐。

设计与配乐采用 `1606f5c9d10a1f46e67cba1daea1b5aff9f51e46`，本次在 Mac 的 Metal 显卡后端按原时间轴渲染 60fps，无插帧、无调速，未修改设计或配乐代码。

- `018-diorama.mp4`：1920×1080 · 60fps · 1200 帧 · 20 秒 · H.264 + AAC · 48kHz 立体声。
- `018-diorama-source.zip`：提交 `2f0624afd5beaef72657a6125b5cae526863493e` 的完整项目源码，共 804 个文件。包含 Three.js 场景、动画、原创配乐脚本、共享库、图解、中英文指南与制作过程、60fps 时间轴、依赖锁文件及字体准备脚本；保留其他已提交作品的代码与素材以保留共享依赖。不含 node_modules、生成音轨、渲染帧、本机未提交创作或下载的字体。
- `SHA256SUMS`：成片与源码包校验值。

已与云端第三版 30fps 审片在 8 个同秒时间点对照，未见场景、镜头、字幕或结尾时序偏移；像素差主要在后期边缘颗粒与阴影。两版解码音轨相关度 0.999899，重新编码后并非字节相同。

旧版 [day-18-flicker-v2](https://github.com/guanmo-ai/design-style/releases/tag/day-18-flicker-v2) 保留回退。画廊继续显示「风格 010」，制作目录与 Release 保留制作编号 018。

复现按[本期指南第 10 节](https://github.com/guanmo-ai/design-style/blob/2f0624afd5beaef72657a6125b5cae526863493e/styles/018-diorama/README.md#10--文件)准备依赖、Chromium 与字体，再执行 60fps 渲染、配乐生成和合成命令。不同显卡与软件后端在阴影、颗粒及纸屑边缘可能产生像素差，重新编码的文件字节不保证一致。

📐 [风格指南](https://github.com/guanmo-ai/design-style/tree/main/styles/018-diorama) · 🛠 [制作过程](https://github.com/guanmo-ai/design-style/blob/main/styles/018-diorama/PROCESS.md) · [English guide](https://github.com/guanmo-ai/design-style/blob/main/styles/018-diorama/README.en.md) · 🖼 [画廊](https://guanmo-ai.github.io/design-style/?lang=zh#work-018-diorama)

SHA-256：

```text
7cf8d42d075c04f7a4f4d397bcb17126d61b240d34fe2f75ab7b29e710a6af73  018-diorama.mp4
94199ab35647446a344f5f865babb4d6e1f025f74b6c9591bb027ef54d894a56  018-diorama-source.zip
```

by 观默 [@guanmo_ai](https://x.com/guanmo_ai)
