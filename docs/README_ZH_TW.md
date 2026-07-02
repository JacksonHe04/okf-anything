<h1 align="center">iMon</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Google-OKF_v0.1-4285F4?logo=google&logoColor=white" alt="Google OKF" />
  <img src="https://img.shields.io/badge/Notion-Integration-000000?logo=notion&logoColor=white" alt="Notion Integration" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white" alt="Next.js" />
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

**iMon** 是從月球上開的那扇門——但回家不是一個步驟就能走完的。

它由 **三個核心模組** 串成一條回家的路：

| 模組       | 職責                          | 在哪                              |
| -------- | --------------------------- | ------------------------------- |
| **ESCAPE** | 把困在雲端的內容拉回本地，寫成 OKF Markdown | `moon-escape/`（`bye-bye-notion` 等） |
| **MOON**   | 拉回來的內容，需要一個本地「月球」來住和編輯      | `moon-app/`                     |
| **SHOT**   | 本地知識要有用，需要檢索 / RAG / Agent API | `moon-shot/`                    |

**ESCAPE** 是逃離——從 Notion / 飛書 / 語雀 的軌道上掙脫；\
**MOON** 是落腳——把知識安放在你自己的硬碟上，用瀏覽器編輯；\
**SHOT** 是發射——讓本地知識被 Agent 真正用起來，不再是沉睡的 .md。

三個模組都遵循同一份契約：**Google OKF（Open Knowledge Format）**。\
ESCAPE 寫出 OKF，MOON 編輯 OKF，SHOT 消費 OKF。

你的知識，再也沒有 monthly seat fee。

<br />

***

## 三個模組

### 🚀 ESCAPE —— 離開雲端

`moon-escape/` 把你在雲端的工作空間串流拉到本地，落成符合 OKF 的 Markdown。它本身又由兩部分組成：

- **`moon-escape/common/`** —— 跨平台共用工具（路徑解析、檔案名清洗、衝突分配、frontmatter 讀寫、容錯、統計），平台無關。
- **`bye-bye-<platform>/`** —— 每個雲端平台一份獨立實作：

| 平台 | 目錄 | 狀態 |
| --- | --- | --- |
| **Notion** | [`bye-bye-notion/`](../bye-bye-notion/) | ✅ 可用 |
| Lark (飛書) | [`bye-bye-lark/`](../bye-bye-lark/) | 🚧 僅初始化 |
| 語雀 (Yuque) | [`bye-bye-yuque/`](../bye-bye-yuque/) | 🚧 僅初始化 |

Notion 是目前唯一完整實作的平台——2025 多 Data Source、`block_id` inline page、p-queue 限流、預算路徑表全部到位。Lark 與語雀會共用 `common/`，等接入實作。

> **目前倉庫的 `moon-escape/`** 裝的是 `bye-bye` 這個根包，`start` / `dry-run` 實際執行的是 `bye-bye-notion`。

### 🌕 MOON —— 本地編輯器

[`moon-app/`](../moon-app/) 是跑在你瀏覽器裡的本地 OKF Web 編輯器。

- File System Access API 選目錄 + IndexedDB 句柄持久化 —— 選一次後續自動恢復
- 三欄佈局：左檔案樹 / 中 Tiptap 富文字 / 右 PageProperties
- 11 欄位 OKF 面板（OKF 6 + Notion 5），未知欄位透傳不丟
- 相對路徑雙鏈跳轉（`Cmd/Ctrl + 點擊`）+ 全域搜尋（`Cmd/Ctrl + K`，MiniSearch，中文 2-gram + 英文空格分詞）
- 5s debounce 自動儲存 + `Cmd/Ctrl+S` 立即儲存
- 檔案/資料夾 CRUD，`-1` 自動防衝突

需要 Chromium 核心瀏覽器；其他瀏覽器載入時會顯示 `unsupported` 狀態。

### 🎯 SHOT —— 知識引擎 / Agent API

[`moon-shot/`](../moon-shot/) 是把本地 OKF 知識重新發射出去的引擎，讓 Agent / RAG / 檢索真正用得上。

Roadmap 上的能力：

- **Dense Vector Search (RAG)** —— 對本地 Markdown 分塊、做語意 embedding 檢索
- **Sparse Full-Text Search** —— MiniSearch 關鍵詞召回
- **Spaces Map & Dependency Graph** —— 用 Markdown 相對路徑雙鏈當圖邊，畫出頁面間的依賴關係
- **Agent API Services** —— 對外暴露 JSON 端點：關鍵詞/語意查詢、上下文環檢索、統計、星球圖佈局、摘要

`moon-shot/okf/docs/` 裡同時放著 **Google OKF 規範**（`OKF.md` 原文 + `OKF_CN.md` 中文翻譯）—— OKF 是貫穿三個模組的統一契約，ESCAPE 寫它、MOON 編輯它、SHOT 消費它。

***

## 專案結構

```
moon-escape/                            # 根（pnpm workspace）
├── pnpm-workspace.yaml                 # packages: ['.', 'moon-app', 'moon-shot']
├── package.json                        # bye-bye 根包：start / dry-run / typecheck / web
│
├── moon-escape/                        # ━━━ ESCAPE 模組 ━━━
│   ├── common/                         #   跨平台共用工具（平台無關）
│   │   ├── paths.ts                    #     --export-dir / MOON_ESCAPE_EXPORT_DIR / ~/iNon/Wiki/
│   │   ├── sanitize.ts                 #     檔案名清洗
│   │   ├── path-allocator.ts           #     衝突字尾分配（X.md → X-1.md）
│   │   ├── frontmatter.ts              #     YAML frontmatter 讀寫
│   │   ├── safe-call.ts                #     try/catch 容錯包裝
│   │   └── count-md.ts                 #     遞迴統計 .md 數量
│   ├── bye-bye-notion/                 #   ✅ Notion 拉取實作（核心）
│   │   ├── src/
│   │   │   ├── main.ts                 #     CLI → searchAll → 預算路徑表 → 串流遞迴
│   │   │   ├── limiter.ts              #     p-queue 3 req/s + 429/5xx 退避重試
│   │   │   └── notion/                 #     Notion SDK 封裝
│   │   │       ├── client.ts           #       dotenv + @notionhq/client
│   │   │       ├── search.ts           #       全量 searchAll（page + data_source）
│   │   │       ├── page.ts             #       retrievePage 中介資料
│   │   │       ├── database.ts         #       2025 Model: data_source.retrieve + query
│   │   │       ├── blocks.ts           #       BFS 拉 blocks 樹（maxDepth=20）
│   │   │       ├── ancestor.ts         #       block_id → page_id 祖先索引
│   │   │       ├── budget.ts           #       預算路徑表（自上而下 BFS 解算最終 localPath）
│   │   │       └── markdown.ts         #       block tree → markdown（含 mention 重寫）
│   │   ├── scripts/                    #     一次性診斷/校驗指令碼
│   │   └── docs/                       #     遷移設計 + Notion API 欄位文件
│   ├── bye-bye-lark/                   #   🚧 飛書拉取（待實作）
│   └── bye-bye-yuque/                  #   🚧 語雀拉取（待實作）
│
├── moon-app/                           # ━━━ MOON 模組 ━━━
│   ├── src/
│   │   ├── app/page.tsx                #   三欄編排（檔案樹 / 編輯器 / PageProperties）
│   │   ├── components/                 #   editor（Tiptap）/ file-tree / page-properties / search
│   │   ├── hooks/                      #   useDirectory / useFileTree / useAutoSave / useSearchIndex
│   │   └── lib/                        #   fs-access / frontmatter / markdown-serde / double-link / search-index / db
│   └── docs/                           #   設計文件 + TODOs
│
├── moon-shot/                          # ━━━ SHOT 模組 ━━━
│   ├── src/                            #   知識引擎與 Agent API 實作
│   ├── okf/                            #   Google OKF 規範 & 工具
│   │   ├── docs/                       #     OKF.md 原文 + OKF_CN.md 中文翻譯
│   │   ├── scripts/                    #     OKF 校驗/轉換指令碼
│   │   └── CLAUDE.md                   #     SHOT 自身的指引
│   └── README.md                       #   模組使用說明（Roadmap + Features）
│
├── docs/                               # 專案級文件
│   ├── README_EN.md                    #   英文 README
│   ├── README_JA.md                    #   日文 README
│   ├── README_ZH_TW.md                 #   繁體中文 README
│   └── superpowers/
│       ├── specs/                      #   Web 編輯器 v1/v2/v3 設計規格
│       └── plans/                      #   對應實施計劃
│
├── AGENTS.md                           # → CLAUDE.md
└── CLAUDE.md                           # 專案指引：Notion 欄位對應 + 拉取策略 + 三條鐵律
```

***

## 資料流

```
                ┌────────────────────────────────────┐
                │  Notion · Lark · Yuque（雲端）         │
                └──────────────┬─────────────────────┘
                               │
                ┌──────────────▼─────────────────────┐
   🚀 ESCAPE   │  bye-bye-notion / bye-bye-lark / … │
   moon-escape │  searchAll → blocks → OKF markdown  │
                └──────────────┬─────────────────────┘
                               │  ~/iNon/Wiki/*.md  (YAML frontmatter + 父子目錄)
                               │
                ┌──────────────▼─────────────────────┐
   🌕 MOON     │  moon-app (Tiptap + FS Access API) │
   moon-app    │  三欄佈局 / 11 欄位屬性 / 全文搜尋    │
                └──────────────┬─────────────────────┘
                               │  同一份本地 .md
                               │
                ┌──────────────▼─────────────────────┐
   🎯 SHOT     │  moon-shot (RAG + MiniSearch + …) │
   moon-shot   │  向量檢索 / 關鍵詞召回 / Agent API  │
                └────────────────────────────────────┘
```

三個模組共享同一份 OKF 契約：ESCAPE 寫、MOON 編輯、SHOT 讀。改一處，全域生效。

***

## 功能特性

### 🚀 ESCAPE（`moon-escape/`，目前以 Notion 為準）

- **串流拉取，帶 ID 冪等** —— 掃一個寫一個，防斷網/當機不丟失，重跑按 `notion_id` 跳過已導出子樹
- **Notion 2025 model 完整支援** —— Database 容器 + 多 Data Source、`block_id` 父頁面、扁平化自訂屬性全部對應進 OKF YAML
- **預算路徑表（Budgeted Path Map）** —— 子 page 未拉取時，父 page 渲染時仍能用正確相對路徑寫出 `## Children` 列表
- **限流 + 退避** —— p-queue 3 req/s + `Retry-After` 解析 + 5xx 指數退避 + jitter
- **跨平台複用層** —— `moon-escape/common/` 把路徑解析、檔案名清洗、frontmatter 抽到平台無關，給 Lark / Yuque 留好複用空間

### 🌕 MOON（`moon-app/`）

- **File System Access API 選目錄 + IndexedDB 句柄持久化** —— 選一次後續自動恢復，權限失效有 reauth 按鈕
- **三欄佈局** —— 左側檔案樹 / 中間 Tiptap 富文字 / 右側 PageProperties
- **PageProperties 面板** —— js-yaml 解析 OKF 11 欄位（OKF 6 + Notion 5），未知欄位透傳不丟失
- **Markdown 相對路徑雙鏈跳轉** —— Cmd/Ctrl + 點擊，編輯器外用 `getFileHandleByPath` 解析跨層路徑
- **全域搜尋（MiniSearch + Cmd/Ctrl+K）** —— 中文 2-gram + 英文空格分詞，遞迴掃子目錄
- **5s debounce 自動儲存 + 狀態指示器** —— 互斥鎖避免並發寫入、Cmd/Ctrl+S 立即儲存
- **檔案/資料夾 CRUD** —— 右鍵選單新建/重新命名/刪除，檔案名稱 `-1` 自動防衝突

### 🎯 SHOT（`moon-shot/`，Roadmap）

- **Dense Vector Search (RAG)** —— 對本地 Markdown 分塊、做語意 embedding 檢索
- **Sparse Full-Text Search** —— MiniSearch 關鍵詞召回
- **Spaces Map & Dependency Graph** —— 用 Markdown 相對路徑雙鏈當圖邊，構建頁面間依賴圖
- **Agent API Services** —— 對外暴露 JSON 端點：關鍵詞/語意查詢、上下文環檢索、統計、星球圖佈局、摘要

***

## 快速上手

### 0. 安裝

```bash
pnpm install
```

複製 `.env.example` 並貼上 TOKEN。

### 1. 先預覽拉取計劃（不寫入磁碟）—— ESCAPE

```bash
pnpm dry-run --root <page-uuid> [--root <page-uuid>...]
```

唯讀 Notion，把子樹以 markdown 樹狀清單列印到 stdout，不寫入任何檔案。`<page-uuid>` 接受 32hex / 8-4-4-4-12 / notion.so URL 三種形式。

### 2. 真正拉取（串流寫入磁碟）—— ESCAPE

```bash
pnpm start --root <page-uuid>
```

每掃到一個 page/database 就立刻寫入磁碟，掛掉時已掃描的內容都在導出目錄裡。重跑時按 `notion_id` 跳過已導出的整棵子樹——要強制重導某個子樹，刪掉對應的 `.md` 或目錄即可。

可用指令（一次 `pnpm install` 裝好後）：

| 指令 | 作用 |
| --- | --- |
| `pnpm start` | 啟動 Notion 串流拉取（ESCAPE） |
| `pnpm dry-run` | 唯讀預覽，不寫入磁碟 |
| `pnpm typecheck` | `tsc --noEmit`（覆蓋 src + bye-bye-notion/src + scripts） |
| `pnpm build` | TypeScript 編譯到 `dist/` |
| `pnpm web` | 啟 Web 編輯器（`moon-app` 的 `next dev`，即 MOON） |
| `pnpm web:build` | 建構 Web 編輯器生產包 |

子包指令也可直接進 `moon-app/` 跑 `pnpm dev` / `pnpm test`，進 `moon-shot/` 跑它自己的命令，pnpm workspaces 自動提升依賴。

### 3. 自訂導出目錄（ESCAPE）

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

### 4. 在瀏覽器裡編輯 —— MOON

```bash
pnpm web
# 打開 http://localhost:3000/
```

選 `~/iNon/Wiki/` 目錄 → 授權讀寫 → 左側檔案樹 → 中間 Tiptap 富文字 → 右側 PageProperties（11 欄位卡）→ `Cmd/Ctrl+S` 立即儲存 / 5s 後自動儲存 / `Cmd/Ctrl+K` 全域搜尋。

需要 Chromium 核心瀏覽器（File System Access API）；其他瀏覽器會在載入時報 `unsupported` 狀態。

### 5. 把本地知識接給 Agent —— SHOT

SHOT 目前處於 Roadmap 階段，等 `moon-shot/src/` 落地後即可：

```bash
pnpm --filter moon-shot dev   # 啟動知識引擎 / Agent API
```

***

## 深入閱讀

### 設計與規範

- **OKF 規範** —— [`moon-shot/okf/docs/OKF_CN.md`](../moon-shot/okf/docs/OKF_CN.md)（中文翻譯，源自 Google Cloud 部落格 2026-06）。ESCAPE / MOON / SHOT 三個模組都遵循這份契約。
- **Notion 欄位對應** —— [`bye-bye-notion/docs/`](../bye-bye-notion/docs/)（PAGE / DATABASE / PAGE_PROPERTIES / NOTION_PAT）
- **SHOT 模組說明** —— [`moon-shot/README.md`](../moon-shot/README.md)

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

# MOON 編輯器單元測試（vitest + happy-dom + fake-indexeddb）
pnpm --filter moon-app test

# SHOT 模組的指令（roadmap 落地後陸續補齊）
pnpm --filter moon-shot test

# 一次性診斷（ESCAPE / Notion 端，tsx 已在 devDeps 中）
pnpm exec tsx bye-bye-notion/scripts/validate.ts             # 比對 4 個 root 子樹 vs 本地 .md
pnpm exec tsx bye-bye-notion/scripts/verify-ids.ts           # 逐 .md 校驗 notion_id
pnpm exec tsx bye-bye-notion/scripts/verify-ancestor-index.mts  # 驗證 inline page 歸位
```

***

## 套件管理（pnpm workspaces）

專案使用 **pnpm workspaces** 管理 monorepo：

- 根 `pnpm-workspace.yaml` 宣告 `packages: ['.', 'moon-app', 'moon-shot']`
- 三個模組各自是獨立包：ESCAPE 在根包、MOON 在 `moon-app/`、SHOT 在 `moon-shot/`
- 共用根 `pnpm-lock.yaml`，依賴去重、install 更快
- 子包指令統一用 `pnpm --filter <pkg> <cmd>` 或在子包目錄直接跑
- `.pnpm-store/`（如果用全域 store）已被 `.gitignore` 排除

***

<br />

*We chose to go to the Moon.*
*Now we choose to leave.*
*Not with fanfare. Just quietly,*
*with our notes tucked under one arm,*
*walking back down.*