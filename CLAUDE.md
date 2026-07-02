# Leave the Moon

我要离开 Notion。

我需要把我的个人 Notion 中的所有内容拉取到我的本地作为 markdown。保存的路劲为 ~/iNon/Wiki/
需要有完整的读权限的 API 来获得文档信息、文档内容、文档父子关系等。通过在本地编写程序来实现对我的 Notion 的拉取。
由于 Notion 存储了很多文档的信息，且存在父子关系，所以如何能在本地保留关键信息是重要的。
本地的 markdown 群会更有利于与 AI Agent 协作、以及个人的备份和管理，而不是依赖于 Notion。
Google 最近提出了 OKF 规范，可以理解为一个加强版的 Markdown，我还需要把 Notion 拉到本地的 markdown 群都符合这个标准。

后续不会再使用 Notion，无需考虑同步和更新的问题。

## 拉取操作

### 字段映射关系

id -> notion_id
title -> title
url -> resource
createdTime -> created_time
lastEditedTime -> last_edited_time
parentType -> notion_parent_type
parentId -> notion_parent_id

目录冲突风险：同一目录下，出现重复的文档/目录时候，用自增数字就行（后缀挂个-1这种）

### 拉取、检查与重试策略

- 既能及时的搞好一个保存一个，确保中断/阻塞/失败了也能保证任务最新进度；
- 又能在 retry 整个长程任务的时候跳过已做好的（根据 notion_id 检查幂等性）
- 最终 goal：Notion Search 的数目和本地拉取目录的 *.md 一致。

---

## References

- Google OKF: https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing
- Notion Personal Access Token: https://developers.notion.com/guides/get-started/personal-access-tokens

## Rules

- 禁止要未经用户的情况下删除 Wiki/ 目录
- 禁止对 Notion API 进行写操作  
- 禁止提交 Personal 信息
- Commit 规范（提交前必看）：.agents/skills/git-commit/SKILL.md
- 开发过程中产出的计划、报告等文档，需要放在 .agents/docs/ 中。
- 务必使用 ./moon-app/dev_setup.sh 来启动和重启网页端的开发服务