## Why

CLI 目前是纯 JS，缺乏类型安全，preview/diff 等复杂命令里隐式类型假设多，维护成本随功能增加而上升。同时 Skill 内部通过 `npx design-distill` 调用 CLI，每次都走包解析，慢且依赖 npx 运行时行为。`init` 已经负责安装依赖，应该同时全局安装 CLI 本身，让后续调用直接走 `design-distill`。

## What Changes

- **BREAKING**: `bin/cli.js` 不再是源码入口，改为 tsdown 构建产物 `dist/cli.js`
- 全部 `src/**/*.js` 重写为 `src/**/*.ts`，添加类型定义
- 添加 `tsdown` 构建管道，`tsconfig.json` 配置
- `init` 命令新增 `npm install -g design-distill` 步骤，将 CLI 安装到全局 PATH
- Skill SKILL.md 中所有 `npx design-distill` 改为 `design-distill`
- README 中用户手动命令：首次 init 保留 `npx`，后续操作改为 `design-distill`
- `package.json` 更新 `bin` 指向 `dist/cli.js`，添加 `build` script 和 devDependencies

## Capabilities

### New Capabilities

- `ts-build-pipeline`: tsdown 构建配置，TypeScript 编译为 ESM 单文件分发，开发时类型检查

### Modified Capabilities

- `cli`: init 命令新增全局安装自身步骤；`bin` 入口从源码改为构建产物；所有命令文件从 JS 改为 TS
- `skill-distill`: 内部 CLI 调用从 `npx design-distill` 改为 `design-distill`
- `skill-apply`: 内部 CLI 调用从 `npx design-distill` 改为 `design-distill`

## Impact

- **构建**: 新增 tsdown + typescript devDependencies，需要 `npm run build` 后才能分发
- **分发**: `files` 字段从 `["bin", "src", ...]` 改为 `["dist", ...]`，源码不再随包分发
- **安装流程**: `init` 后 CLI 进入全局 PATH，Skill 不再依赖 npx
- **开发体验**: 所有函数有类型签名，IDE 补全和重构更可靠
