# mookf 重构决策记录

> 2026-07-05 重构期间的逐题对话摘录。完整对话见 `native/26-07-05.md`。

## 总目标

`iMon` → `mookf`。
本产品形态的本质不变：逃离 Notion / Lark 等中心化云知识库，在本地搭建可直接被 AI Agent 操作的 Markdown 知识库体系。
全新的 mookf **不再提供 Web 页面 / APP / 编辑器**，只做 CLI + Claude Code Skill，所有能力由 CLI 内化。

## 名字来源

`mookf` = `MO`on + `O`pensource + `K`nowledge + `F`(OKF) 的组合。Google OKF 是我们的核心规范。

## 决策清单（11 题）

### 1. 品牌名 & 形态
- 产品改名为 **mookf**（小写）
- 不再有任何 Web 页面 / APP / 编辑器
- **同步 = 拉取**：合并为同一个 Skill，每个平台（Notion / Lark）一个 Skill
- 提供"定时任务指令模板"，让 Claude Code 帮用户创建定时同步任务
- 利用 **UUID 幂等性** 保证用户可在 Workspace 任意重组本地文档而不影响同步
- **Short → SHOT（moonshot）**：不内建 RAG，采用 OKF 字段映射 + 类似 OpenViking 探索式检索
- ignore 配置：类似 `.gitignore` 风格
- Document 与代码、配置、PDF、Word 等同处一个 Workspace，按用户项目组织

### 2. 同步语义
- ✅ 增量拉取：本地缺则拉
- ✅ 增量更新：云端 `last_edited_time` 新于本地 → 更新本地
- ❌ 删除传播：云端删除 → 本地不动
- ❌ 反向写：禁止对云端 API 做写操作
- ✅ 输出格式 = OKF YAML + Markdown；字段映射由代码内置

### 3. 根目录 & 物理隔离
- 默认根目录 `~/iNon`，可在 `.mookf/config.yaml` 内自定义
- 全产品**单 Workspace**：Notion 与 Lark 拉取的文档**物理上分目录存放**（`notion/` 与 `lark/`），但共享同一份 config、同一份 UUID 空间

### 4. ignore 语法
- 类似 `.gitignore` 的 glob 规则；可写在 config.yaml 内或独立的 `.mookfignore`

### 5. config 存放位置
- 放在用户选择的根目录下：`<root>/.mookf/config.yaml`
- 状态字段：
  - `last_sync_time`（按平台分别记录）
  - ignore 规则
  - platform tokens（Notion / Lark）
  - OKF / moonshot 相关配置（自定义路径模板、默认快捷操作等）
- **不**保存 UUID → 本地路径映射（运行时按 frontmatter 中的 UUID 重算）

### 6. Workspace 数量
- 全产品**单 Workspace**；用户的 projects 都放在同一根目录下

### 7. Skill + CLI 二者结合
- **Skill（SKILL.md）** 教 Claude Code 怎么调用 CLI
- **CLI（`mookf` 二进制）** 是真正干活的引擎
- 定时任务：Claude 可通过 Skill 创建定时任务

### 8. CLI 形态
- 单一 npm 包：`@mookf/cli`
- 单一二进制 `mookf`，子命令分发：`mookf sync notion` / `mookf sync lark` / `mookf shot ...`

### 9. 增量检测算法
- 策略 **C**：UUID 幂等 + `last_edited_time` 时间戳
- 不拉内容做 hash，节省 API 配额
- 定位文件：扫描 frontmatter 里带 `notion_id` / `lark_id` 的 md

### 10. OKF 字段映射
- 字段映射由 CLI 内置，不依赖官方 OKF 规范的字段定义
- Notion 转换粒度：Page + Database Row（Page 粒度）；不展开 Block

### 11. moonshot
- 集成在 CLI 内（`mookf shot ...`）
- 由 Skill 教导 Agent 使用
- 优化方向：ignore、UUID 幂等、OKF 字段精确查找、批量修改
- **不做**内置索引；采用 grep / 多层 glob / YAML 直接遍历

## 架构（决策结果）

```
mookf/
├── package.json                # @mookf/cli, bin: { "mookf": "./bin/mookf" }
├── bin/mookf                   # 可执行入口
├── src/
│   ├── cli.ts                  # commander 入口
│   ├── commands/
│   │   ├── sync.ts             # mookf sync [notion|lark]
│   │   ├── shot.ts             # mookf shot <subcmd>
│   │   ├── init.ts             # mookf init (引导用户初始化)
│   │   └── config.ts           # mookf config show|set
│   ├── config/
│   │   ├── loader.ts           # 加载 config.yaml
│   │   └── schema.ts           # zod schema
│   ├── ignore/
│   │   └── matcher.ts          # .gitignore 风格 matcher
│   ├── okf/
│   │   ├── schema.ts           # OKF 输出 frontmatter 结构
│   │   └── frontmatter.ts      # YAML frontmatter 读写
│   ├── shot/
│   │   ├── walk.ts             # 遍历忽略规则下的 md
│   │   ├── find.ts             # 按 OKF 字段精确查找
│   │   ├── search.ts           # grep / 正则 / 多 glob
│   │   ├── replace.ts          # 批量替换
│   │   └── ls.ts               # 列文件
│   ├── sync/
│   │   ├── engine.ts           # UUID+last_edited_time 增量同步
│   │   └── paths.ts            # 路径模板生成
│   └── platforms/
│       ├── notion/
│       │   ├── client.ts       # Notion API wrapper
│       │   ├── pull.ts         # 拉取 page/database row
│       │   └── convert.ts      # Notion → OKF yaml + md
│       └── lark/
│           ├── client.ts
│           ├── pull.ts
│           └── convert.ts
├── skills/
│   ├── mookf-init/SKILL.md
│   ├── mookf-sync-notion/SKILL.md
│   ├── mookf-sync-lark/SKILL.md
│   └── mookf-shot/SKILL.md
├── templates/
│   └── cron-schedule.md        # Claude Code 用来创建定时任务的指令模板
├── docs/
├── README.md
├── CLAUDE.md                   # 项目级指令（用户私有，已存在，不动）
└── package.json
```

## 验收清单

- [ ] `pnpm build` 通过，TypeScript 0 报错
- [ ] `mookf --help` 输出核心子命令
- [ ] `mookf init` 在目标目录生成 `.mookf/config.yaml`
- [ ] `mookf sync notion --help` / `mookf sync lark --help` 可用
- [ ] `mookf shot --help` 输出 find/search/replace/ls 子命令
- [ ] SKILL.md 文件存在并被 Claude Code 加载
- [ ] README 不再含 `iMon`、`BYE-BYE-NOTION` 等残留表述
- [ ] `bye-bye-*` 历史目录已被吸收 + 删除
- [ ] ignore matcher 对 `node_modules/**` 生效
- [ ] UUID frontmatter 写读一致
