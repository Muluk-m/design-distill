## Why

当前 skill 是一个三合一的单体设计（distill + design + library），导致多个问题：

1. **存储位置错误**：distill 结果写到项目根目录 `./DESIGN.md`，但提取的是别人的设计系统，不应该污染当前项目
2. **职责混乱**：一个 skill 通过 mode detection 自动切换三种行为，用户无法明确控制
3. **文件结构断裂**：symlink → `.agents/` 方案实际不 work，安装后版本与源不同步
4. **缺少 CLI 层**：安装初始化、全局库管理等非 AI 操作没有独立的命令行工具

## What Changes

- **BREAKING**: 移除单体 `design-distill` skill，拆为 `design:distill` 和 `design:apply` 两个 skill
- **BREAKING**: distill 不再写 `./DESIGN.md` 到项目根目录，只存全局库 `~/.config/design-distill/<name>/DESIGN.md`
- 新增 `design-distill` CLI（Node.js），处理安装初始化和全局库 CRUD
- 移除 `.agents/` symlink 架构，skill 文件直接放在 `skills/` 下
- 更新 `package.json` 支持 `npx design-distill` 和 `npx skills add`

## Capabilities

### New Capabilities
- `cli`: CLI 工具 (`npx design-distill`)，提供 `init`、`list`、`show`、`remove`、`path` 子命令，管理全局库和依赖安装
- `skill-distill`: `design:distill` skill，AI 辅助提取设计系统（dembrandt + 截图），存入全局库；无参数时列出已有风格
- `skill-apply`: `design:apply` skill，加载设计系统 + re-screenshot 源站 + 生成风格一致的代码

### Modified Capabilities

## Impact

- 整个 `skills/` 目录重构：删除旧 `skills/design-distill/`，新建 `skills/design-distill/` 和 `skills/design-apply/`
- 新增 `bin/` 目录存放 CLI 入口
- `package.json` 需要新增 `bin` 字段和 CLI 依赖
- `.claude/skills/design-distill` symlink 需要更新或移除
- 用户需要重新安装 skill（`npx skills add`）
- 已有的 `~/.config/design-distill/` 全局库数据格式不变，向后兼容
