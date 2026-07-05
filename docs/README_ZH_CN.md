# okf-anything

> **okf-anything** — 本地优先、Agent 友好的 Notion / Lark 逃生舱。
> 基于 Google [OKF（Open Knowledge Format）](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) 规范。
>
> 一个 CLI：`okfa`。NPM 包名：`@inon-ai/okf-anything`。

## 它是什么

okf-anything 把 Notion（以及后续 Lark）的内容**增量同步**到你本地的
OKF Markdown 工作区，让你可以托管、版本化、并被 AI Agent 精确检索。

```
            ┌────────────────────┐
            │   Notion / Lark    │
            └─────────┬──────────┘
                      │  okfa sync
                      ▼
   ┌───────────────────────────────────┐
   │  ~/iNon  (你的工作区)              │
   │  ├── .okfa/config.yaml            │
   │  ├── notion/   ← 同步的 Notion    │
   │  ├── lark/     ← 同步的 Lark      │
   │  └── projects/<你的代码>          │
   └───────────────────────────────────┘
                      ▲
                      │  okfa shot
                      │  (find · search · replace · ls)
                      │
            ┌────────────────────┐
            │  Claude Code 等    │
            └────────────────────┘
```

## 安装

```bash
npm install -g @inon-ai/okf-anything
# 或者
pnpm add -g @inon-ai/okf-anything
```

安装后 `okfa --help` 即可用。配套的 Claude Code Skills 在
`skills/okfa-*/SKILL.md` ——把 `skills/` 目录拷到 `~/.claude/skills/`
即可被加载。

## 快速开始

```bash
okfa init                          # 引导 ~/iNon/.okfa/config.yaml
okfa config edit                  # 填入 token、设置 default_root_id
okfa sync notion --root <uuid>    # 首次完整拉取
okfa shot ls                       # 看本地落地了哪些文件
okfa shot find type --eq "Notion Page"
```

之后任何时候再跑 `okfa sync notion`，第二次几乎瞬间完成——只拉
`last_edited_time` 变化的文档。

## 为什么用 okf-anything

- **数据归你所有** —— 你的笔记、你的机器、你的 git、你的规则。
- **Agent 友好** —— 每个文档都有 OKF YAML frontmatter，字段可寻址；
  `okfa shot find --field status --eq active` 一行就能问"哪些进行中"。
- **同步幂等** —— `notion_id` 是 durable key。本地文件随便挪，
  下次同步照样命中正确位置，不会重新拉取。
- **同一个工作区** —— 代码、PDF、Notion 文档、文档的文档，全部混在
  同一个目录树里，按你的项目组织。
- **不绕 RAG** —— shot 的 `shot` 内部就是 grep + YAML 字段。
  可预测、可调试，不用伺候 embedding。

## 命令一览

| 命令                  | 作用                                          |
|-----------------------|-----------------------------------------------|
| `okfa init [<dir>]`   | 引导新工作区。                                 |
| `okfa config <sub>`   | `show` / `path` / `root` / `edit`。            |
| `okfa sync notion`    | 从 Notion 增量同步（UUID + `last_edited_time`）。|
| `okfa sync lark`      | 同上，针对 Lark / 飞书（v1 是 stub）。          |
| `okfa shot ls`        | 列出工作区所有 `.md` 文件。                     |
| `okfa shot find`      | 按 frontmatter 字段查找。                       |
| `okfa shot search`    | 正文全文 grep（可用 `rg` 加速）。                |
| `okfa shot replace`   | 批量 frontmatter / 正文编辑。默认 dry-run。      |

任意命令后加 `--help` 看详细参数。

## 同步工作原理

每次拉取的 Notion 页面都会写入 OKF YAML frontmatter，至少包含：

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

`sync` 内部维护每个平台的 `last_sync_time`，每次运行时：

1. 列出从配置的根可达的所有可见页面。
2. 扫描 frontmatter 加载本地 UUID 注册表。
3. 对云端 `last_edited_time` 晚于本地（或本地不存在）的项，
   拉取 blocks 并写入。
4. 永不删除本地文件，哪怕云端删了。

## 状态

| 功能       | 状态         |
|------------|--------------|
| Notion 拉取 | ✅ 可用。     |
| Notion 同步 | ✅ 可用。     |
| Lark 拉取  | 🚧 v1 stub。 |
| Lark 同步  | 🚧 v1 stub。 |
| shot      | ✅ 可用。     |

Lark 的 wiki walker 暂时 stub，先把 CLI / Skill 这层产品形态立起来。
本地 `lark/` 子目录仍然能被 `okfa shot *` 完整读取，`okfa sync lark`
也支持 `--dry-run`。

## 许可

MIT。