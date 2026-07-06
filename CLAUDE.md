# OKF Anything CLAUDE.md / AGENTS.md

> **O**pen + **K**nowledge + **F**ormat（开放知识格式）。产品最初的核心诉求——脱离中心化云端知识库——始终未变。

# okf-anything 是什么
okf-anything 可拉取并增量同步 **Notion** 与 **飞书Lark** 文档，将数据落地至本地 **OKF（开放知识格式）** Markdown 工作区。
默认工作目录路径：`~/iNon`，可在配置文件 `.okfa/config.yaml` 中自定义修改。

- okf-anything 仅提供命令行工具（`okfa`）与 Claude Code Skills 集。
- 拉取与同步为**同一套底层逻辑**：拉取操作本质是本地无存量数据时的同步流程。
- 本地磁盘共存三套独立唯一标识空间：`notion_id`、`lark_id`，以及唯一的 `inon_id`；三者组合构成增量同步的幂等校验键。
- 用户可自由调整本地文件目录结构；同步逻辑依靠唯一标识UUID匹配，不受文件路径改动影响。


# 字段映射规则（Notion → OKF格式）
| Notion 原生字段    | OKF YAML 存储字段                          |
|--------------------|-------------------------------------------|
| `id`               | `notion_id`                               |
| `title`            | `title`（文档标题）                       |
| `url`              | `resource`（文档源链接）                  |
| `createdTime`      | `created_time`（创建时间）                |
| `lastEditedTime`   | `last_edited_time`，同时存入 `timestamp` |
| `parent.type`      | `notion_parent_type`（父级对象类型）      |
| `parent.id`        | `notion_parent_id`（父级对象唯一ID）      |
| properties（除title外） | 扁平化存入 `properties` 对象            |

飞书Lark字段映射逻辑完全对称，对应字段为 `lark_id`、`lark_parent_type` 等。

# 拉取/同步/异常重试策略
1. **流式落盘**：单篇文档渲染完成后立即写入本地磁盘；中途强制终止程序（Ctrl-C）不会破坏现有文件目录完整性。
2. **UUID幂等保障**：重复执行同步命令时，若本地已存在对应 `notion_id`/`lark_id` 文档，则应先处理更新时间而不是重新拉取。
3. **重名冲突处理**：同一父目录下出现同名文件时，自动追加 `-1`、`-2`……后缀区分。
4. **禁止高危操作**：云端文档删除不同步删除本地文件；工具仅读取云端数据，**绝不调用Notion/飞书写入接口**。

# 参考资料
- 内部设计草稿存放路径：`.agents/docs/`（仅本地可见，不提交至代码仓库）

# 开发&使用约束规则
1. 未经用户明确许可，不得删除根目录下 `notion/`、`lark/` 文件夹。
2. 禁止调用Notion、飞书的写数据接口，命令行工具仅拥有只读权限。
3. 严禁提交隐私信息：接口令牌、私有文档Notion唯一ID等敏感数据。
4. 代码提交规范：参考 `.agents/skills/git-commit/SKILL.md`
5. 开发过程产出的方案、决策记录、测试报告统一存放至 `.agents/docs/`；**切勿存入docs目录**，架构草稿仅本地留存，不对外同步。
6. 本地开发标准入口为仓库根目录；执行 `pnpm install && pnpm run build` 即可重新生成 `dist` 编译目录。

# 拉取更新要求

默认工作空间是 ~/iNon，拉取目录是 ~/iNon/Wiki/，Wiki/ 中有 lark/ 和 notion/ 。

有子文档的文档，必须是目录，以目录下的 index.md 作为该文档拉取下的文件。

用户只要在工作空间内（默认是 ~/iNon）对文件任意移动位置，都视为该文档已拉，走检查是否要更新的路。

## Lark

lark/ 下应该是 wiki/, my-library/, minutes/ 3 个目录。

每次拉，默认这 3 个全部都拉。
wiki/ 中的知识库，每个是一个目录，目录下要有一个 index.md 表明这是哪个知识库（方便后续把这个知识库的东西更新到这个知识库）

## Notion

notion/ 中直接是顶级文档，无知识库、空间等概念。