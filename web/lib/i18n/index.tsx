"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Locale = "zh" | "en";

export const translations = {
  zh: {
    // Header
    okfSub: "开放知识格式",
    navFeatures: "01. 特性",
    navDemo: "02. 在线终端",
    navArchitecture: "03. OKF 架构",
    navSkills: "04. AI Agent",
    navFaq: "05. FAQ",
    copyCli: "已复制 CLI",
    themeVintage: "复古报纸",
    themeLight: "明亮",
    themeDark: "暗黑",
    themeSystem: "跟随系统",

    // Hero
    badgeOkf: "开放知识格式 (Open Knowledge Format)",
    heroTitleLine1: "脱离中心化云端锁，",
    heroTitleLine2: "重获数据绝对所有权",
    heroSubtitle:
      "okf-anything 支持增量拉取与同步 Notion 与 飞书 Lark 文档，保留完整层级与 YAML 元数据，落地为本地自由控制的 OKF Markdown 工作区，无缝对接 AI Agent 与 Claude Code Skills。",
    tryOnline: "在线体验 okfa",
    bulletReadOnly: "绝对只读 · 零污染",
    bulletSync: "UUID 幂等增量同步",
    bulletLocalDir: "本地目录随意调整",
    diagramTitle: "OKF 增量流式架构",
    readOnlyBadge: "Read-Only 模式",
    stepCloudTitle: "1. 云端数据源 (Notion / 飞书)",
    stepCloudSub: "只读 API 抓取 Page, Database, Block 及其修改时间",
    stepMatch: "UUID 幂等匹配",
    stepLocalTitle: "2. 本地 OKF Markdown 工作区",
    stepLocalSub: "YAML Frontmatter + 标准 Markdown，目录随意重命名",

    // Terminal Demo
    demoBadge: "在线互动体验 (Live Terminal Simulation)",
    demoTitle: "体验 okfa 命令行流式同步",
    demoSub: "点击下方不同命令，模拟云端（Notion / 飞书）文档增量流式落盘至本地 OKF Markdown 工作区。",
    runCommand: "执行命令",
    readOnlyAuth: "云端只读授权",
    yamlHeader: "YAML Frontmatter (元数据标头)",

    // Comparison
    compBadge: "为什么选择 OKF Anything",
    compTitle: "传统云端知识库 vs OKF 开放格式",
    compSub: "摆脱 SaaS 软件的导出限制、频率封禁与数据私有化隐患，让你的个人与团队知识回归本地磁盘。",
    saasTitle: "传统 SaaS 云端知识库",
    saasTag: "Vendor Lock-in",
    saas1Bold: "黑盒数据锁定：",
    saas1Text: "文档只能保存在云端服务器，服务中断或到期即面临丢失风险。",
    saas2Bold: "导出格式错乱：",
    saas2Text: "手动导出往往丢失数据库关联、嵌套层级与自定义属性。",
    saas3Bold: "无法供 AI Agent 消费：",
    saas3Text: "API 极其受限且有频控限速，本地 CLI 工具与 AI 模型无法极速检索。",
    saas4Bold: "目录结构僵化：",
    saas4Text: "一旦在云端修改移动层级，外部脚本或引用链接立刻失效。",

    okfTitle: "OKF Anything 本地知识库",
    okfTag: "Open & Private",
    okf1Bold: "通用标准 Markdown：",
    okf1Text: "纯文本落盘，零私有格式，用任何编辑器（Obsidian, VSCode, iNon）均可直接打开。",
    okf2Bold: "UUID 组合幂等增量：",
    okf2Text: "notion_id 与 lark_id 在 YAML 标头留存，目录随意拖拽重命名不破坏同步。",
    okf3Bold: "AI Agent 原生集成：",
    okf3Text: "内置 4 大 Claude Code Skills 与高效 okfa shot 全文与属性检索指令。",
    okf4Bold: "严格只读 · 安全透明：",
    okf4Text: "仅拉取数据写入本地，绝不出域，绝不调用 Notion / 飞书的写数据接口。",

    // Feature Showcase
    featBadge: "核心功能矩阵 (Capabilities)",
    featTitle: "专为脱离云端而设计的 OKF 引擎",
    featSub: "从流式落盘到 AI Agent 原生集成，每一个细节都只为数据自由与极速体验。",
    f1Title: "双平台增量同步 Engine",
    f1Desc: "支持 Notion 与 飞书 (Lark) 双平台。通过 UUID + 最后编辑时间进行幂等增量对比，无需反复重新全量拉取。",
    f1b1: "流式落盘 (Ctrl-C 不破坏目录)",
    f1b2: "自动处理重名冲突追加后缀",
    f1b3: "绝对只读云端数据，零风险",
    f2Title: "OKF 标准 Markdown 存储",
    f2Desc: "无缝转换数据库属性、父子关系、文档标题与修改时间至扁平化 YAML Frontmatter，支持任意 Markdown 工具查看。",
    f2b1: "包含 notion_id / lark_id / inon_id",
    f2b2: "保留原文 URL 资源溯源链接",
    f2b3: "完全摆脱私有格式绑定",
    f3Title: "Claude Code Skills 原生集成",
    f3Desc: "开箱即用 4 大 Claude Agent 技能 (okfa-init, okfa-sync-notion, okfa-sync-lark, okfa-shot)，让 AI 助手自由操作同步与检索。",
    f3b1: "免配置直接调用 CLI 命令行",
    f3b2: "可配置定时 Schedule 任务模板",
    f3b3: "支持 Agent 自动知识库构建",
    f4Title: "okfa shot 高性能检索引擎",
    f4Desc: "专为 Agent 与开发者设计的本地检索引擎。集成 ripgrep 极速按属性、标题、全文检索与批量替换。",
    f4b1: "类 .gitignore 规则过滤",
    f4b2: "正则与全文高亮匹配",
    f4b3: "毫秒级定位目标 Markdown",

    // Architecture
    archBadge: "架构映射逻辑",
    archTitle: "云端原生字段 ➔ OKF YAML 映射",
    archSub: "无缝解构 Notion 与 飞书的原生文档结构，平铺为清晰规范的 YAML 标头与标准 Markdown 文本。",
    tabNotion: "Notion 映射规则",
    tabLark: "飞书 Lark 映射规则",
    tabSkills: "AI Agent Skills",
    notionTitle: "Notion 字段 ➔ OKF YAML 规范",
    notionDesc: "将 Notion API 返回的原始 json 扁平化归档，保留唯一 notion_id 与时间戳，Database Properties 自动存入 properties 对象中。",
    larkTitle: "飞书 Lark 字段 ➔ OKF 对称映射",
    larkDesc: "飞书文档字段映射逻辑完全对称，对应唯一标识为 lark_id 与 lark_parent_id。",
    skillsTitle: "Claude Code Agent Skills 原生支持",

    // FAQ & Footer
    faqTitle: "常见问题 (FAQ)",
    faqSub: "了解更多关于 OKF 开放格式与数据安全的常见疑问。",
    faq1q: "okf-anything 会修改或删除我在 Notion / 飞书 上的云端原文档吗？",
    faq1a: "绝对不会！okf-anything 采用严格的只读策略（Read-Only Mode）。工具仅拉取云端数据落盘为本地 Markdown，绝不调用 Notion 或 飞书 的任何写数据与删除接口。",
    faq2q: "如果在本地重命名或拖拽了 Markdown 文件的目录位置，再次同步会重复拉取吗？",
    faq2a: "不会！okf-anything 基于 UUID (notion_id / lark_id / inon_id) 组合作为全局唯一标识。只要文件内的 YAML Frontmatter 标头包含对应 ID，无论您在本地磁盘如何调整文件夹结构，同步逻辑都能精准比对最后编辑时间，不重复拉取。",
    faq3q: "默认本地工作区存储在什么位置？如何修改？",
    faq3a: "默认存储路径为 ~/iNon。您可以在全局配置文件 ~/.okfa/config.yaml 中随时自定义修改为任意本地目录（例如 ~/Documents/OKF-Knowledge）。",
    faq4q: "如何配合 Claude Code 与 AI Agent 使用？",
    faq4a: "项目根目录下的 skills/ 包含 okfa-init, okfa-sync-notion, okfa-sync-lark, okfa-shot 四大标准 Agent 技能。AI 助手可以自动感知并帮你按需执行同步、搜寻与总结。",
    builtFor: "Built for data sovereignty",
  },
  en: {
    // Header
    okfSub: "Open Knowledge Format",
    navFeatures: "01. Features",
    navDemo: "02. Live Terminal",
    navArchitecture: "03. OKF Arch",
    navSkills: "04. AI Agent",
    navFaq: "05. FAQ",
    copyCli: "CLI Copied",
    themeVintage: "Vintage",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",

    // Hero
    badgeOkf: "Open Knowledge Format",
    heroTitleLine1: "Escape Cloud Lock-in.",
    heroTitleLine2: "Reclaim Data Sovereignty.",
    heroSubtitle:
      "okf-anything incrementally pulls Notion & Lark documents into a local OKF Markdown workspace while preserving YAML metadata and hierarchy. Fully integrated with AI Agents & Claude Code Skills.",
    tryOnline: "Try okfa Online",
    bulletReadOnly: "Read-Only & Safe",
    bulletSync: "UUID Idempotent Sync",
    bulletLocalDir: "Flexible Local Folders",
    diagramTitle: "OKF Streaming Architecture",
    readOnlyBadge: "Read-Only Mode",
    stepCloudTitle: "1. Cloud Data Source (Notion / Lark)",
    stepCloudSub: "Fetch Pages, Databases, Blocks via Read-Only API",
    stepMatch: "UUID Idempotent Match",
    stepLocalTitle: "2. Local OKF Markdown Workspace",
    stepLocalSub: "YAML Frontmatter + Plain Markdown, Folder-reorg safe",

    // Terminal Demo
    demoBadge: "Live Terminal Simulation",
    demoTitle: "Experience okfa Streaming Sync",
    demoSub: "Click commands below to simulate streaming cloud documents into local OKF Markdown workspace.",
    runCommand: "Run Command",
    readOnlyAuth: "Read-Only Grant",
    yamlHeader: "YAML Frontmatter Header",

    // Comparison
    compBadge: "Why Choose OKF Anything",
    compTitle: "Traditional SaaS vs OKF Open Format",
    compSub: "Escape export limitations, rate-limiting, and vendor lock-in. Bring your personal & team knowledge home.",
    saasTitle: "Traditional SaaS Cloud Base",
    saasTag: "Vendor Lock-in",
    saas1Bold: "Black-box Data Lock-in: ",
    saas1Text: "Data locked in cloud servers; subject to outage or service expiration.",
    saas2Bold: "Messed up Export Format: ",
    saas2Text: "Manual exports lose database properties, nested hierarchies, and links.",
    saas3Bold: "Incompatible with AI Agents: ",
    saas3Text: "Restricted APIs & rate limits prevent local AI CLI search.",
    saas4Bold: "Rigid Directory Structure: ",
    saas4Text: "Moving folders in cloud breaks external links and local scripts.",

    okfTitle: "OKF Anything Local Workspace",
    okfTag: "Open & Private",
    okf1Bold: "Standard Plain Markdown: ",
    okf1Text: "Zero vendor formats. Open directly in Obsidian, VSCode, iNon, or any tool.",
    okf2Bold: "UUID Idempotent Sync: ",
    okf2Text: "notion_id & lark_id stored in YAML header. Reorganize folders safely.",
    okf3Bold: "Native AI Agent Skills: ",
    okf3Text: "Built-in 4 Claude Code Skills and high-speed okfa shot CLI search.",
    okf4Bold: "Strict Read-Only Guarantee: ",
    okf4Text: "Only pulls data locally. Never calls write/delete APIs on remote cloud.",

    // Feature Showcase
    featBadge: "Capabilities Matrix",
    featTitle: "An Engine Built for Data Sovereignty",
    featSub: "From streaming writes to native AI Agent integration, every detail is engineered for speed and freedom.",
    f1Title: "Dual Platform Sync Engine",
    f1Desc: "Supports Notion & Lark (Feishu). Idempotent diffing using UUID + last_edited_time avoids full re-fetches.",
    f1b1: "Streaming write (Ctrl-C safe)",
    f1b2: "Conflict resolution suffixing",
    f1b3: "Read-only cloud protection",
    f2Title: "OKF Standard Markdown",
    f2Desc: "Converts database fields, parent-child relations, and timestamps into flat YAML Frontmatter.",
    f2b1: "Contains notion_id / lark_id / inon_id",
    f2b2: "Preserves origin URL resources",
    f2b3: "Zero proprietary formats",
    f3Title: "Claude Code Skills Native",
    f3Desc: "Out-of-the-box 4 Claude Agent Skills (okfa-init, okfa-sync-notion, okfa-sync-lark, okfa-shot).",
    f3b1: "Zero-config CLI invocation",
    f3b2: "Schedulable cron templates",
    f3b3: "Agent auto-knowledge building",
    f4Title: "okfa shot High-speed Search",
    f4Desc: "Local search engine for developers & agents. Integrated ripgrep for properties, titles, and full text.",
    f4b1: ".gitignore style filtering",
    f4b2: "Regex & full-text match",
    f4b3: "Sub-millisecond Markdown lookup",

    // Architecture
    archBadge: "Architecture Mappings",
    archTitle: "Cloud Native Fields ➔ OKF YAML Mapping",
    archSub: "Deconstructs Notion & Lark structures into clean YAML headers and standard Markdown text.",
    tabNotion: "Notion Mapping Rules",
    tabLark: "Lark Mapping Rules",
    tabSkills: "AI Agent Skills",
    notionTitle: "Notion Fields ➔ OKF YAML Spec",
    notionDesc: "Flattens Notion API response, preserving notion_id, timestamps, and database properties.",
    larkTitle: "Lark Fields ➔ OKF Symmetric Mapping",
    larkDesc: "Symmetric mapping for Lark docx, keeping lark_id and lark_parent_id.",
    skillsTitle: "Claude Code Agent Skills Integration",

    // FAQ & Footer
    faqTitle: "Frequently Asked Questions (FAQ)",
    faqSub: "Learn more about OKF format and data security.",
    faq1q: "Will okf-anything modify or delete my documents on Notion or Lark?",
    faq1a: "Absolutely not! okf-anything operates strictly in Read-Only Mode. It only reads cloud data and writes Markdown locally.",
    faq2q: "Will renaming or moving local Markdown files trigger duplicate re-downloads?",
    faq2a: "No! okf-anything uses a composite UUID (notion_id / lark_id / inon_id) stored in the YAML header to match documents regardless of local file paths.",
    faq3q: "Where is the default workspace saved?",
    faq3a: "The default path is ~/iNon. You can change it anytime in ~/.okfa/config.yaml.",
    faq4q: "How do I use it with Claude Code & AI Agents?",
    faq4a: "The project's skills/ directory contains okfa-init, okfa-sync-notion, okfa-sync-lark, and okfa-shot skills.",
    builtFor: "Built for data sovereignty",
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (lang: Locale) => void;
  t: (key: keyof typeof translations["zh"]) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh");

  // Load language preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("okfa_locale") as Locale;
    if (saved === "zh" || saved === "en") {
      setLocale(saved);
    }
  }, []);

  const changeLocale = (lang: Locale) => {
    setLocale(lang);
    localStorage.setItem("okfa_locale", lang);
  };

  const t = (key: keyof typeof translations["zh"]) => {
    return translations[locale][key] || translations["zh"][key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
