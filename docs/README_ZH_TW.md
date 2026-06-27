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
  <a href="../README.md">简体中文</a> | <a href="README_EN.md">English</a> | <a href="README_JA.md">日本語</a> | 繁體中文
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

曾幾何時，**Moonshot** 是一個令人熱血沸騰的詞。

甘迺迪在 1962 年說，我們選擇登月，不是因為它容易，而是因為它困難。\
後來，這個詞被網路公司借走了。\
每一個 SaaS 產品發表會，都是一次 Moonshot。\
每一個雲端筆記工具，都是你「通往未來的第一步」。

於是我們把筆記搬上去了。把文件搬上去了。把知識搬上去了。\
Notion、飛書、語雀——它們接住了我們，給了我們漂亮的介面，流暢的體驗，和按月計費的席位。

然後有一天，你想把自己的東西拿回來。

你才發現：**你上去容易，下來難。**

***

**MOON ESCAPE** 是一扇門——從月球上開的那扇門。

它把你在 Notion / Lark / 語雀裡的整個工作空間，串流拉取到本地，\
寫成符合 **Google OKF（Open Knowledge Format）** 的 Markdown，\
父子關係、資料庫列、自訂屬性，一樣不少地留住。\
然後你可以在瀏覽器裡直接打開、編輯、搜尋——不需要任何帳號，不需要任何用戶端。

你的知識，再也沒有 monthly seat fee。

<br />

***

## 管道接入

| 平台 | 目錄 | 狀態 | 備註 |
| --- | --- | --- | --- |
| **Notion** | [`bye-bye-notion/`](../bye-bye-notion/) | ✅ 可用 | 唯一已完整實作的平台；2025 多 Data Source、block\_id inline page、p-queue 限流、預算路徑表全部到位 |
| Lark (飛書) | [`bye-bye-lark/`](../bye-bye-lark/) | 🚧 僅初始化 | 目錄已建立，程式碼待補 |
| 語雀 (Yuque) | [`bye-bye-yuque/`](../bye-bye-yuque/) | 🚧 僅初始化 | 目錄已建立，程式碼待補 |

三個平台共享根目錄的 [`moon-escape/common/`](../moon-escape/common/) —— 路徑解析、檔案名稱清洗、衝突分配、frontmatter 讀寫全部平台無關，已為 Lark / Yuque 預留複用空間。

***

## 專案結構

```
moon-escape/
├── pnpm-workspace.yaml        # pnpm workspaces 設定（packages: ['.', 'web']）
├── moon-escape/common/                # 跨平台共享工具（平台無關）
│   ├── paths.ts               # 解析 --export-dir / MOON_ESCAPE_EXPORT_DIR / ~/iNon/Wiki/
│   ├── sanitize.ts            # 檔案名稱清洗（替換非法字元）
│   ├── path-allocator.ts      # 衝突字尾分配（X.md → X-1.md → X-2.md）
│   ├── frontmatter.ts         # YAML frontmatter 讀寫
│   ├── safe-call.ts           # try/catch 容錯包裝
│   └── count-md.ts            # 遞迴統計 .md 數量
│
├── bye-bye-notion/            # Notion 拉取實作（核心）
│   ├── src/
│   │   ├── main.ts            # 主流程：CLI → searchAll → 預算路徑表 → 串流遞迴
│   │   ├── limiter.ts         # p-queue 3 req/s + 429/5xx 退避重試
│   │   └── notion/            # Notion SDK 封裝
│   │       ├── client.ts      # dotenv + @notionhq/client (v2026-03-11)
│   │       ├── search.ts      # 全量 searchAll（page + data_source）
│   │       ├── page.ts        # retrievePage 中介資料
│   │       ├── database.ts    # 2025 Model: data_source.retrieve + query
│   │       ├── blocks.ts      # BFS 拉 blocks 樹（maxDepth=20）
│   │       ├── ancestor.ts    # block_id → page_id 祖先索引（inline page 歸位）
│   │       ├── budget.ts      # 預算路徑表（自上而下 BFS 解算最終 localPath）
│   │       └── markdown.ts    # block tree → markdown（含 mention 重寫）
│   ├── scripts/               # 一次性診斷/校驗指令碼（dry-run, validate, verify-*）
│   └── docs/                  # 遷移設計 + Notion API 欄位文件
│
├── bye-bye-lark/              # 飛書拉取（待實作）
├── bye-bye-yuque/             # 語雀拉取（待實作）
│
├── web/                       # 本地 OKF Web 編輯器
│   ├── src/
│   │   ├── app/page.tsx       # 三欄編排（檔案樹 / 編輯器 / PageProperties）
│   │   ├── components/        # editor（Tiptap）/ file-tree / page-properties / search
│   │   ├── hooks/             # useDirectory / useFileTree / useAutoSave / useSearchIndex
│   │   └── lib/               # fs-access / frontmatter / markdown-serde / double-link / search-index / db
│   └── docs/                  # 設計文件 + TODOs
│
├── okf/docs/                  # Google OKF 規範（OKF.md 原文 + OKF_CN.md 中文翻譯）
├── docs/                      # 專案文件
│   ├── README_EN.md           # 英文專案 README（更詳細的使用者視角）
│   └── superpowers/
│       ├── specs/             # Web 編輯器 v1/v2/v3 設計規格
│       └── plans/             # 對應實施計劃
│
├── AGENTS.md                  # → CLAUDE.md
└── CLAUDE.md                  # 專案指引：Notion 欄位映射 + 拉取策略 + 三條鐵律
```

***

## 功能特性

### 拉取端（bye-bye-notion）

- **串流拉取，帶 ID 冪等** —— 掃一個寫一個，防斷網/當機不丟失，重跑按 `notion_id` 跳過已導出子樹
- **Notion 2025 model 完整支援** —— Database 容器 + 多 Data Source、`block_id` 父頁面、扁平化自訂屬性全部映射進 OKF YAML
- **預算路徑表（Budgeted Path Map）** —— 子 page 未拉取時，父 page 渲染時仍能用正確相對路徑寫出 `## Children` 列表
- **限流 + 退避** —— p-queue 3 req/s + `Retry-After` 解析 + 5xx 指數退避 + jitter
- **輸出符合 OKF v0.1** —— YAML frontmatter + 父子目錄結構，GitHub 直接渲染、任何 LLM Agent 可讀

### Web 編輯器端（web/）

- **File System Access API 選目錄 + IndexedDB 句柄持久化** —— 選一次後續自動恢復，權限失效有 reauth 按鈕
- **三欄佈局** —— 左側檔案樹 / 中間 Tiptap 富文本 / 右側 PageProperties
- **PageProperties 面板** —— js-yaml 解析 OKF 11 欄位（OKF 6 + Notion 5），未知欄位透傳不丟失
- **Markdown 相對路徑雙鏈跳轉** —— Cmd/Ctrl + 點擊，編輯器外用 `getFileHandleByPath` 解析跨層路徑
- **全域搜尋（MiniSearch + Cmd/Ctrl+K）** —— 中文 2-gram + 英文空格分詞，遞迴掃子目錄
- **5s debounce 自動儲存 + 狀態指示器** —— 互斥鎖避免並發寫入、Cmd/Ctrl+S 立即儲存
- **檔案/資料夾 CRUD** —— 右鍵選單新建/重新命名/刪除，檔案名稱 `-1` 自動防衝突

***

## 快速上手

### 0. 安裝

```bash
pnpm install
```

複製 `.env.example` 並貼上 TOKEN。

### 1. 先預覽拉取計劃（不寫入磁碟）

```bash
pnpm dry-run --root <page-uuid> [--root <page-uuid>...]
```

唯讀 Notion，把子樹以 markdown 樹狀清單列印到 stdout，不寫入任何檔案。`<page-uuid>` 接受 32hex / 8-4-4-4-12 / notion.so URL 三種形式。

### 2. 真正拉取（串流寫入磁碟）

```bash
pnpm start --root <page-uuid>
```

每掃到一個 page/database 就立刻寫入磁碟，掛掉時已掃描的內容都在導出目錄裡。重跑時按 `notion_id` 跳過已導出的整棵子樹——要強制重導某個子樹，刪掉對應的 `.md` 或目錄即可。

可用指令（一次 `pnpm install` 裝好後）：

| 指令 | 作用 |
| --- | --- |
| `pnpm start` | 啟動 Notion 串流拉取 |
| `pnpm dry-run` | 唯讀預覽，不寫入磁碟 |
| `pnpm typecheck` | `tsc --noEmit`（覆蓋 src + bye-bye-notion/src + bye-bye-notion/scripts） |
| `pnpm build` | TypeScript 編譯到 `dist/` |
| `pnpm web` | 啟 Web 編輯器（`next dev`） |
| `pnpm web:build` | 建構 Web 編輯器生產包 |

子包指令也可直接進 `web/` 跑 `pnpm dev` / `pnpm test`，pnpm workspaces 自動提升依賴。

### 3. 自訂導出目錄

預設會把內容寫到 `~/iNon/Wiki/`（首次執行會自動建立）。如需改路徑：

```bash
# 命令列 flag
pnpm start --root <id> --export-dir /path/to/wiki

# 或環境變數（適合 shell alias / CI）
MOON_ESCAPE_EXPORT_DIR=/path/to/wiki pnpm start --root <id>

# 路徑裡的 ~ 會被自動展開到 $HOME
pnpm start --root <id> --export-dir '~/Documents/wiki'
```

解析優先順序：`--export-dir` flag → `MOON_ESCAPE_EXPORT_DIR` 環境變數 → `~/iNon/Wiki/` 預設值。

> 移動後重跑 `pnpm start` 會按 `notion_id` 自動複用，不會重寫檔案。

### 4. 在瀏覽器裡編輯

```bash
pnpm web
# 打開 http://localhost:3000/
```

選 `~/iNon/Wiki/` 目錄 → 授權讀寫 → 左側檔案樹 → 中間 Tiptap 富文本 → 右側 PageProperties（11 欄位卡）→ `Cmd/Ctrl+S` 立即儲存 / 5s 後自動儲存 / `Cmd/Ctrl+K` 全域搜尋。

需要 Chromium 核心瀏覽器（File System Access API）；其他瀏覽器會在載入時報 `unsupported` 狀態。

***

## 深入閱讀

### 設計與規範

- **OKF 規範** —— [`okf/docs/OKF_CN.md`](../okf/docs/OKF_CN.md)（中文翻譯，源自 Google Cloud 部落格 2026-06）
- **Notion 欄位對應** —— [`bye-bye-notion/docs/`](../bye-bye-notion/docs/)（PAGE / DATABASE / PAGE\_PROPERTIES / NOTION\_PAT）

### 參考資源

- OKF (Open Knowledge Format, Google Cloud, 2026-06)：<https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing>
- OKF 範例 bundle：<https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf>
- Notion PAT：<https://developers.notion.com/guides/get-started/personal-access-tokens>
- File System Access API：<https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API>

***

## 程式碼檢查與測試

```bash
# 根目錄 TypeScript（覆蓋 src + bye-bye-notion/src + bye-bye-notion/scripts）
pnpm typecheck

# Web 編輯器單元測試（vitest + happy-dom + fake-indexeddb）
pnpm --filter web test

# 一次性診斷（Notion 端，tsx 已在 devDeps 中）
pnpm exec tsx bye-bye-notion/scripts/validate.ts          # 比對 4 個 root 子樹 vs 本地 .md
pnpm exec tsx bye-bye-notion/scripts/verify-ids.ts        # 逐 .md 校驗 notion_id
pnpm exec tsx bye-bye-notion/scripts/verify-ancestor-index.mts  # 驗證 inline page 歸位
```

***

## 套件管理（pnpm workspaces）

專案使用 **pnpm workspaces** 管理 monorepo：

- 根 `pnpm-workspace.yaml` 聲明 `packages: ['.', 'web']`
- 共享根 `pnpm-lock.yaml`，依賴去重、install 更快
- 子包指令統一用 `pnpm --filter <pkg> <cmd>` 或在子包目錄直接跑
- `.pnpm-store/`（如果用全域 store）已被 `.gitignore` 排除

***

<br />

*We chose to go to the Moon.*\
*Now we choose to leave.*\
*Not with fanfare. Just quietly,*\
*with our notes tucked under one arm,*\
*walking back down.*
