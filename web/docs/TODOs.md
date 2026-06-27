# Leave the Moon — Web 待办清单

> 本文档是 `web/`（Next.js 16 + React 19）后续开发方向的待办列表。
> 来源：[`docs/IDEA.md`](./IDEA.md) + 上一次会话中梳理出的 26 个方向点。
> 状态：全部为 `pending`。

---

## 0. 阅读须知

- **核心改造方向（来自 IDEA.md）**：本项目要从「源码+预览分栏」重构为 **Notion 式富文本编辑**，使用 **Tiptap**；YAML 改为**右侧 page properties 面板**。
- **优先级约定**：
  - 🔴 **P0** — 不做完没法用的核心功能
  - 🟠 **P1** — 显著提升体验
  - 🟡 **P2** — 锦上添花 / 长期目标
- **字段映射参考**（来自根 `CLAUDE.md`）：
  - `id → notion_id`
  - `parentType → notion_parent_type`
  - `parentId → notion_parent_id`

---

## 1. P0 — 编辑器核心改造（IDEA.md 明确要求）

### 1.1 富文本编辑器迁移到 Tiptap

- [ ] **引入 Tiptap 核心 + StarterKit**（注意 React 19 兼容性，确认 Tiptap v2.x 最新稳定版）
- [ ] **设计 Tiptap schema**：paragraph / heading (H1-H3) / bullet list / ordered list / code block (含语言标识) / blockquote / divider / link
- [ ] **实现「内联双链」节点**：自定义 Tiptap Node `[[notion_id]]` 或 `[[title]]` 解析与渲染（见 §1.6）
- [ ] **实现图片节点**：从 `local/` 同目录或子目录引用图片，inline 渲染
- [ ] **实现 frontmatter 与正文的边界**：Tiptap 内容只覆盖 `---` 之后的部分，frontmatter 独立管理
- [ ] **保存格式选择**：保存为 Markdown（保留 OKF 可读性）OR JSON（保留 Tiptap 完整结构）—— 评估后决定（建议 **Markdown** 为主，正文以自定义的 `[[...]]` 扩展标记）
- [ ] **迁移/删除 CodeMirror 相关依赖**（`codemirror`、`@codemirror/*`），从 `package.json` 清理
- [ ] **卸载 `marked` 依赖**（不再需要 Markdown 渲染，Tiptap 自身渲染富文本）

### 1.2 布局重构（YAML 移到右侧）

- [ ] **三栏布局改为：左侧文件树 | 中央富文本编辑器 | 右侧 Page Properties**
- [ ] **右侧 Page Properties 面板设计**：
  - 优雅的字段卡片，每个字段独立（title、notion_id、notion_parent_type、notion_parent_id、created_time、last_edited_time、resource、tags…）
  - 自动从 frontmatter 解析字段并渲染
  - 字段可折叠分组（基础信息 / 来源 / 时间戳 / 自定义）
  - 字段编辑后实时同步到内存中的 frontmatter 对象
- [ ] **删除当前 `page.tsx` 中三栏 `<div id="editorPanels">` 结构**

### 1.3 文件/文件夹 CRUD

- [ ] **新建文件**：在当前目录（或选中的目录）创建新 `.md` 文件
  - [ ] 处理重名：遵守根 `CLAUDE.md` 规则 — `xxx-1.md` / `xxx-2.md` 自增后缀
  - [ ] 创建后自动打开新文件进入编辑
- [ ] **新建文件夹**
- [ ] **重命名文件 / 文件夹**
  - [ ] 同步更新 `notion_parent_id` 引用关系（如有重命名）
- [ ] **删除文件 / 文件夹**（需二次确认）
- [ ] **文件树右键菜单 / 悬浮操作按钮**（更优雅的触发方式）
- [ ] **拖拽移动文件 / 文件夹**
- [ ] **抽取文件操作到 `lib/fs-access.ts`**：createFile / createDir / rename / delete / move，统一封装 FileSystemFileHandle / FileSystemDirectoryHandle 操作

### 1.4 5 秒自动保存

- [ ] **实现 debounce 5s 自动保存**（仅对当前打开且 `dirty` 的文件）
- [ ] **保存状态指示器**：
  - [ ] 显示「保存中…」/「已保存 (时间)」/「未保存 *」
  - [ ] 失败时显示错误与重试入口
- [ ] **`beforeunload` 拦截**：关闭标签页前如有未保存内容，提示用户
- [ ] **多 Tab 场景**：如果同一文件在两个 Tab 打开（罕见），用 `BroadcastChannel` 或 `storage` 事件同步 dirty 状态（先评估必要性）
- [ ] **保留 `Cmd/Ctrl+S` 强制立即保存**

### 1.5 全局搜索

- [ ] **搜索入口**：顶部搜索框 / `Cmd/Ctrl+K` 快捷键
- [ ] **文件名搜索**：模糊匹配（fuse.js 或手写）
- [ ] **文件内容搜索**：轻量索引（`MiniSearch` / `FlexSearch` / `lunr`，选最合适的）
- [ ] **索引构建**：选择目录后异步构建（web worker？不阻塞 UI）
- [ ] **索引失效**：文件增删改时增量更新索引
- [ ] **搜索结果展示**：分组（文件名命中 / 内容命中），点击跳转
- [ ] **搜索结果中高亮关键词**

### 1.6 双链跳转

- [ ] **自定义 Tiptap Node 解析 `[[...]]` 语法**（参考 Obsidian 风格）
- [ ] **双链目标解析**：
  - [ ] 优先按 `notion_id` 匹配
  - [ ] 其次按文档 `title` 匹配
  - [ ] 匹配失败时显示为「红色死链」
- [ ] **点击双链跳转**：自动打开目标文件
- [ ] **双链补全**：输入 `[[` 触发搜索建议浮层
- [ ] **「未链接提及」面板**：扫描正文中的 `notion_id` / `title` 但还没用 `[[]]` 包起来的地方，一键补成双链

---

## 2. P1 — 知识网络增强（OKF 核心价值）

- [ ] **反向链接面板（backlinks）**：右侧或底部，展示「谁引用了我」
  - [ ] 解析 `notion_id` 构造反向索引
  - [ ] 索引在文件增删时增量更新
- [ ] **OKF 字段识别与展示**：
  - [ ] 识别 `notion_id` / `notion_parent_type` / `notion_parent_id` / `resource` 字段
  - [ ] 「resource」字段渲染为可点击链接
  - [ ] 「notion_parent_id」展示父文档跳转
- [ ] **图谱视图**：父子关系 + 反向链接画成节点图（D3 / Cytoscape / React Flow）
- [ ] **Frontmatter 字段校验**：缺 `notion_id` / 类型错误时实时提示
- [ ] **多文件 Tab**：右侧或底部 Tab 栏支持同时打开多个文件

---

## 3. P1 — 工程化拆分（页面已 412 行）

- [ ] **拆分 `page.tsx`**：
  - [ ] `components/FileTree/` — 递归文件树组件
  - [ ] `components/Editor/` — Tiptap 编辑器封装
  - [ ] `components/PageProperties/` — 右侧 YAML 面板
  - [ ] `components/SearchPanel/` — 搜索面板
  - [ ] `components/BacklinksPanel/` — 反向链接面板
- [ ] **抽离 hooks**：
  - [ ] `hooks/useDirectory.ts` — 目录选择 + 权限管理
  - [ ] `hooks/useFileTree.ts` — 文件树状态机
  - [ ] `hooks/useAutoSave.ts` — 5s debounce 自动保存
  - [ ] `hooks/useSearchIndex.ts` — 搜索索引构建与更新
- [ ] **抽离工具库**：
  - [ ] `lib/fs-access.ts` — IndexedDB + picker + CRUD
  - [ ] `lib/frontmatter.ts` — 解析 / 序列化 / 校验（用 `js-yaml`，替换手写 splitter）
  - [ ] `lib/double-link.ts` — 双链解析与渲染
  - [ ] `lib/search-index.ts` — 索引抽象
- [ ] **CSS 治理**：当前 `globals.css` 309 行平铺，建议迁移到 CSS Modules 或 vanilla-extract
- [ ] **TypeScript 严格化**：
  - [ ] 移除裸 `err: unknown`，统一错误类型
  - [ ] 收紧 CodeMirror→Tiptap 迁移后的类型推断
  - [ ] 补 `FileSystemAccessAPI` 类型（当前在 `src/types/file-system-access.d.ts`，需评估新版 dom lib 是否已支持）
- [ ] **测试基础设施**：
  - [ ] `vitest` 单元测试覆盖 `lib/frontmatter.ts`、`lib/double-link.ts`
  - [ ] `playwright` e2e 覆盖「选目录 → 打开文件 → 编辑 → 保存」主流程

---

## 4. P2 — AI 协作（与项目初衷契合）

- [ ] **本地 AI 助手面板**（基于 Ollama / 本地 gguf，避免云端 API 与密钥）
- [ ] **AI 自动补 frontmatter**：新建文件时根据正文草拟 title / tags / summary
- [ ] **AI 总结 / 重写当前文档**
- [ ] **批量操作辅助**：
  - [ ] 批量为缺 summary 的页面补 summary
  - [ ] 批量给孤儿子页面打 archive 标签
- [ ] **对话引用当前文档上下文**（右侧 chat 面板，自动注入 `notion_id` 与正文）

---

## 5. P2 — 预览与导出

- [ ] **导出为 HTML / PDF**（用 Tiptap 的 `getHTML()` 渲染）
- [ ] **图片 / 附件支持**：
  - [ ] 扩展 `readDirectoryEntries` 支持非 `.md` 文件（图片预览）
  - [ ] 拖拽图片到编辑器插入
- [ ] **快捷命令面板**（`Cmd/Ctrl+P`）：按文件名快速打开（区别于搜索）

---

## 6. P2 — 跨平台适配

> 根目录有 `bye-bye-notion` / `bye-bye-lark` / `bye-bye-yuque`，未来可能统一拉取到同一个 `local/`。

- [ ] **多源 frontmatter schema 抽象**：飞书 obj_token、语雀 uuid、Notion id 字段命名不同
- [ ] **多源 schema 适配器**：识别不同来源的字段，Page Properties 面板动态渲染
- [ ] **跨源双链**：双链语法扩展为支持 `[[notion:xxx]]` / `[[lark:xxx]]` / `[[yuque:xxx]]`

---

## 7. P2 — 体验与稳定性

- [ ] **错误边界 + Loading 态**：大目录递归 `readDirectoryEntries` 时骨架屏
- [ ] **PWA 化**：纯客户端应用，支持离线 / 安装到桌面
- [ ] **快捷键**：
  - [ ] `Cmd/Ctrl+S` — 保存
  - [ ] `Cmd/Ctrl+K` — 搜索
  - [ ] `Cmd/Ctrl+P` — 快速打开
  - [ ] `Cmd/Ctrl+N` — 新建文件
  - [ ] `Cmd/Ctrl+\` — 切换文件树 / 搜索面板
- [ ] **国际化（i18n）**：当前硬编码中文，预留 i18n 接口
- [ ] **可访问性（a11y）**：键盘导航、ARIA 属性
- [ ] **暗色 / 亮色主题切换**（当前是跟随系统，添加手动切换）

---

## 8. P3 — 远期目标

- [ ] **多端同步**：WebDAV / iCloud / Dropbox 同步 `local/` 目录
- [ ] **协作编辑**：Yjs + WebRTC
- [ ] **插件系统**：Tiptap extension 形式允许用户扩展编辑器能力
- [ ] **移动端适配**：File System Access API 移动端支持有限，需要 fallback

---

## 9. 依赖 / 包管理

- [ ] **移除**：`codemirror`、`@codemirror/*`、`marked`
- [ ] **新增**：
  - [ ] `@tiptap/react`、`@tiptap/starter-kit`、`@tiptap/extension-link`
  - [ ] `@tiptap/extension-placeholder`（占位提示）
  - [ ] 选其一：`minisearch` / `flexsearch` / `fuse.js`
  - [ ] 选其一：`d3` / `reactflow` / `cytoscape`（图谱视图）
- [ ] **评估**：`js-yaml`（已装，需开始使用）、`fuse.js`（若选作搜索）

---

## 10. 完成度追踪

| 阶段 | 状态 | 完成度 |
|------|------|--------|
| 1. 编辑器核心改造 | ⏳ pending | 0 / 6 子模块 |
| 2. 知识网络 | ⏳ pending | 0 / 5 |
| 3. 工程化 | ⏳ pending | 0 / 6 |
| 4. AI 协作 | ⏳ pending | 0 / 5 |
| 5. 预览与导出 | ⏳ pending | 0 / 3 |
| 6. 跨平台 | ⏳ pending | 0 / 3 |
| 7. 体验与稳定性 | ⏳ pending | 0 / 7 |
| 8. 远期目标 | ⏳ pending | 0 / 4 |

---

## 11. 建议实施顺序

> 个人推荐：先把 1.1 + 1.2 做完（架构改造最关键），再做 1.3、1.4、1.5、1.6（功能补齐），再开始 3（工程化）。

1. **第一波**：1.1 Tiptap 迁移 + 1.2 布局重构（一次到位）
2. **第二波**：1.3 CRUD + 1.4 自动保存
3. **第三波**：1.5 搜索 + 1.6 双链 + 2 反向链接
4. **第四波**：3 工程化（边做边重构）
5. **第五波**：4 AI + 5 导出
