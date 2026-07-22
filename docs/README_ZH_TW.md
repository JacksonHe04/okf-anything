# okf-anything

> **okf-anything** — 本機優先、Agent 友善的 Notion / Lark 逃生艙。
> 基於 Google [OKF（Open Knowledge Format）](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) 規範。
>
> 一個 CLI：`okfa`。NPM 套件名稱：`@inon-ai/okf-anything`。

## 它是什麼

okf-anything 把 Notion（以及後續 Lark）的內容**增量同步**到本機
OKF Markdown 工作區，讓你可以託管、版本化、並被 AI Agent 精確檢索。

```
            ┌────────────────────┐
            │   Notion / Lark    │
            └─────────┬──────────┘
                      │  okfa sync
                      ▼
   ┌───────────────────────────────────┐
   │  ~/iNon  (你的工作區)              │
   │  ├── .okfa/config.yaml            │
   │  ├── notion/   ← 同步的 Notion    │
   │  ├── lark/     ← 同步的 Lark      │
   │  └── projects/<你的程式碼>        │
   └───────────────────────────────────┘
                      ▲
                      │  okfa shot
                      │  (find · search · replace · ls)
                      │
            ┌────────────────────┐
            │  Claude Code 等    │
            └────────────────────┘
```

## 安裝

```bash
npm install -g @inon-ai/okf-anything
# 或
pnpm add -g @inon-ai/okf-anything
```

安裝後 `okfa --help` 即可用。隨附的 Claude Code Skills 在
`skills/okfa-*/SKILL.md`——把 `skills/` 目錄複製到 `~/.claude/skills/`
即可載入。

## 快速開始

```bash
okfa init                          # 引導 ~/iNon/.okfa/config.yaml
okfa config edit                  # 填入 token、設定 default_root_id
okfa sync notion --root <uuid>    # 首次完整拉取
okfa shot ls                       # 看本地落地了哪些檔案
okfa shot find type --eq "Notion Page"
```

之後任何時候再跑 `okfa sync notion`，第二次幾乎瞬間完成——只拉
`last_edited_time` 變化的文件。

## 為什麼用 okf-anything

- **資料歸你所有**——你的筆記、你的機器、你的 git、你的規則。
- **Agent 友善**——每份文件都有 OKF YAML frontmatter，欄位可定址；
  `okfa shot find --field status --eq active` 一行就能問「哪些進行中」。
- **同步冪等**——`notion_id` 是 durable key。本地檔案隨便搬，
  下次同步照樣命中正確位置，不會重新拉取。
- **同一個工作區**——程式碼、PDF、Notion 文件、文件的文件，全部混在
  同一棵目錄樹，按你的專案組織。
- **不繞 RAG**——shot 的 `shot` 內部就是 grep + YAML 欄位。
  可預測、可除錯，不用伺候 embedding。

## 命令一覽

| 命令                   | 作用                                          |
|------------------------|-----------------------------------------------|
| `okfa init [<dir>]`   | 引導新工作區。                                 |
| `okfa config <sub>`   | `show` / `path` / `root` / `edit`。            |
| `okfa sync notion`    | 從 Notion 增量同步（UUID + `last_edited_time`）。|
| `okfa sync lark`      | 同步可見的 Wiki、雲端硬碟物件、妙記與附件快照。 |
| `okfa shot ls`        | 列出工作區所有 `.md` 檔案。                    |
| `okfa shot find`      | 依 frontmatter 欄位查詢。                       |
| `okfa shot search`    | 正文全文 grep（可用 `rg` 加速）。                |
| `okfa shot replace`   | 批次 frontmatter / 正文編輯。預設 dry-run。      |

任意命令後加 `--help` 看詳細參數。

## 同步運作原理

每次拉取的 Notion 頁面都會寫入 OKF YAML frontmatter，至少包含：

```yaml
---
type: "Notion Page"
title: "..."
resource: https://www.notion.so/...
notion_id: 7c2e...      # durable key
created_time: 2025-...
last_edited_time: 2026-07-05T12:00:00.000Z
notion_parent_type: page_id
notion_parent_id: ...
---
```

`sync` 內部為每個平台維護 `last_sync_time`，每次執行時：

1. 列出從設定的根可達的所有可見頁面。
2. 掃描 frontmatter 載入本地 UUID 註冊表。
3. 對雲端 `last_edited_time` 晚於本地（或本地不存在）的項目，
   拉取 blocks 並寫入。
4. 永不刪除本地檔案，即使雲端刪除了。

## 狀態

| 功能       | 狀態         |
|------------|--------------|
| Notion 拉取 | ✅ 可用。     |
| Notion 同步 | ✅ 可用。     |
| Lark 拉取  | ✅ 支援 Wiki、Drive、妙記與常見文件類型。 |
| Lark 同步  | ✅ 依底層 token 去重並完整刷新。 |
| shot      | ✅ 可用。     |

Lark 同步會合併 Wiki 樹與分頁 Drive Search，並依底層物件 token 去重。
可搜尋內容寫為 Markdown；無法無損表達的格式會保存為相鄰快照。
本地 `lark/` 子目錄仍然能由 `okfa shot *` 完整讀取，`okfa sync lark`
也支援 `--dry-run`。

## 授權

MIT。
