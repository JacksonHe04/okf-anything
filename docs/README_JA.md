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

**iMon** は月面から開かれた一つの扉です——しかし、帰還は一度きりのステップでは終わりません。

**三つのコアモジュール** が、一本の帰路として縫い合わされています：

| モジュール    | 責務                                | 配置先                          |
| -------- | --------------------------------- | ---------------------------- |
| **ESCAPE** | クラウドに閉じ込められた内容をローカルへ引き戻し、OKF Markdown として書き出す | `moon-escape/`（`bye-bye-notion` 等） |
| **MOON**   | 引き戻した内容を「居住・編集」するローカルな「月面」を提供する         | `moon-app/`                  |
| **SHOT**   | ローカル知識を実際に使えるものにする——検索 / RAG / Agent API | `moon-shot/`                 |

**ESCAPE** は離脱——Notion / Lark / Yuque の軌道から逃れること。\
**MOON** は着地——知識を自分のディスクに置き、ブラウザで編集すること。\
**SHOT** は発射——眠っている `.md` を、Agent と RAG が本当に消費できる形に変換すること。

三つのモジュールは共通仕様 **Google OKF（Open Knowledge Format）** に従います。\
ESCAPE が書き、MOON が編集し、SHOT が読みます。

あなたの知識に、もう「月額利用料（monthly seat fee）」は必要ありません。

<br />

***

## 三つのモジュール

### 🚀 ESCAPE —— クラウドからの離脱

`moon-escape/` はクラウドのワークスペースをローカルへストリーミング取得し、OKF 準拠の Markdown として保存します。さらに二層に分かれます：

- **`moon-escape/common/`** —— プラットフォーム共通のユーティリティ（パス解決、ファイル名サニタイズ、競合割り当て、frontmatter 読み書き、許容エラー、件数カウント）。プラットフォーム非依存。
- **`bye-bye-<platform>/`** —— クラウドプラットフォームごとの独立実装：

| プラットフォーム | ディレクトリ                              | ステータス  |
| ------- | ----------------------------------- | ------ |
| **Notion** | [`bye-bye-notion/`](../bye-bye-notion/) | ✅ 利用可能 |
| Lark (飛書) | [`bye-bye-lark/`](../bye-bye-lark/)   | 🚧 初期化のみ |
| Yuque (語雀) | [`bye-bye-yuque/`](../bye-bye-yuque/) | 🚧 初期化のみ |

Notion は現在唯一完全実装されたプラットフォームです——2025 マルチデータソース、`block_id` インラインページ、`p-queue` 流量制限、予算パス表がすべて揃っています。Lark と Yuque は実装時に `common/` を再利用します。

> **現在の `moon-escape/`** はルートに `bye-bye` パッケージを置いており、`start` / `dry-run` は実質 `bye-bye-notion` を実行します。

### 🌕 MOON —— ローカルエディタ

[`moon-app/`](../moon-app/) はブラウザで動作するローカル OKF Web エディタです。

- File System Access API ディレクトリ選択 + IndexedDB ハンドル永続化 —— 一度選べば次回以降自動復元
- 3 ペイン構成：左 ファイルツリー / 中央 Tiptap リッチテキスト / 右 PageProperties
- 11 フィールド OKF パネル（OKF 6 + Notion 5）、未知フィールドは透過的に保持
- 相対パス双方向リンク遷移（`Cmd/Ctrl + クリック`）+ グローバル検索（`Cmd/Ctrl + K`、MiniSearch、中国語 2-gram + 英語スペース区切り）
- 5 秒デバウンス自動保存 + `Cmd/Ctrl+S` 即時保存
- ファイル / フォルダ CRUD、競合時は `-1` などの連番を自動付与

Chromium 系ブラウザが必要です。他のブラウザではロード時に `unsupported` 状態が表示されます。

### 🎯 SHOT —— ナレッジエンジン / Agent API

[`moon-shot/`](../moon-shot/) はローカル OKF 知識を再射出するエンジンであり、Agent・RAG・検索が実際に使えるようにするものです。

Roadmap 上の機能：

- **Dense Vector Search (RAG)** —— ローカル Markdown をチャンク化し、意味的埋め込みで検索
- **Sparse Full-Text Search** —— MiniSearch によるキーワード想起
- **Spaces Map & Dependency Graph** —— Markdown の相対パス双方向リンクをグラフ辺として扱い、ページ間の依存関係を構築
- **Agent API Services** —— JSON エンドポイントを公開：キーワード / セマンティック検索、コンテキストリング検索、統計、プラネットマップレイアウト、要約

`moon-shot/okf/docs/` には **Google OKF 仕様書**（`OKF.md` 原文 + `OKF_CN.md` 中国語訳）も含まれています——OKF は三つのモジュールを通す共通契約であり、ESCAPE が書き、MOON が編集し、SHOT が読みます。

***

## プロジェクト構造

```
moon-escape/                            # ルート（pnpm workspace）
├── pnpm-workspace.yaml                 # packages: ['.', 'moon-app', 'moon-shot']
├── package.json                        # bye-bye ルートパッケージ: start / dry-run / typecheck / web
│
├── moon-escape/                        # ━━━ ESCAPE モジュール ━━━
│   ├── common/                         #   プラットフォーム共通ツール（プラットフォーム非依存）
│   │   ├── paths.ts                    #     --export-dir / MOON_ESCAPE_EXPORT_DIR / ~/iNon/Wiki/
│   │   ├── sanitize.ts                 #     ファイル名サニタイズ
│   │   ├── path-allocator.ts           #     競合サフィックス割り当て（X.md → X-1.md）
│   │   ├── frontmatter.ts              #     YAML frontmatter 読み書き
│   │   ├── safe-call.ts                #     try/catch エラー許容ラッパー
│   │   └── count-md.ts                 #     .md ファイル数の再帰カウント
│   ├── bye-bye-notion/                 #   ✅ Notion 取得実装（コア）
│   │   ├── src/
│   │   │   ├── main.ts                 #     CLI → searchAll → 予算パス表 → ストリーム再帰
│   │   │   ├── limiter.ts              #     p-queue 3 req/s + 429/5xx バックオフ再試行
│   │   │   └── notion/                 #     Notion SDK ラッパー
│   │   │       ├── client.ts           #       dotenv + @notionhq/client
│   │   │       ├── search.ts           #       全量 searchAll（page + data_source）
│   │   │       ├── page.ts             #       retrievePage メタデータ
│   │   │       ├── database.ts         #       2025 モデル: data_source.retrieve + クエリ
│   │   │       ├── blocks.ts           #       BFS によるブロックツリー取得（maxDepth=20）
│   │   │       ├── ancestor.ts         #       block_id → page_id 祖先インデックス
│   │   │       ├── budget.ts           #       予算パス表（トップダウン BFS）
│   │   │       └── markdown.ts         #       ブロックツリー → markdown（メンション書き換え含む）
│   │   ├── scripts/                    #     単発診断・検証スクリプト
│   │   └── docs/                       #     移行設計 + Notion API フィールドドキュメント
│   ├── bye-bye-lark/                   #   🚧 Lark 取得（未実装）
│   └── bye-bye-yuque/                  #   🚧 Yuque 取得（未実装）
│
├── moon-app/                           # ━━━ MOON モジュール ━━━
│   ├── src/
│   │   ├── app/page.tsx                #   3 ペイン構成（ファイルツリー / エディタ / PageProperties）
│   │   ├── components/                 #   editor（Tiptap）/ file-tree / page-properties / search
│   │   ├── hooks/                      #   useDirectory / useFileTree / useAutoSave / useSearchIndex
│   │   └── lib/                        #   fs-access / frontmatter / markdown-serde / double-link / search-index / db
│   └── docs/                           #   設計ドキュメント + TODO
│
├── moon-shot/                          # ━━━ SHOT モジュール ━━━
│   ├── src/                            #   ナレッジエンジン + Agent API 実装
│   ├── okf/                            #   Google OKF 仕様 & ツール
│   │   ├── docs/                       #     OKF.md 原文 + OKF_CN.md 中国語訳
│   │   ├── scripts/                    #     OKF 検証・変換スクリプト
│   │   └── CLAUDE.md                   #     SHOT 側ガイダンス
│   └── README.md                       #   モジュール概要（Roadmap + Features）
│
├── docs/                               # プロジェクトレベルドキュメント
│   ├── README_EN.md                    #   英語 README
│   ├── README_JA.md                    #   日本語 README
│   ├── README_ZH_TW.md                 #   繁体字中国語 README
│   └── superpowers/
│       ├── specs/                      #   Web エディタ v1/v2/v3 設計仕様
│       └── plans/                      #   対応する実施計画
│
├── AGENTS.md                           # → CLAUDE.md
└── CLAUDE.md                           # プロジェクトガイドライン：Notion フィールドマッピング + 取得戦略 + 3 つの黄金律
```

***

## データフロー

```
                ┌────────────────────────────────────┐
                │  Notion · Lark · Yuque（クラウド）    │
                └──────────────┬─────────────────────┘
                               │
                ┌──────────────▼─────────────────────┐
   🚀 ESCAPE   │  bye-bye-notion / bye-bye-lark / … │
   moon-escape │  searchAll → blocks → OKF markdown  │
                └──────────────┬─────────────────────┘
                               │  ~/iNon/Wiki/*.md  (YAML frontmatter + 親子ディレクトリ)
                               │
                ┌──────────────▼─────────────────────┐
   🌕 MOON     │  moon-app (Tiptap + FS Access API) │
   moon-app    │  3 ペイン / 11 フィールド / 検索     │
                └──────────────┬─────────────────────┘
                               │  同じローカル .md
                               │
                ┌──────────────▼─────────────────────┐
   🎯 SHOT     │  moon-shot (RAG + MiniSearch + …) │
   moon-shot   │  ベクトル検索 / キーワード / Agent API│
                └────────────────────────────────────┘
```

三つのモジュールは同じ OKF 契約を共有します：ESCAPE が書き、MOON が編集し、SHOT が読む。一度編集すれば、全体に波及します。

***

## 機能一覧

### 🚀 ESCAPE（`moon-escape/`，現状 Notion 準拠）

- **ID 冪等性を備えたストリーミング取得** —— スキャンしながら即時書き込み。ネットワーク切断やクラッシュ時もデータを失わず、再実行時は `notion_id` に基づいて出力済みのサブツリーをスキップ
- **Notion 2025 モデルの完全サポート** —— Database コンテナ + 複数 Data Source、`block_id` 親ページ、フラット化されたカスタムプロパティをすべて OKF YAML にマッピング
- **予算パス表（Budgeted Path Map）** —— 子ページがまだ取得されていない場合でも、親ページのレンダリング時に正しい相対パスで `## Children` リストを書き出せる
- **流量制限 + バックオフ** —— `p-queue` 3 req/s + `Retry-After` 解析 + 5xx 系エラー時の指数バックオフ + ジッター
- **プラットフォーム横断の再利用層** —— `moon-escape/common/` がパス解決・サニタイズ・frontmatter をプラットフォーム非依存に切り出し、Lark / Yuque に再利用の余地を残す

### 🌕 MOON（`moon-app/`）

- **File System Access API ディレクトリ選択 + IndexedDB ハンドル永続化** —— 初回選択のみで次回以降自動復元。権限失効時は再認証ボタン
- **3 ペインレイアウト** —— 左：ファイルツリー / 中央：Tiptap リッチテキスト / 右：PageProperties
- **PageProperties パネル** —— `js-yaml` で 11 個の OKF フィールド（OKF 6 + Notion 5）を解析。未知のフィールドも消失せず透過的に引き継ぎ
- **Markdown 相対パスによる双方向リンク遷移** —— Cmd/Ctrl + クリック。エディタ外では `getFileHandleByPath` を用いて階層をまたぐパスを解決
- **グローバル検索（MiniSearch + Cmd/Ctrl+K）** —— 中国語は 2-gram、英語はスペース区切りでトークン化。サブディレクトリを再帰的にスキャン
- **5 秒デバウンス自動保存 + ステータス表示** —— ミューテックスロックで同時書き込みを防止。Cmd/Ctrl+S で即時保存
- **ファイル / フォルダ CRUD** —— 右クリックメニューで新規作成・名前変更・削除。`-1` などの連番で自動的に競合回避

### 🎯 SHOT（`moon-shot/`，Roadmap）

- **Dense Vector Search (RAG)** —— ローカル Markdown のチャンク化と、意味的埋め込みによる検索
- **Sparse Full-Text Search** —— MiniSearch によるキーワード想起
- **Spaces Map & Dependency Graph** —— Markdown 相対パスの双方向リンクをグラフ辺として利用
- **Agent API Services** —— JSON エンドポイント：キーワード / セマンティック検索、コンテキストリング検索、統計、プラネットマップレイアウト、要約

***

## クイックスタート

### 0. インストール

```bash
pnpm install
```

`.env.example` をコピーして TOKEN を貼り付けます。

### 1. 取得計画のプレビュー（ドライラン・ディスク書き込みなし）—— ESCAPE

```bash
pnpm dry-run --root <page-uuid> [--root <page-uuid>...]
```

Notion からの読み込みのみを行い、サブツリーを Markdown のリストとして標準出力に印刷します。ディスクへの書き込みは一切行いません。`<page-uuid>` は 32hex / 8-4-4-4-12 / notion.so URL 形式に対応しています。

### 2. 実際の取得（ストリーミングディスク書き込み）—— ESCAPE

```bash
pnpm start --root <page-uuid>
```

ページまたはデータベースをスキャンするたびに即座に書き込みます。処理が中断された場合でも、スキャン済みの内容はエクスポートディレクトリに残ります。再実行時は `notion_id` を用いてエクスポート済みのサブツリーをスキップします。特定のサブツリーを強制的に再取得したい場合は、対応する `.md` ファイルまたはディレクトリを削除してください。

利用可能なスクリプト（`pnpm install` 後に動作）：

| コマンド | 用途 |
| --- | --- |
| `pnpm start` | Notion ストリーミング取得の開始（ESCAPE） |
| `pnpm dry-run` | プレビュー（読み取りのみ、書き込みなし） |
| `pnpm typecheck` | `tsc --noEmit`（src + bye-bye-notion/src + scripts をカバー） |
| `pnpm build` | TypeScript を `dist/` にコンパイル |
| `pnpm web` | Web エディタ起動（`moon-app` の `next dev`、すなわち MOON） |
| `pnpm web:build` | Web エディタのプロダクションビルド |

サブパッケージのコマンドは、直接 `moon-app/` ディレクトリで `pnpm dev` / `pnpm test` を実行したり、`moon-shot/` 内の独自コマンドを実行したりできます。pnpm workspaces が自動的に依存関係を調整します。

### 3. エクスポート先のカスタマイズ（ESCAPE）

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

### 4. ブラウザでの編集 —— MOON

```bash
pnpm web
# http://localhost:3000/ を開く
```

`~/iNon/Wiki/` ディレクトリを選択 → 読み書き権限を許可 → 左ペイン：ファイルツリー → 中央ペイン：Tiptap エディタ → 右ペイン：PageProperties（11 フィールドカード）。`Cmd/Ctrl+S` で即時保存、5 秒後に自動保存されます。`Cmd/Ctrl+K` でグローバル検索が可能です。

Chromium 系のブラウザが必要です（File System Access API を使用するため）。その他のブラウザでは、読み込み時に `unsupported` ステータスが表示されます。

### 5. ローカル知識を Agent に渡す —— SHOT

SHOT は現在 Roadmap 段階です。`moon-shot/src/` が実装されれば：

```bash
pnpm --filter moon-shot dev   # ナレッジエンジン / Agent API を起動
```

***

## 関連ドキュメント

### 設計と仕様

- **OKF 仕様** —— [`moon-shot/okf/docs/OKF_CN.md`](../moon-shot/okf/docs/OKF_CN.md)（中国語訳、Google Cloud Blog 2026-06 より）。ESCAPE / MOON / SHOT 三つを通す共通契約。
- **Notion フィールドマッピング** —— [`bye-bye-notion/docs/`](../bye-bye-notion/docs/)（PAGE / DATABASE / PAGE_PROPERTIES / NOTION_PAT）
- **SHOT モジュール説明** —— [`moon-shot/README.md`](../moon-shot/README.md)

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

# MOON エディタのユニットテスト（vitest + happy-dom + fake-indexeddb）
pnpm --filter moon-app test

# SHOT モジュールのコマンド（Roadmap の実装に合わせて順次追加）
pnpm --filter moon-shot test

# 単発の診断スクリプト（ESCAPE / Notion 側、tsx は devDeps に導入済み）
pnpm exec tsx bye-bye-notion/scripts/validate.ts             # 4 つのルートサブツリーとローカルの .md を照合
pnpm exec tsx bye-bye-notion/scripts/verify-ids.ts           # 各 .md の notion_id を検証
pnpm exec tsx bye-bye-notion/scripts/verify-ancestor-index.mts  # インラインページの配置検証
```

***

## パッケージ管理（pnpm workspaces）

プロジェクトはモノレポ管理に **pnpm workspaces** を採用しています：

- ルートの `pnpm-workspace.yaml` で `packages: ['.', 'moon-app', 'moon-shot']` を宣言
- 三つのモジュールは独立パッケージ：ESCAPE はルートパッケージ、MOON は `moon-app/`、SHOT は `moon-shot/`
- ルートの `pnpm-lock.yaml` を共有し、依存関係の重複排除と高速なインストールを実現
- サブパッケージのコマンドは `pnpm --filter <pkg> <cmd>` を使うか、各サブパッケージのディレクトリで直接実行
- `.pnpm-store/`（グローバルストアを使用する場合）は `.gitignore` ですでに除外されています

***

<br />

*We chose to go to the Moon.*
*Now we choose to leave.*
*Not with fanfare. Just quietly,*
*with our notes tucked under one arm,*
*walking back down.*