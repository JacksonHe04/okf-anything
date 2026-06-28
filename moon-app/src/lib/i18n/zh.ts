export const zh = {
  // Navigation
  aboutUs: '关于我们',
  technology: '核心技术',
  service: '产品服务',
  blog: '官方博客',
  contacts: '联系我们',
  products: '进入系统',

  // Hero Section
  sloganLine1: 'nothing',
  sloganLine2: 'is impossible',
  heroTitle: 'MOONLESS OKF SYSTEM',
  heroIntro: '有人告诉我们要以月球为目标。我们照做了。我们将一切都放到了那里——我们的笔记、我们的思想、我们多年的工作成果——放在别人的服务器上，在别人的客户端里，被别人的付费墙阻挡。现在，服务器变慢了，席位费更贵了。而我们仍然漂浮在空中，不知如何回家。',

  // Weather and Meta
  weatherStatus: '本地存储正常，快速读写，空间无上限。',
  editionInfo: '创刊号 · 第一期',
  latestEventBadge: '最新动态',
  epaper: '电子报',
  todaysPaper: '今日要闻',
  explore: '探索',

  // ESCAPE Article
  escapeTitle: 'ESCAPE: 从云端 Notion / 飞书 / 语雀中挣脱',
  escapeText: 'moon-escape 把你在云端的工作空间流式拉到本地，落成符合 Google OKF (Open Knowledge Format) 规范的 Markdown 格式。通过自适应并发限制与限流重试机制，安全、快速、完整地拉取你的所有文档、数据库以及内容块。Notion 平台已完整实现——支持 2025 多数据源、Block 嵌套页面重组、p-queue 限流以及预算路径解算，确保本地文件的目录父子关系 100% 还原。',

  // Join Us Article
  joinUsTitle: '加入我们，共建本地知识库',
  joinUsText: '加入我们，建立你的本地私有知识系统，脱离云端绑定，享受纯净、无阻、极速的个人知识管理体验。三个模块共享同一份 OKF 契约，改一处，全局生效。不依赖任何私有云服务，真正拥有你的文字。',

  // Mini Articles
  escapeReleasedHeader: 'ESCAPE 模块 V0.1 正式发布',
  escapeReleasedTitle: 'Notion 导出策略实现完整幂等',
  escapeReleasedText: '新版本拉取机制支持断点重续与强幂等性校验。程序会比对本地 Markdown 文件 Frontmatter 中的 notion_id，已完成的子树直接跳过，有效规避 Notion 速率限制并成倍提高同步效率。',
  learnMore: '了解更多 →',

  editorNeedsHeader: 'MOON 编辑器需要你的文件',
  editorNeedsTitle: 'Tiptap 所见即所得网页应用集成原生文件系统 API',
  editorNeedsText: 'MOON 编辑器运行于浏览器沙盒中，借由 File System Access API 实现无需服务端的本地目录双向同步。修改直接写盘，并在页面转换或创建时自动解决重名冲突与自增后缀分配。',

  // Secondary Newspaper
  home: '首页',
  latest: '最新',
  world: '世界',
  editors: '编辑推荐',
  sports: '体育',
  lifestyle: '生活',
  architectureHeader: '技术架构',
  architectureText: 'MOONLESS 基于 pnpm monorepo 架构。通过 Web App 隔离运行，采用 100% 纯本地计算，绝不上传私钥和个人文档信息。使用 Google OKF 作为数据一致性契约。',
  thisWeekHeader: '★ 本周要闻',
  dataFlowTitle: '数据流管道',
  dataFlow1: '1. ESCAPE: 从 Notion/飞书等流式拉取并生成 OKF Markdown。',
  dataFlow2: '2. MOON: 本地所见即所得编辑器，读写同一份本地 Markdown，自动维护父子关系。',
  dataFlow3: '3. SHOT: 智能连接引擎，计算 Embedding，暴露 Agent API 供 AI 消费。',
  emagazineHeader: '电子杂志封面展示',
  seeMore: '查看更多 →',

  // SHOT Article
  shotRoadmap: 'SHOT 路线图',
  shotTitle: '大趋势！本地 RAG 知识引擎',
  shotText: '本地知识不应该只是沉睡的文件。SHOT (Knowledge Engine) 旨在构建面向 Agent 的数据连接管道：支持对本地 Markdown 计算 Embedding 进行语义向量检索，结合 MiniSearch 实现高精准度混合召回；通过链接拓扑扫描解析构建在内存中的关系图谱(Space Graph)；并提供标准的 Agent JSON 接口，使 AI Agent 能够随时以结构化元数据与上下文环检索读取本地知识。',

  // Editor Page (Workspace/Home)
  noFileSelected: '未选择文件',
  reloadWorkspace: '重新加载工作区',
  aboutMoon: '关于 MOON',
  aboutMoonless: '关于 MOONLESS',
  saving: '保存中…',
  saved: '已保存',
  error: '保存失败',
  unsaved: '未保存',
  newFile: '新建文件',
  newFolder: '新建文件夹',
  newFileRoot: '新建文件 (在根目录)',
  newFolderRoot: '新建文件夹 (在根目录)',
  workspace: '工作区',
  searchTooltip: '搜索 (⌘K)',
  searchPlaceholder: '输入关键字以搜索整个工作区...',
  searchProgress: '索引中',
  moreActions: '更多',
  recentFiles: '最近打开文件',
  loadWorkspaceTitle: '从本地加载你的知识',
  selectWorkspaceBtn: '选择本地文件夹',
  reauthRequired: '需要重新授权',
  noDirectoryDetected: '未选择有效的工作目录。点击按钮选择一个本地文件夹开始使用。',
  confirmDelete: '确定删除该文档？',
  confirmDeleteText: '将删除该文档及其所有子文档，操作不可撤销。',
  confirm: '确定',
  cancel: '取消',
  enterFileName: '请输入文件名',
  enterFolderName: '请输入文件夹名',
  fileAlreadyExists: '同名文件已存在，请换个名字',
  folderAlreadyExists: '同名文件夹已存在，请换个名字',
  noMatchesFound: '未找到匹配的文档',
  searchResults: '搜索结果',
  emptyWorkspaceMsg: '工作区目录为空。你可以使用底部按钮创建新文件。',
  
  // Properties panel
  propertiesTitle: '文档属性',
  propTitle: '标题',
  propType: '类型',
  propDescription: '描述',
  propTags: '标签',
  propResource: '原始资源',
  propCreatedTime: '创建时间',
  propLastEditedTime: '修改时间',
  propNotionId: 'Notion ID',
  propParentType: '父节点类型',
  propParentId: '父节点 ID',
  propUnknown: '未知属性',

  // Toc & Related
  tableOfContents: '大纲目录',
  relatedDocs: '关联文档',
  backlinks: '反向链接',
  noHeadings: '暂无标题大纲',
  noRelated: '暂无关联文档',
  noBacklinks: '暂无反向链接',
  recentTitle: '最近打开',

  // Welcome page keys
  welcomeSubtitleActive: '从左侧文档树选择页面开始编辑，或使用顶部搜索快速跳转。',
  welcomeSubtitleEmpty: '先选择一个本地工作区。MOONLESS 会直接在你的 Markdown 文档上工作，不做额外同步层。',
  welcomeShortcuts: '快捷键',
  welcomeSearch: '全局搜索',
  welcomeSave: '立即保存',
  welcomeLeftSidebar: '折叠 / 展开左栏',
  welcomeRightSidebar: '折叠 / 展开右栏',
  welcomeFollowLink: '跟随双向链接',
  welcomeInterface: '界面说明',
  welcomeLeftSidebarDesc: '左栏：文档树与工作区切换。',
  welcomeTopBarDesc: '顶栏：面包屑、搜索、保存状态和主题切换。',
  welcomeRightSidebarDesc: '右栏：属性、目录和关联文档。',

  // WorkspaceSwitcher keys
  selectWorkspace: '选择工作区',
  clickToSwitchWorkspace: '点击切换工作区',
  unsupportedBrowserTitle: '浏览器不支持 File System Access API',
  permissionDenied: '权限被拒绝',
  useSupportedBrowser: '请使用 Chrome / Edge / Arc 浏览器',

  // Field / Property keys
  emptyValue: '空',
  listPlaceholder: '逗号分隔,如: a, b, c',
  noFrontmatter: '此文件无 frontmatter',
  addFrontmatter: '添加 frontmatter',
  requiredField: '必填',

  // Search Results keys
  noSearchResults: '无匹配结果',
  typeToSearch: '输入关键词开始搜索',

  // ContextMenu & Dialogs
  nameAlreadyExists: '该名称已存在',
  enterName: '输入名称',
  clickOutsideToCancel: '点击空白处或取消按钮可取消操作',
  delete: '删除',

  // TreeNode keys
  loading: '加载中…',
  newFileHere: '在此新建文件',
  newFolderHere: '在此新建文件夹',
  rename: '重命名',
  newSubDoc: '新增子文档',
  renameTitle: '重命名 "{name}"',
  deleteTitle: '删除 "{name}"?',
  confirmDeleteTextSingle: '操作不可撤销。',
  newFileIn: '在 {name}/ 新建文件',
  newFolderIn: '在 {name}/ 新建文件夹',
  newSubDocIn: '在 {name} 下新增子文档',

  // RightRail keys
  propertiesTab: '属性',
  tocTab: '目录',
  relatedTab: '关联',
};
