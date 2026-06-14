## 1. 构建基础设施

- [x] 1.1 安装 devDependencies: `tsdown`, `typescript`
- [x] 1.2 创建 `tsconfig.json`（strict, noUncheckedIndexedAccess, ESNext, bundler resolution）
- [x] 1.3 创建 `tsdown.config.ts`（entry: src/cli.ts, format: esm, platform: node, shebang banner）
- [x] 1.4 更新 `package.json`: bin → `./dist/cli.mjs`, scripts (build, prepare, prepublishOnly), files → `["dist", "skills", "bundled"]`, engines → node >=20.19
- [x] 1.5 删除 `bin/` 目录，添加 `dist/` 到 `.gitignore`

## 2. TypeScript 重写 — 核心库

- [x] 2.1 `src/lib/store.js` → `src/lib/store.ts`: 添加 `StyleHeader`, `CopyResult` 接口，所有函数标注参数和返回类型
- [x] 2.2 创建 `src/types.ts`: 定义 `Overview`, `ColorEntry`, `TypographyEntry`, `SpacingValue`, `ComponentEntry`, `TokenMap`, `DiffRow` 等共享类型

## 3. TypeScript 重写 — 命令

- [x] 3.1 `src/commands/init.js` → `src/commands/init.ts`: 新增全局安装 `design-distill` 步骤（在 dembrandt 之前），检测是否已在 PATH，失败时提示权限解决方案
- [x] 3.2 `src/commands/list.js` → `src/commands/list.ts`: 标注类型
- [x] 3.3 `src/commands/show.js` → `src/commands/show.ts`: 标注类型
- [x] 3.4 `src/commands/remove.js` → `src/commands/remove.ts`: 标注类型
- [x] 3.5 `src/commands/path.js` → `src/commands/path.ts`: 标注类型
- [x] 3.6 `src/commands/diff.js` → `src/commands/diff.ts`: 定义 `TokenMap`, `DiffRow` 类型，标注 extractTokens 等函数
- [x] 3.7 `src/commands/preview.js` → `src/commands/preview.ts`: 使用共享类型标注 extract* 函数和 generateHtml

## 4. 入口文件

- [x] 4.1 `bin/cli.js` → `src/cli.ts`: 移动入口到 src 下，改为 TS，注册所有子命令
- [x] 4.2 验证 `npm run build` 产出 `dist/cli.mjs` 且可执行

## 5. Skill 更新

- [x] 5.1 `skills/design-distill/SKILL.md`: 所有 `npx design-distill` → `design-distill`，添加 CLI 不可用时的 fallback 提示
- [x] 5.2 `skills/design-apply/SKILL.md`: 所有 `npx design-distill` → `design-distill`
- [x] 5.3 `README.md`: 首次 init 保留 `npx`，后续命令改为 `design-distill`

## 6. 验证

- [x] 6.1 `npx tsc --noEmit` 零错误
- [x] 6.2 `npm run build` 成功，`dist/cli.mjs` 包含 shebang
- [x] 6.3 `node dist/cli.mjs list` 正常工作
- [x] 6.4 `node dist/cli.mjs preview linear` 正常打开浏览器
