# okf-anything

> **okf-anything** — ローカルファースト、エージェント互換の Notion / Lark
> エスケープハッチ。Google の [OKF（Open Knowledge Format）](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing)
> 仕様に準拠。
>
> CLI は `okfa` 一つ。NPM パッケージ名：`@inon-ai/okf-anything`。

## 概要

okf-anything は Notion（および将来的に Lark）のコンテンツを**インクリ
メンタル同期**し、ローカル OKF Markdown ワークスペースへ取り込みます。
ワークスペースはあなたが所有し、バージョン管理し、AI エージェントに精
密に検索させることができます。

```
            ┌────────────────────┐
            │   Notion / Lark    │
            └─────────┬──────────┘
                      │  okfa sync
                      ▼
   ┌───────────────────────────────────┐
   │  ~/iNon  (あなたのワークスペース) │
   │  ├── .okfa/config.yaml            │
   │  ├── notion/   ← 同期 Notion     │
   │  ├── lark/     ← 同期 Lark       │
   │  └── projects/<あなたのコード>   │
   └───────────────────────────────────┘
                      ▲
                      │  okfa shot
                      │  (find · search · replace · ls)
                      │
            ┌────────────────────┐
            │  Claude Code など  │
            └────────────────────┘
```

## インストール

```bash
npm install -g @inon-ai/okf-anything
# または
pnpm add -g @inon-ai/okf-anything
```

インストール後、`okfa --help` が使えます。同梱の Claude Code Skills は
`skills/okfa-*/SKILL.md` にあります。`skills/` ディレクトリを
`~/.claude/skills/` にコピーすれば読み込まれます。

## クイックスタート

```bash
okfa init                          # ~/iNon/.okfa/config.yaml を生成
okfa config edit                  # token と default_root_id を設定
okfa sync notion --root <uuid>    # 初回フルプル
okfa shot ls                       # ローカルに落としたファイルを確認
okfa shot find type --eq "Notion Page"
```

以降、`okfa sync notion` を何度実行しても 2 回目以降はほぼ一瞬で終わ
ります。`last_edited_time` が変わった分だけ取得します。

## なぜ okf-anything か

- **データの所有権はあなた** — メモも、機械も、git も、ルールも。
- **エージェント互換** — すべてのドキュメントに OKF YAML frontmatter
  が付き、フィールドがアドレス可能。
  `okfa shot find --field status --eq active` で「進行中は？」を一行で
  尋ねられます。
- **冪等な同期** — `notion_id` が durable key。ローカルファイルを自由
  に移動しても、次の同期は正しい場所にヒットし、再取得しません。
- **同一ワークスペース** — コード、PDF、Notion ドキュメント、ドキュメント
  のドキュメント、すべてを同じディレクトリツリーで、プロジェクトごとに
  整理できます。
- **RAG 不要** — shot の `shot` は grep + YAML フィールド。予測可
  能で、デバッグしやすく、embedding の世話は不要です。

## コマンド一覧

| コマンド                  | 役割                                          |
|---------------------------|-----------------------------------------------|
| `okfa init [<dir>]`      | ワークスペースを初期化。                       |
| `okfa config <sub>`      | `show` / `path` / `root` / `edit`。           |
| `okfa sync notion`       | Notion からのインクリメンタル同期              |
|                         | （UUID + `last_edited_time`）。                |
| `okfa sync lark`         | Wiki、Drive、Minutes、添付スナップショットを同期。 |
| `okfa shot ls`           | ワークスペースの全 `.md` を列挙。              |
| `okfa shot find`         | frontmatter フィールド検索。                  |
| `okfa shot search`       | 本文フルテキスト grep（`rg` が利用可能なら使用）。 |
| `okfa shot replace`      | frontmatter / 本文の一括編集。既定 dry-run。  |

各コマンドに `--help` で詳細を表示。

## 同期の仕組み

取得した各 Notion ページは、以下の OKF YAML frontmatter を持ちます。

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

`sync` はプラットフォームごとに `last_sync_time` を保持し、各実行で：

1. 設定されたルートから到達可能なページを列挙。
2. frontmatter をスキャンしてローカル UUID レジストリを構築。
3. クラウドの `last_edited_time` がローカルより新しい（またはローカル
   に存在しない）項目についてのみ、ブロックを取得して書き込み。
4. クラウド側で削除されても、ローカルファイルは削除しません。

## ステータス

| 機能         | ステータス       |
|--------------|------------------|
| Notion 取得   | ✅ 動作中。      |
| Notion 同期   | ✅ 動作中。      |
| Lark 取得    | ✅ Wiki、Drive、Minutes、主要形式に対応。 |
| Lark 同期    | ✅ 基底 token で重複排除し全件更新。 |
| shot        | ✅ 動作中。      |

Lark の wiki walker は意図的に後続作業として残し、まず CLI / Skill 層
をリリースします。ローカルの `lark/` ディレクトリは `okfa shot *` で完
全に読み取れ、`okfa sync lark` も `--dry-run` をサポートします。

## ライセンス

MIT。
