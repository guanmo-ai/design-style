# 画廊代码与素材来源

网页参考 [Awesome AI Motion](https://github.com/guanmo-ai/awesome-ai-motion) 的暖纸色视觉、画廊布局、视口内静音循环预览、搜索筛选及弹窗观看方式，改写为 Design Style 自有作品目录。沿用其 CSS 基础约定与本地字体，相关 MIT 许可保留于 `LICENSE`。

- 字体 DM Sans、Newsreader 来自 Awesome AI Motion 的字体目录，SIL OFL 许可文件保留于 `assets/fonts/`。
- 语言切换入口的 globe 图标来自 [Lucide](https://github.com/lucide-icons/lucide/tree/main/icons)，保留原始 SVG；ISC 及其中继承 Feather 图标的 MIT 许可全文位于 `assets/icons/LICENSE-Lucide.txt`。未引入浏览器图标库运行时。
- 站内阅读页由 Marked 和 sanitize-html 在构建时生成，两者均为 MIT 许可。依赖版本记录于 `gallery/package-lock.json`，不在浏览器中加载运行。
- 网站视频仅来自 `guanmo-ai/design-style` 自身 GitHub Releases，构建前核验 SHA-256。
- 封面、风格图、时间轴与规格均来自本仓库 `styles/` 与 `layouts/`。不包含 Awesome AI Motion 的作品数据或第三方媒体。
- 本目录的 MIT 许可适用于画廊代码；视频、图片及原有项目内容的使用规则遵循仓库 README。转载请注明观默 @guanmo_ai。

## 交互动效（2026-11-11）

- [Amicro](https://github.com/Subhan-code/Amicro--Micro-transitions-)：沿用 `registry/lib/presets.ts` 的 `snappy` / `smooth` 弹簧参数，改写为原生 Web Animations API 采样，用于筛选指示器、卡片位置变化与预览展开。未引入其 React、Tailwind 或 Motion 运行时。MIT 许可全文见 `assets/licenses/LICENSE-Amicro.txt`。
- [Microsoft Fluent UI](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-motion/library/src/motions/motionTokens.ts)：沿用快慢时长与减速、加速曲线，用于按压、退出和内容切换。MIT 许可全文见 `assets/licenses/LICENSE-FluentUI.txt`。未使用其字体、图标或品牌素材。
- 当前动效适配代码为 `assets/motion.mjs`；首页直接展示作品选择，没有独立宣传短片区域。尊重系统减少动态效果设置。
