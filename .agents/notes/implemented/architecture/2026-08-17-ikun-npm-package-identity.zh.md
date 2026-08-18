# Agent Note: Ikun npm 包身份

Status: implemented

[English](2026-08-17-ikun-npm-package-identity.md) | 中文

## 问题

npm CLI 会按包名解析自身及所有运行时依赖。若只改 CLI 名称而依赖仍留在 `@deepseek-ai`，`npx @ikun-ai/ikun` 就无法从所属组织安装完整运行时依赖。

## 决策

可安装的 CLI 是 `@ikun-ai/ikun`，并提供 `ikun` 二进制命令。仓库拥有的所有 workspace 包，包括 vendored 的 Cordis 框架包，均发布到 `@ikun-ai` scope；已有的 `dsh-*` 后缀与 `DSH_*` 本地状态变量继续作为运行时标识。

仓库元数据指向 `laowangyiyunle/ikun-ai`。共享应用发布家族名为 `ikun`，标签使用 `ikun-v<version>`，其发布工作流以同一身份验证并发布同一组包。

## 备选方案

- **仅重命名 `@deepseek-ai/dsh`**：CLI 仍依赖新组织无权发布或提供的包。
- **重命名全部 `dsh-*` 后缀与本地状态标识**：这会改变内部 API 与磁盘目录，却不能改善包安装。

## 后果

- 用户通过 `npx @ikun-ai/ikun` 安装 CLI，并运行 `ikun`。
- 发布工作流会发布完整的 `@ikun-ai` 运行时包集，因此打包安装验证覆盖消费者实际解析的名称。
- 首个 tagged release 前，`@deepseek-ai/dsh` 与 `dsh` 命令不提供兼容别名。
