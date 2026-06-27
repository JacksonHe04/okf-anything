<h1 align="center">MOON ESCAPE</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Google-OKF_v0.1-4285F4?logo=google&logoColor=white" alt="Google OKF" />
  <img src="https://img.shields.io/badge/Notion-Integration-000000?logo=notion&logoColor=white" alt="Notion Integration" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white" alt="pnpm workspaces" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT" />
</p>

<p align="center">
  简体中文 | <a href="docs/README_EN.md">English</a> | <a href="docs/README_JA.md">日本語</a> | <a href="docs/README_ZH_TW.md">繁體中文</a>
</p>

<br>

> *They told us to aim for the Moon.*
> *We did. We put everything up there—*
> *our notes, our thoughts, our years of work—*
> *on someone else's servers, in someone else's client, behind someone else's paywall.*
>
> *Now the servers are slow. The seats cost more.*
> *And we're still up there, floating,*
> *wondering how to come home.*

<br />

***

曾几何时，**Moonshot** 是一个令人热血沸腾的词。

肯尼迪在 1962 年说，我们选择登月，不是因为它容易，而是因为它困难。\
后来，这个词被互联网公司借走了。\
每一个 SaaS 产品发布会，都是一次 Moonshot。\
每一个云端笔记工具，都是你"通往未来的第一步"。

于是我们把笔记搬上去了。把文档搬上去了。把知识搬上去了。\
Notion、飞书、语雀——它们接住了我们，给了我们漂亮的界面，流畅的体验，和按月计费的席位。

然后有一天，你想把自己的东西拿回来。

你才发现：**你上去容易，下来难。**

***

**MOON ESCAPE** 是一扇门——从月球上开的那扇门。

它把你在 Notion / Lark / 语雀里的整个工作空间，流式拉到本地，\
写成符合 **Google OKF（Open Knowledge Format）** 的 Markdown，\
父子关系、数据库行、自定义属性，一样不少地留住。\
然后你可以在浏览器里直接打开、编辑、搜索——不需要任何账号，不需要任何客户端。

你的知识，再也没有 monthly seat fee。

<br />

***

## 渠道接入

| 平台         | 目录                                   | 状态      | 备注                                                                       |
| ---------- | ------------------------------------ | ------- | ------------------------------------------------------------------------ |
| **Notion** | [`bye-bye-notion/`](bye-bye-notion/) | ✅ 可用    | 唯一已完整实现的平台；2025 多 Data Source、block\_id inline page、p-queue 限流、预算路径表全部到位 |
| Lark (飞书)  | [`bye-bye-lark/`](bye-bye-lark/)     | 🚧 仅初始化 | 目录已创建，代码待补                                                               |
| 语雀 (Yuque) | [`bye-bye-yuque/`](bye-bye-yuque/)   | 🚧 仅初始化 | 目录已创建，代码待补                                                               |

三个平台共享根目录的 [`moon-escape/common/`](moon-escape/common/) —— 路径解析、文件名清洗、冲突分配、frontmatter 读写全部平台无关，已为 Lark / Yuque 预留复用空间。

***

## 项目结构

```
moon-escape/
├── pnpm-workspace.yaml        # pnpm workspaces 配置（packages: ['.', 'moon-app', 'moon-shot']）
├── moon-escape/common/                # 跨平台共享工具（平台无关）
│   ├── paths.ts               # 解析 --export-dir / MOON_ESCAPE_EXPORT_DIR / ~/iNon/Wiki/
│   ├── sanitize.ts            # 文件名清洗（替换非法字符）
│   ├── path-allocator.ts      # 冲突后缀分配（X.md → X-1.md → X-2.md）
│   ├── frontmatter.ts         # YAML frontmatter 读写
│   ├── safe-call.ts           # try/catch 容错包装
│   └── count-md.ts            # 递归统计 .md 数量
│
├── bye-bye-notion/            # Notion 拉取实现（核心）
│   ├── src/
│   │   ├── main.ts            # 主流程：CLI → searchAll → 预算路径表 → 流式递归
│   │   ├── limiter.ts         # p-queue 3 req/s + 429/5xx 退避重试
│   │   └── notion/            # Notion SDK 封装
│   │       ├── client.ts      # dotenv + @notionhq/client (v2026-03-11)
│   │       ├── search.ts      # 全量 searchAll（page + data_source）
│   │       ├── page.ts        # retrievePage 元数据
│   │       ├── database.ts    # 2025 Model: data_source.retrieve + query
│   │       ├── blocks.ts      # BFS 拉 blocks 树（maxDepth=20）
│   │       ├── ancestor.ts    # block_id → page_id 祖先索引（inline page 归位）
│   │       ├── budget.ts      # 预算路径表（自上而下 BFS 解算最终 localPath）
│   │       └── markdown.ts    # block tree → markdown（含 mention 重写）
│   ├── scripts/               # 一次性诊断/校验脚本（dry-run, validate, verify-*）
│   └── docs/                  # 迁移设计 + Notion API 字段文档
│
├── bye-bye-lark/              # 飞书拉取（待实现）
├── bye-bye-yuque/             # 语雀拉取（待实现）
│
├── moon-app/                  # 本地 OKF Web 编辑器 (MOON)
│   ├── src/
│   │   ├── app/page.tsx       # 三栏编排（文件树 / 编辑器 / PageProperties）
│   │   ├── components/        # editor（Tiptap）/ file-tree / page-properties / search
│   │   ├── hooks/             # useDirectory / useFileTree / useAutoSave / useSearchIndex
│   │   └── lib/               # fs-access / frontmatter / markdown-serde / double-link / search-index / db
│   └── docs/                  # 设计文档 + TODOs
│
├── moon-shot/                 # RAG 检索与 Agent API 引擎 (SHOT)
│   ├── src/                   # 搜索引擎与 API 实现
│   └── README.md              # 模块使用说明
│
├── okf/docs/                  # Google OKF 规范（OKF.md 原文 + OKF_CN.md 中文翻译）
├── docs/                      # 项目文档
│   ├── README_EN.md           # 英文项目 README（更详细的用户视角）
│   └── superpowers/
│       ├── specs/             # Web 编辑器 v1/v2/v3 设计规格
│       └── plans/             # 对应实施计划
│
├── AGENTS.md                  # → CLAUDE.md
└── CLAUDE.md                  # 项目指引：Notion 字段映射 + 拉取策略 + 三条铁律
```

***

## Features

### 拉取端（bye-bye-notion）

- **流式拉取，带 ID 幂等** —— 扫一个写一个，断网/崩了不丢，重跑按 `notion_id` 跳过已导子树
- **Notion 2025 model 完整支持** —— Database 容器 + 多 Data Source、`block_id` 父页面、扁平化自定义属性全部映射进 OKF YAML
- **预算路径表（Budgeted Path Map）** —— 子 page 未拉时，父 page 渲染时仍能用正确相对路径写出 `## Children` 列表
- **限流 + 退避** —— p-queue 3 req/s + `Retry-After` 解析 + 5xx 指数退避 + jitter
- **输出符合 OKF v0.1** —— YAML frontmatter + 父子目录结构，GitHub 直接渲染、任何 LLM Agent 可读

### Web 编辑器端（moon-app/）

- **File System Access API 选目录 + IndexedDB 句柄持久化** —— 选一次后续自动恢复，权限失效有 reauth 按钮
- **三栏布局** —— 左侧文件树 / 中间 Tiptap 富文本 / 右侧 PageProperties
- **PageProperties 面板** —— js-yaml 解析 OKF 11 字段（OKF 6 + Notion 5），未知字段透传不丢
- **Markdown 相对路径双链跳转** —— Cmd/Ctrl + 点击，编辑器外用 `getFileHandleByPath` 解析跨层路径
- **全局搜索（MiniSearch + Cmd/Ctrl+K）** —— 中文 2-gram + 英文空格分词，递归扫子目录
- **5s debounce 自动保存 + 状态指示器** —— 互斥锁避免并发写、Cmd/Ctrl+S 立即保存
- **文件/文件夹 CRUD** —— 右键菜单新建/重命名/删除，文件名 `-1` 自动防冲突

***

## Quick Start

### 0. 安装

```bash
pnpm install
```

复制 `.env.example` 并粘贴 TOKEN。

### 1. 先预览拉取计划（不写盘）

```bash
pnpm dry-run --root <page-uuid> [--root <page-uuid>...]
```

只读 Notion，把子树以 markdown 树状清单打印到 stdout，不写任何文件。`<page-uuid>` 接受 32hex / 8-4-4-4-12 / notion.so URL 三种形式。

### 2. 真正拉取（流式写盘）

```bash
pnpm start --root <page-uuid>
```

每扫到一个 page/database 就立刻写盘，挂掉时已扫描的内容都在导出目录里。重跑时按 `notion_id` 跳过已导出的整棵子树——要强制重导某个子树，删掉对应的 `.md` 或目录即可。

可用脚本（一次 `pnpm install` 装好后）：

| 命令               | 作用                                                                   |
| ---------------- | -------------------------------------------------------------------- |
| `pnpm start`     | 启动 Notion 流式拉取                                                       |
| `pnpm dry-run`   | 只读预览，不写盘                                                             |
| `pnpm typecheck` | `tsc --noEmit`（覆盖 src + bye-bye-notion/src + bye-bye-notion/scripts） |
| `pnpm build`     | TypeScript 编译到 `dist/`                                               |
| `pnpm web`       | 启 Web 编辑器（`next dev`）                                                |
| `pnpm web:build` | 构建 Web 编辑器生产包                                                        |

子包命令也可直接进 `moon-app/` 跑 `pnpm dev` / `pnpm test`，pnpm workspaces 自动提升依赖。

### 3. 自定义导出目录

默认会把内容写到 `~/iNon/Wiki/`（首次运行会自动创建）。如需改路径：

```bash
# 命令行 flag
pnpm start --root <id> --export-dir /path/to/wiki

# 或环境变量（适合 shell alias / CI）
MOON_ESCAPE_EXPORT_DIR=/path/to/wiki pnpm start --root <id>

# 路径里的 ~ 会被自动展开到 $HOME
pnpm start --root <id> --export-dir '~/Documents/wiki'
```

解析优先级：`--export-dir` flag → `MOON_ESCAPE_EXPORT_DIR` 环境变量 → `~/iNon/Wiki/` 默认值。

> 移动后重跑 `pnpm start` 会按 `notion_id` 自动复用，不会重写文件）。

### 4. 在浏览器里编辑

```bash
pnpm web
# 打开 http://localhost:3000/
```

选 `~/iNon/Wiki/` 目录 → 授权读写 → 左侧文件树 → 中间 Tiptap 富文本 → 右侧 PageProperties（11 字段卡）→ `Cmd/Ctrl+S` 立即保存 / 5s 后自动保存 / `Cmd/Ctrl+K` 全文搜索。

需要 Chromium 内核浏览器（File System Access API）；其他浏览器会在加载时报 `unsupported` 状态。

***

## 深入阅读

### 设计与规范

- **OKF 规范** —— [`okf/docs/OKF_CN.md`](okf/docs/OKF_CN.md)（中文翻译，源自 Google Cloud 博客 2026-06）
- **Notion 字段映射** —— [`bye-bye-notion/docs/`](bye-bye-notion/docs/)（PAGE / DATABASE / PAGE\_PROPERTIES / NOTION\_PAT）

### 参考资源

- OKF (Open Knowledge Format, Google Cloud, 2026-06)：<https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing>
- OKF 示例 bundle：<https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf>
- Notion PAT：<https://developers.notion.com/guides/get-started/personal-access-tokens>
- File System Access API：<https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API>

***

## 代码检查与测试

```bash
# 根目录 TypeScript（覆盖 src + bye-bye-notion/src + bye-bye-notion/scripts）
pnpm typecheck

# Web 编辑器单元测试（vitest + happy-dom + fake-indexeddb）
pnpm --filter moon-app test

# 一次性诊断（Notion 端，tsx 已在 devDeps 中）
pnpm exec tsx bye-bye-notion/scripts/validate.ts          # 比对 4 个 root 子树 vs 本地 .md
pnpm exec tsx bye-bye-notion/scripts/verify-ids.ts        # 逐 .md 校验 notion_id
pnpm exec tsx bye-bye-notion/scripts/verify-ancestor-index.mts  # 验证 inline page 归位
```

***

## 包管理（pnpm workspaces）

项目使用 **pnpm workspaces** 管理 monorepo：

- 根 `pnpm-workspace.yaml` 声明 `packages: ['.', 'moon-app', 'moon-shot']`
- 共享根 `pnpm-lock.yaml`，依赖去重、install 更快
- 子包命令统一用 `pnpm --filter <pkg> <cmd>` 或在子包目录直接跑
- `.pnpm-store/`（如果用全局 store）已被 `.gitignore` 排除

***

<br />

*We chose to go to the Moon.*\
*Now we choose to leave.*\
*Not with fanfare. Just quietly,*\
*with our notes tucked under one arm,*\
*walking back down.*
