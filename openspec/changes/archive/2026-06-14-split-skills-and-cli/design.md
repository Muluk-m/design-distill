## Context

当前项目是一个单体 skill（`design-distill`），通过 mode detection 在一个 SKILL.md 内切换三种行为。存在结构性问题：distill 结果写入项目根目录、symlink 架构断裂、无 CLI 层。

项目需要从"一个 skill 做所有事"重构为"CLI 做数据层 + 多个 skill 做智能层"的分层架构，参考 openspec（CLI）+ opsx（skills）的模式。

当前全局库路径 `~/.config/design-distill/` 已有用户数据，格式需保持兼容。

## Goals / Non-Goals

**Goals:**
- 拆分为两个独立 skill（`design:distill` 和 `design:apply`），各有明确的 `argument-hint`
- 新增 CLI 工具（`npx design-distill`），承载初始化和全局库管理
- distill 结果只存全局库，不写项目根目录
- 移除 `.agents/` symlink 方案，skill 文件直接存放
- 一个 npm 包同时提供 CLI + skills

**Non-Goals:**
- 不改变 DESIGN.md 的文档格式（保持 Stitch 兼容）
- 不改变全局库路径 `~/.config/design-distill/`
- 不构建 GUI 或 Web 界面
- 不支持 design token 的自动同步/watch

## Decisions

### 1. 项目结构：mono-package，CLI + skills 共存

```
design-distill/
├── bin/cli.js                        ← CLI 入口
├── src/                              ← CLI 实现
│   ├── commands/
│   │   ├── init.js                   ← 装 dembrandt + playwright
│   │   ├── list.js
│   │   ├── show.js
│   │   ├── remove.js
│   │   └── path.js
│   └── lib/
│       └── store.js                  ← 全局库读写逻辑
├── skills/
│   ├── design-distill/
│   │   ├── SKILL.md
│   │   └── references/template.md
│   └── design-apply/
│       └── SKILL.md
├── package.json
└── README.md
```

**Why**: 一个包安装一次即可。`npx skills add` 装 skills，`npx design-distill` 用 CLI。避免用户管理两个包。

**Alternative considered**: 分成两个 npm 包（CLI 包 + skills 包）。增加维护成本且 skills 经常需要调用 CLI，放一起更自然。

### 2. Skill 命名空间：`design:distill` / `design:apply`

Skills 使用 `design:` 前缀命名空间，类似 `opsx:explore` / `opsx:apply`。

**Why**: 语义清晰，`design` 表达领域，动词表达动作。用户可以 tab 补全。

**Alternative considered**: `dna:distill` — 太短且语义不明确。`design-distill:extract` — 冗余。

### 3. CLI 用 Node.js，最小依赖

CLI 使用 Node.js 编写，仅依赖 `commander`（或无依赖手写 arg parsing），不引入构建步骤。

**Why**: 项目已经在 Node.js 生态（dembrandt 是 npm 包），保持一致。CLI 功能简单，不需要重框架。

**Alternative considered**: Shell script — 跨平台差；Rust/Go — 过度工程。

### 4. 全局库路径不变

继续使用 `~/.config/design-distill/<name>/DESIGN.md`。

**Why**: 已有用户数据，无迁移成本。符合 XDG 规范（macOS/Linux）。

### 5. `design:distill` 无参数行为 = list

当 `design:distill` 不带参数调用时，等同于 `npx design-distill list`，列出全局库中所有已保存的风格。

**Why**: 最常见的"不知道该做什么"场景是想看有什么可用的。避免无意义的报错。

### 6. `design:apply` 风格解析优先级

1. 用户显式指定风格名 → 全局库
2. 当前项目有 `./DESIGN.md` → 本地（项目自己的设计系统）
3. 都没有 → 列出可用风格让用户选

**Why**: 显式优先于隐式。本地 DESIGN.md 是项目自有设计系统的合法场景（如产品开发），应该支持。

## Risks / Trade-offs

**[Breaking change]** → 现有用户的 `design-distill` skill 会失效，需要重新安装。通过 README 和 CHANGELOG 说明迁移步骤。

**[CLI 可能被跳过]** → 用户可能直接用 skill 而从不装 CLI。Skill 内部调用 `npx design-distill` 时会自动下载，但首次会慢。→ skill 的 setup 步骤检测 CLI 是否可用。

**[命名冲突]** → npm 上 `design-distill` 包名可能已被占用。→ 发布前检查，备选 `@design-distill/cli` 或 `design-distill-cli`。
