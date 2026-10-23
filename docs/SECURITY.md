# 安全维护说明

网页画廊使用 `gallery/package-lock.json`，渲染工具链使用根 `package-lock.json`。安装和审计时保持这两棵依赖树独立；只发布 `dist/`。

## 安装与验证

需要 Node.js 22.12+、Git；安全 ZIP 测试另需 Python 3.10+。

```bash
npm ci
npm run gallery:setup
npm test
npx --no-install tsc --noEmit
npm audit --registry=https://registry.npmjs.org
npm audit --prefix gallery --registry=https://registry.npmjs.org
```

普通根安装会通过 `postinstall` 自动应用补丁。若使用 `npm ci --ignore-scripts`，必须随后运行 `npm run postinstall`；安全测试会直接调用实际的 renderer 解压函数，缺少补丁时失败。GitHub Actions 采用该安装方式，不执行第三方安装脚本。

## Remotion 解压补丁

所有 Remotion 包锁定为 4.0.538。PostCSS 已更新到 8.5.31，ws 更新到 8.21.0；旧 extract-zip 依赖已移除。

复审确认，4.0.538 自带的 ZIP 解压器仍会跟随最后一级符号链接写入。项目因此保留 `patches/@remotion+renderer+4.0.538.patch`，同时修复 CommonJS 与 ESM 实现：

- 在创建目录之前检查目标路径及已有祖先的真实路径。
- 创建符号链接之前按真实父目录检查链接目标，拒绝逃逸解压目录的链接，避免目录别名改变相对路径层级。
- 普通文件采用独占创建，拒绝写穿已有文件链接和覆盖同名条目。
- 保留正常文件、执行权限、目录内相对链接与向前引用。

补丁由 `scripts/apply-renderer-security-patch.mjs` 使用 Git 应用，可重复执行；版本或补丁上下文不匹配会停止安装，不静默跳过。它没有引入额外的补丁工具依赖。升级 Remotion 时必须重新检查上游解压器，并运行安全回归测试；确认上游完整修复后才能删除本地补丁。

该补丁保护本项目的顺序解压调用，不把与另一个本机进程同时修改解压目录的竞态攻击纳入保证范围。浏览器下载仍应来自可信的官方来源。

## 回归范围

`tests/gallery/serve.test.mjs` 验证空文件 GET / HEAD / Range 及后续请求；空文件不能导致进程退出。`tests/security/toolchain.test.mjs` 使用临时标记文件检查 CSS source map 读取，以及浏览器 ZIP 的符号链接、目录创建和正常解压行为，不访问个人文件。

`.github/workflows/security.yml` 在 push 和 pull request 时运行锁文件安装、补丁应用、回归测试、TypeScript、Remotion bundle 与两棵依赖树审计。该工作流没有发布权限；站点部署仍由原 Pages 工作流负责。
