## Context

当前 CLI 是纯 JS（~1100 行），无类型检查。Skill 内部通过 `npx design-distill` 调用 CLI，每次走 npx 包解析。`init` 安装了 dembrandt 和 Playwright，但没安装 CLI 自身到全局 PATH。

## Goals / Non-Goals

**Goals:**
- 全部 `src/**/*.js` → `src/**/*.ts`，添加完整类型
- 使用 tsdown 构建，产出 `dist/cli.mjs`
- `init` 新增全局安装步骤，后续直接 `design-distill` 调用
- Skill 里 `npx design-distill` → `design-distill`

**Non-Goals:**
- 不改功能逻辑，纯重写 + 构建管道
- 不引入运行时类型校验（zod 等）
- 不改目录结构（`src/commands/`, `src/lib/`）

## Decisions

### 1. 构建工具：tsdown

使用 [tsdown](https://tsdown.dev)（基于 Rolldown），配置极简。

```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/cli.ts'],
  format: 'esm',
  platform: 'node',
  banner: { js: '#!/usr/bin/env node' },
})
```

**Why tsdown over tsup**: tsdown 基于 Rolldown（Rust），构建更快，是 tsup 的下一代替代。配置兼容。

### 2. 入口文件变更

```
Before:
  bin/cli.js (手写源码，直接执行)
  package.json → "bin": { "design-distill": "./bin/cli.js" }

After:
  src/cli.ts (源码入口)
  dist/cli.mjs (构建产物，带 shebang)
  package.json → "bin": { "design-distill": "./dist/cli.mjs" }
```

`bin/` 目录删除，`dist/` 加入 `.gitignore`。

### 3. package.json 变更

```json
{
  "type": "module",
  "bin": { "design-distill": "./dist/cli.mjs" },
  "files": ["dist", "skills", "bundled"],
  "scripts": {
    "build": "tsdown",
    "prepublishOnly": "tsdown"
  },
  "devDependencies": {
    "tsdown": "^0.x",
    "typescript": "^5.x"
  }
}
```

`src/` 不再随包分发（只分发 `dist/`）。

### 4. init 全局安装

init 命令新增步骤：

```ts
// 检测 CLI 是否已在 PATH
const cliInPath = isCommandAvailable('design-distill')
if (!cliInPath) {
  execSync('npm install -g design-distill', { stdio: 'inherit' })
}
```

放在 dembrandt 安装之前，因为这是最基本的依赖。

### 5. Skill 调用方式

```diff
- npx design-distill path <name> 2>/dev/null
+ design-distill path <name> 2>/dev/null
```

所有 Skill 的 SKILL.md 里统一替换。README 中首次 init 保留 `npx`（因为此时 CLI 还没装），后续操作用 `design-distill`。

### 6. TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": false
  },
  "include": ["src"]
}
```

不生成 `.d.ts`（CLI 工具不需要类型导出）。

### 7. 类型策略

- `store.ts`: 导出 `StyleHeader`, `CopyResult` 等接口
- `preview.ts`: 定义 `Overview`, `ColorEntry`, `TypographyEntry`, `SpacingValue`, `ComponentEntry` 类型
- `diff.ts`: 定义 `TokenMap`, `DiffRow` 类型
- 各 command 函数入参和返回值全部标注

## Risks / Trade-offs

- **全局安装可能失败**: 权限不足（无 sudo）→ 错误提示中建议 `sudo npm install -g` 或使用 nvm
- **Node.js 版本要求**: tsdown 要求 Node 20.19+，比当前无要求更严 → package.json 添加 `engines` 字段
- **构建步骤**: 开发者 clone 后需要先 `npm run build` → 添加 `prepare` script 自动构建
- **npx 回退**: 用户跳过 init 直接调 skill，`design-distill` 不在 PATH → Skill 里加 fallback 提示
