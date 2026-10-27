# 交接清单（给 Codex）

分工：Claude 负责设计与动效（风格选题、风格图、短片画面与配乐的创作）；下面这些工程 / 运维事项交给 Codex。做完一项就把它从这里删掉，并在提交信息里写清楚。

2026-10-27：部署核验、发布入口说明、依赖安全核验和 REST 同步兼容已完成。009 音量修订版经用户试听确认后发布为 [day-09-audio-v2](https://github.com/guanmo-ai/design-style/releases/tag/day-09-audio-v2)，画廊目录与中英文文档入口已切换到这一版；原 `day-09` 保留供回退。详见 [交接执行记录](reviews/HANDOFF_20261027.md)。本机其余未提交的创作内容继续保留。

## 待办

### 013 · 装饰艺术 Art Deco：发布与上架（2026-10-27，设计已完成）

设计侧全部完成（短片、配乐、4 张风格图、tokens、中英文档），在分支 `claude/fervent-meitner-efjuvg`。
**成片已由设计侧发布**：`release-assets` 分支的 `day-13/`（成片 + 源码包 + SHA256SUMS），推送后 `publish-release.yml` 自动建 Release [day-13](https://github.com/guanmo-ai/design-style/releases/tag/day-13)。不用重新渲染。剩下的工程侧：

1. **画廊**：在 `gallery/data/works.json` 末尾加一条，其余照抄（`publishedAt` 已填 Release 的实际发布时间）：

```json
{
  "id": "013-art-deco",
  "type": "style",
  "number": "013",
  "title": "装饰艺术",
  "titleEn": "Art Deco",
  "years": "1925—1939",
  "category": "建筑与海报",
  "categoryEn": "Architecture & posters",
  "description": "先立一条中轴，阶梯、放射和三线从中轴往两边同时长出来；金色是材质，只给线。一支 20 秒一镜到底的短片：光顺着海报的金线跑一圈，镜头推进拱窗、穿过一串三线拱门；玫瑰窗变成十二瓣万花筒，再塌成地平线上的太阳；夜景天际线三层纵深升起，探照灯成对交叉，镜头贴着主楼一路升到尖顶；五条规则翻转着飞来；最后海报一笔一笔重新长回去。",
  "descriptionEn": "Draw one central axis, then grow steps, sunbursts and triple lines out of it on both sides at once; gold is a material, used only for lines. A 20-second single-shot film: light races along the poster's gold lines, the camera pushes through the arch into a tunnel of triple-line portals, a rose window turns into a twelve-fold Busby Berkeley kaleidoscope that collapses into a sun on the horizon, a night skyline rises in three layers of depth under crossing searchlights while the camera rides the hero tower up to its spire, five rule plaques flip in from the distance, and the poster redraws itself stroke by stroke.",
  "tags": ["中轴对称", "阶梯", "放射", "三线", "金色", "海报", "品牌"],
  "tagsEn": ["symmetry", "ziggurat", "sunburst", "triple line", "gold", "posters", "branding"],
  "publishedAt": "2026-10-27T16:31:08Z",
  "release": "day-13",
  "asset": "013-art-deco.mp4",
  "sha256": "9df3171271f51ce6a2af8281e3307fb3f00c4974642c3d7473ad2060181ec05d",
  "images": [
    {"file": "poster", "title": "一张海报，认识装饰艺术", "kind": "风格海报", "titleEn": "Art Deco at a glance", "kindEn": "Style poster"},
    {"file": "cheatsheet", "title": "五种颜色、三种字、五个母题、五条规则", "kind": "风格速查", "titleEn": "Five colors, three typefaces, five motifs, five rules", "kindEn": "Quick reference"},
    {"file": "app-ui", "title": "如果装饰艺术来做 App", "kind": "界面应用", "titleEn": "Art Deco in an app", "kindEn": "UI application"},
    {"file": "steps", "title": "五步，从一条中轴到一张装饰艺术", "kind": "设计教程", "titleEn": "Five steps from one axis to Art Deco", "kindEn": "Design tutorial"}
  ]
}
```

2. `npm run gallery:sync`（会顺带更新两份 README 的预览表）→ `gallery:test` → `gallery:check` → 部署。
3. 把分支合进 `main`（README 里的“待发布”标记设计侧已去掉）。

## 设计侧留下的素材（不用动，供下次做新一期）

- `drafts/art-deco`、`drafts/op-art`：两套已完成三张风格图的候选风格，说明见 `drafts/README.md`。
- 其他分支上在做的期号：007 极简、010 剪纸、011 粘土拟态、012 等距。新开一期前先看 `git branch -r`，避免撞期号。
