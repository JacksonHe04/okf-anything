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
  <a href="../README.md">简体中文</a> | <a href="README_EN.md">English</a> | 日本語 | <a href="README_ZH_TW.md">繁體中文</a>
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

かつて、**Moonshot**（ムーンショット）は人を熱くさせる言葉でした。

ケネディは1962年に、「我々が月に登ることを選択するのは、それが容易だからではなく、困難だからである」と言いました。\
後に、この言葉はインターネット企業に借用されました。\
すべてのSaaS製品の発表会は、一種のムーンショットでした。\
すべてのクラウドノートツールが、あなたの「未来への第一歩」でした。

そして、私たちはノートをアップロードしました。ドキュメントをアップロードしました。知識をアップロードしました。\
Notion、Lark（飛書）、Yuque（語雀）——これらは私たちを受け入れ、美しいインターフェース、スムーズな体験、そして月額料金のシートを提供してくれました。

しかしある日、あなたは自分のデータを取り戻したいと考えます。

そこで気づくのです：**登るのは簡単だが、降りるのは難しい。**

***

**MOON ESCAPE** は、月面から開かれた一つの扉です。

Notion / Lark / Yuque内にあるワークスペース全体をローカルにストリーミングで取得し、\
**Google OKF（Open Knowledge Format）** に準拠したMarkdownファイルとして保存します。\
親子関係、データベースの行、カスタムプロパティを余すことなく維持します。\
これにより、ブラウザから直接開いて編集・検索ができるようになり、アカウントも専用クライアントも不要になります。

あなたの知識に、もう「月額利用料（monthly seat fee）」は必要ありません。

<br />

***

## プラットフォーム連携

| プラットフォーム | ディレクトリ | ステータス | 備考 |
| --- | --- | --- | --- |
| **Notion** | [`bye-bye-notion/`](../bye-bye-notion/) | ✅ 利用可能 | 唯一、完全に実装されたプラットフォーム。2025年版マルチデータソース、block_idインラインページ、p-queueによる流量制限、予算パス割り当てがすべて完了 |
| Lark (飛書) | [`bye-bye-lark/`](../bye-bye-lark/) | 🚧 初期化のみ | ディレクトリ作成済み、コード実装待ち |
| Yuque (語雀) | [`bye-bye-yuque/`](../bye-bye-yuque/) | 🚧 初期化のみ | ディレクトリ作成済み、コード実装待ち |

3つのプラットフォームはルートディレクトリの [`moon-escape/common/`](../moon-escape/common/) を共有しています —— パス解決、ファイル名クレンジング、競合割り当て、frontmatterの読み書きはすべてプラットフォームに依存しないため、LarkやYuqueでの再利用スペースが確保されています。

***

## プロジェクト構造

```
moon-escape/
├── pnpm-workspace.yaml        # pnpm workspaces 設定（packages: ['.', 'web']）
├── moon-escape/common/                # プラットフォーム共通ツール（プラットフォーム非依存）
│   ├── paths.ts               # --export-dir / MOON_ESCAPE_EXPORT_DIR / ~/iNon/Wiki/ の解析
│   ├── sanitize.ts            # ファイル名クレンジング（無効な文字の置換）
│   ├── path-allocator.ts      # 競合サフィックス割り当て（X.md → X-1.md → X-2.md）
│   ├── frontmatter.ts         # YAML frontmatter の読み書き
│   ├── safe-call.ts           # try/catch エラー許容ラッパー
│   └── count-md.ts            # .md ファイル数の再帰的カウント
│
├── bye-bye-notion/            # Notion 取得実装（コア）
│   ├── src/
│   │   ├── main.ts            # メインフロー：CLI → searchAll → 予算パス割り当て表 → ストリーム再帰
│   │   ├── limiter.ts         # p-queue 3 req/s + 429/5xx バックオフ再試行
│   │   └── notion/            # Notion SDK ラッパー
│   │       ├── client.ts      # dotenv + @notionhq/client (v2026-03-11)
│   │       ├── search.ts      # 全量 searchAll（page + data_source）
│   │       ├── page.ts        # retrievePage メタデータ
│   │       ├── database.ts    # 2025モデル：data_source.retrieve + クエリ
│   │       ├── blocks.ts      # BFS によるブロックツリー取得（maxDepth=20）
│   │       ├── ancestor.ts    # block_id → page_id の祖先インデックス（インラインページの配置）
│   │       ├── budget.ts      # 予算パス割り当て表（トップダウン BFS による最終 localPath の解決）
│   │       └── markdown.ts    # ブロックツリー → markdown（メンションの書き換え含む）
│   ├── scripts/               # 単発の診断・検証スクリプト（dry-run, validate, verify-*）
│   └── docs/                  # 移行設計 + Notion API フィールドドキュメント
│
├── bye-bye-lark/              # Lark 取得（未実装）
├── bye-bye-yuque/             # Yuque 取得（未実装）
│
├── web/                       # ローカル OKF Web エディタ
│   ├── src/
│   │   ├── app/page.tsx       # 3ペイン構成（ファイルツリー / エディタ / PageProperties）
│   │   ├── components/        # editor（Tiptap）/ file-tree / page-properties / search
│   │   ├── hooks/             # useDirectory / useFileTree / useAutoSave / useSearchIndex
│   │   └── lib/               # fs-access / frontmatter / markdown-serde / double-link / search-index / db
│   └── docs/                  # 設計ドキュメント + TODO
│
├── okf/docs/                  # Google OKF 仕様書（OKF.md 原文 + OKF_CN.md 中国語訳）
├── docs/                      # プロジェクトドキュメント
│   ├── README_EN.md           # 英語版 README（より詳細なユーザー向け視点）
│   └── superpowers/
│       ├── specs/             # Web エディタ v1/v2/v3設計仕様
│       └── plans/             # 対応する実施計画
│
├── AGENTS.md                  # → CLAUDE.md
└── CLAUDE.md                  # プロジェクトガイドライン：Notion フィールドマッピング + 取得戦略 + 3つの黄金律
```

***

## 機能一覧

### 取得側（bye-bye-notion）

- **ID冪等性を備えたストリーミング取得** —— スキャンしながら即時書き込み。ネットワーク切断やクラッシュ時もデータを失わず、再実行時は `notion_id` に基づいて出力済みのサブツリーをスキップします。
- **Notion 2025 モデルの完全サポート** —— Database コンテナ + 複数の Data Source、`block_id` 親ページ、フラット化されたカスタムプロパティをすべて OKF YAML にマッピング。
- **予算パス割り当て（Budgeted Path Map）** —— 子ページがまだ取得されていない場合でも、親ページのレンダリング時に正しい相対パスで `## Children` リストを書き出せます。
- **流量制御 + バックオフ** —— p-queue 3 req/s + `Retry-After` ヘッダー解析 + 5xx系エラー時の指数バックoff + ジッター。
- **OKF v0.1 準拠の出力** —— YAML frontmatter + 親子ディレクトリ構造。GitHub での直接プレビューや、任意の LLM Agent による読み取りが可能です。

### Web エディタ側（web/）

- **File System Access API によるディレクトリ選択 + IndexedDB によるハンドル永続化** —— 初回選択のみで次回以降自動復旧。権限失効時は再認証ボタンを提供。
- **3ペインレイアウト** —— 左側：ファイルツリー / 中央：Tiptap富テキスト / 右側：PageProperties。
- **PageProperties パネル** —— `js-yaml` により 11 個の OKF フィールド（OKF 6個 + Notion 5個）を解析。未知のフィールドも消失せず透過的に引き継ぎます。
- **Markdown 相対パスによる双方向リンク遷移** —— Cmd/Ctrl + クリック。エディタ外では `getFileHandleByPath` を用いて階層をまたぐパスを解決します。
- **グローバル検索（MiniSearch + Cmd/Ctrl+K）** —— 日本語は2-gram、英語はスペース区切りでトークン化。サブディレクトリを再帰的にスキャン。
- **5秒デバウンス自動保存 + ステータス表示** —— ミューテックスロックで同時書き込みを防止。Cmd/Ctrl+S で即時保存可能。
- **ファイル/フォルダの CRUD** —— 右クリックメニューによる新規作成・名前変更・削除。競合時は `-1` などの連番を自動付与。

***

## クイックスタート

### 0. インストール

```bash
pnpm install
```

`.env.example` をコピーして TOKEN を貼り付けます。

### 1. 取得計画のプレビュー（ドライラン・ディスク書き込みなし）

```bash
pnpm dry-run --root <page-uuid> [--root <page-uuid>...]
```

Notion からの読み込みのみを行い、サブツリーを Markdown のリストとして標準出力に印刷します。ディスクへの書き込みは一切行いません。`<page-uuid>` は 32hex / 8-4-4-4-12 / notion.so URL 形式に対応しています。

### 2. 実際の取得（ストリーミングディスク書き込み）

```bash
pnpm start --root <page-uuid>
```

ページまたはデータベースをスキャンするたびに即座に書き込みます。処理が中断された場合でも、スキャン済みの内容はエクスポートディレクトリに残ります。再実行時は `notion_id` を用いてエクスポート済みのサブツリーをスキップします。特定のサブツリーを強制的に再取得したい場合は、対応する `.md` ファイルまたはディレクトリを削除してください。

利用可能なスクリプト（`pnpm install` 後に動作）：

| コマンド | 用途 |
| --- | --- |
| `pnpm start` | Notion ストリーミング取得の開始 |
| `pnpm dry-run` | プレビュー（読み取りのみ、書き込みなし） |
| `pnpm typecheck` | `tsc --noEmit`（src + bye-bye-notion/src + bye-bye-notion/scripts をカバー） |
| `pnpm build` | TypeScript を `dist/` にコンパイル |
| `pnpm web` | Web エディタの起動（`next dev`） |
| `pnpm web:build` | Web エディタのプロダクションビルド |

サブパッケージのコマンドは、直接 `web/` ディレクトリに移動して `pnpm dev` や `pnpm test` を実行することも可能です。pnpm workspaces が依存関係を自動的に調整します。

### 3. エクスポート先のカスタマイズ

デフォルトでは `~/iNon/Wiki/` に書き出されます（初回起動時に自動作成）。パスを変更する場合：

```bash
# コマンドライン引数
pnpm start --root <id> --export-dir /path/to/wiki

# または環境変数（シェルエイリアスや CI に適しています）
MOON_ESCAPE_EXPORT_DIR=/path/to/wiki pnpm start --root <id>

# パス内の ~ は自動的に $HOME に展開されます
pnpm start --root <id> --export-dir '~/Documents/wiki'
```

優先順位：`--export-dir` 引数 → `MOON_ESCAPE_EXPORT_DIR` 環境変数 → `~/iNon/Wiki/` デフォルト値。

> エクスポートディレクトリを移動した後に `pnpm start` を再実行した場合も、`notion_id` により既存ファイルは自動で再利用され、無駄な再書き込みは発生しません。

### 4. ブラウザでの編集

```bash
pnpm web
# http://localhost:3000/ を開く
```

`~/iNon/Wiki/` ディレクトリを選択 → 読み書き権限を許可 → 左ペイン of ファイルツリー → 中央ペイン of Tiptap エディタ → 右ペイン of PageProperties（11フィールドカード）。`Cmd/Ctrl+S` で即時保存、または5秒後に自動保存されます。`Cmd/Ctrl+K` でグローバル検索が可能です。

Chromium 系のブラウザが必要です（File System Access API を使用するため）。その他のブラウザでは、読み込み時に `unsupported` ステータスが表示されます。

***

## 関連ドキュメント

### 設計と仕様

- **OKF 仕様** —— [`okf/docs/OKF_CN.md`](../okf/docs/OKF_CN.md)（中国語訳、Google Cloud Blog 2026-06より）
- **Notion フィールドマッピング** —— [`bye-bye-notion/docs/`](../bye-bye-notion/docs/)（PAGE / DATABASE / PAGE_PROPERTIES / NOTION_PAT)

### 参考資料

- OKF (Open Knowledge Format, Google Cloud, 2026-06)：<https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing>
- OKF サンプルバンドル：<https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf>
- Notion PAT：<https://developers.notion.com/guides/get-started/personal-access-tokens>
- File System Access API：<https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API>

***

## コードチェック & テスト

```bash
# ルートディレクトリの TypeScript チェック（src + bye-bye-notion/src + bye-bye-notion/scripts を網羅）
pnpm typecheck

# Web エディタのユニットテスト（vitest + happy-dom + fake-indexeddb）
pnpm --filter web test

# 単発の診断スクリプト（Notion側、tsx は devDeps に導入済み）
pnpm exec tsx bye-bye-notion/scripts/validate.ts          # 4つのルートサブツリーとローカルの .md を照合
pnpm exec tsx bye-bye-notion/scripts/verify-ids.ts        # 各 .md の notion_id を検証
pnpm exec tsx bye-bye-notion/scripts/verify-ancestor-index.mts  # インラインページの配置検証
```

***

## パッケージ管理（pnpm workspaces）

プロジェクトはモノレポ管理に **pnpm workspaces** を採用しています：

- ルートの `pnpm-workspace.yaml` で `packages: ['.', 'web']` を宣言
- ルートの `pnpm-lock.yaml` を共有し、依存関係の重複排除と高速なインストールを実現
- サブパッケージのコマンドは `pnpm --filter <pkg> <cmd>` を使うか、各サブパッケージのディレクトリで直接実行
- `.pnpm-store/` （グローバルストアを使用する場合）は `.gitignore` ですでに除外されています

***

<br />

*We chose to go to the Moon.*\
*Now we choose to leave.*\
*Not with fanfare. Just quietly,*\
*with our notes tucked under one arm,*\
*walking back down.*
