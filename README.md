# release-assets

只用于发布成片，不是项目主线（主线见 `main`）。每个 `day-NN/` 是一次 Release：推送到本分支后，`.github/workflows/publish-release.yml` 会核对 SHA-256，并为还不存在的 tag 创建 GitHub Release。
