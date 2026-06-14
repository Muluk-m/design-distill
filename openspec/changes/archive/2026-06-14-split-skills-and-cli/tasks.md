## 1. 清理旧结构

- [x] 1.1 删除 `.agents/` 目录和所有指向它的 symlink（`skills/design-distill` → `.agents/...`，`.claude/skills/design-distill` → `../../.agents/...`）
- [x] 1.2 删除旧的单体 `skills/design-distill/SKILL.md` 和 `skills/design-distill/references/template.md`
- [x] 1.3 清理 `skills-lock.json` 中旧的 `design-distill` 条目

## 2. CLI 基础设施

- [x] 2.1 创建 `package.json`，配置 `bin.design-distill` 指向 `bin/cli.js`，添加 `commander` 依赖
- [x] 2.2 创建 `bin/cli.js` 入口文件，注册子命令（init, list, show, remove, path, diff, preview）
- [x] 2.3 创建 `src/lib/store.js`，封装全局库路径（`~/.config/design-distill/`）的读写逻辑

## 3. CLI 命令实现（核心）

- [x] 3.1 实现 `init` 命令：检测并安装 dembrandt + Playwright chromium，复制 bundled styles 到全局库（已存在则跳过，`--force` 覆盖）
- [x] 3.2 实现 `list` 命令：遍历全局库目录，解析每个 DESIGN.md 的 header（name, source_url, distilled），支持 `--json` 输出
- [x] 3.3 实现 `show <name>` 命令：输出指定风格的 DESIGN.md 内容
- [x] 3.4 实现 `remove <name>` 命令：删除指定风格目录，含确认提示
- [x] 3.5 实现 `path <name>` 命令：输出 DESIGN.md 绝对路径

## 3b. CLI 命令实现（扩展）

- [x] 3.6 实现 `diff <name>` 命令：通过 dembrandt 重新提取 source_url 的 tokens，与保存的 DESIGN.md 对比，输出 markdown 表格（Category, Token, Old Value, New Value），过滤噪声（deltaE < 5 的颜色变化、< 2px 的间距变化忽略）。Playwright 为硬依赖。
- [x] 3.7 实现 `preview <name>` 命令：解析 DESIGN.md 生成独立 HTML（色板、字体样本、间距比例尺、组件形态），写入临时文件，跨平台打开（macOS: open, Linux: xdg-open, Windows: start）
- [x] 3.8 准备 bundled styles：手工提取 linear/vercel/stripe/notion/github 的 DESIGN.md，提交到 `bundled/` 目录，每次发版前验证

## 4. Skill: design:distill

- [x] 4.1 创建 `skills/design-distill/SKILL.md`，包含正确的 frontmatter（name, description, argument-hint）
- [x] 4.2 编写 Distill Mode 流程：URL 输入 → dembrandt + 截图 → 生成 DESIGN.md → 只存全局库 + 截图存档到 `<name>/screenshots/`
- [x] 4.3 编写 Local Project 提取流程：读 tailwind/CSS/tokens → 生成 DESIGN.md → 存全局库
- [x] 4.4 编写无参数行为：调用 `npx design-distill list` 列出已有风格
- [x] 4.5 更新 `skills/design-distill/references/template.md` 为最新 Stitch 兼容格式

## 5. Skill: design:apply

- [x] 5.1 创建 `skills/design-apply/SKILL.md`，包含正确的 frontmatter（name, description, argument-hint）
- [x] 5.2 编写风格加载逻辑：显式风格名 → 全局库；无风格名 → 本地 `./DESIGN.md`；都没有 → 列出让用户选
- [x] 5.3 编写 re-screenshot 逻辑：从 DESIGN.md 读 source_url，用 `/browse` 截图做视觉校准。失败时 fallback 到 `<name>/screenshots/` 存档截图，都没有则纯文档生成
- [x] 5.4 编写生成约束：颜色、字体、组件形状必须来自 DESIGN.md，含 post-generation self-check

## 6. 收尾

- [x] 6.1 更新 README.md：新的安装命令、使用示例（两个 skill + CLI）、架构图
- [x] 6.2 更新 `.claude/skills/` 下的 symlink 或直接引用，确保本地开发时 skill 可被加载
- [x] 6.3 更新安装到 `~/.claude/skills/` 的副本，验证 `npx skills add` 流程正常
