import { create } from "zustand";

export type CommandType = "notion" | "lark" | "shot";

export interface LogLine {
  id: string;
  type: "input" | "info" | "success" | "warn" | "markdown";
  text: string;
  timestamp?: string;
}

export interface DocPreview {
  filename: string;
  platform: "Notion" | "Lark";
  title: string;
  uuid: string;
  lastEdited: string;
  content: string;
}

interface TerminalState {
  activeCommand: CommandType;
  isRunning: boolean;
  logs: LogLine[];
  activeDoc: DocPreview | null;
  runCommand: (type: CommandType) => void;
  setActiveCommand: (type: CommandType) => void;
}

const NOTION_DOC: DocPreview = {
  filename: "notion/Q3-Product-Roadmap.md",
  platform: "Notion",
  title: "Q3 架构设计与平台迁移路线",
  uuid: "notion_id: 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  lastEdited: "2026-07-06T09:30:00.000Z",
  content: `---
inon_id: 9b8a7c6f-5e4d-3c2b-1a0f-9e8d7c6b5a4f
notion_id: 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d
title: "Q3 架构设计与平台迁移路线"
resource: "https://notion.so/workspace/1a2b3c4d"
created_time: "2026-06-01T10:00:00.000Z"
last_edited_time: "2026-07-06T09:30:00.000Z"
timestamp: "2026-07-06T09:30:00.000Z"
properties:
  Status: "In Progress"
  Owner: "Jackson He"
---

# Q3 架构设计与平台迁移路线

## 核心目标
1. 脱离 Notion / 飞书云端数据库锁定。
2. 增量拉取落地至本地 OKF Markdown。
3. 提供原生 CLI 与 Agent Skill。
`,
};

const LARK_DOC: DocPreview = {
  filename: "lark/团队知识库-技术规范.md",
  platform: "Lark",
  title: "飞书团队知识库 - OKF 增量同步规范",
  uuid: "lark_id: docx_9876543210fe",
  lastEdited: "2026-07-06T08:15:00.000Z",
  content: `---
inon_id: 3c2b1a0f-9e8d-7c6b-5a4f-9b8a7c6f5e4d
lark_id: docx_9876543210fe
title: "飞书团队知识库 - OKF 增量同步规范"
resource: "https://feishu.cn/docx/docx_9876543210fe"
created_time: "2026-05-12T14:20:00.000Z"
last_edited_time: "2026-07-06T08:15:00.000Z"
timestamp: "2026-07-06T08:15:00.000Z"
properties:
  Department: "Engineering"
  Level: "Public"
---

# 飞书团队知识库 - OKF 增量同步规范

## 增量流式落盘
- 每次同步匹配 \`lark_id\` 与 \`last_edited_time\`。
- 重名自动追加 \`-1\`, \`-2\` 等后缀。
- 绝不调用写 API，保证云端零污染。
`,
};

const SHOT_DOC: DocPreview = {
  filename: "shot_results/search-query.json",
  platform: "Notion",
  title: "okfa shot 全局属性与关键词检索",
  uuid: "okfa shot --query 'OKF'",
  lastEdited: "2026-07-06T09:33:00.000Z",
  content: `[
  {
    "file": "~/iNon/notion/Q3-Product-Roadmap.md",
    "line": 12,
    "match": "脱离 Notion / 飞书云端数据库锁定。"
  },
  {
    "file": "~/iNon/lark/团队知识库-技术规范.md",
    "line": 14,
    "match": "每次同步匹配 lark_id 与 last_edited_time。"
  }
]`,
};

export const useTerminalStore = create<TerminalState>((set, get) => ({
  activeCommand: "notion",
  isRunning: false,
  logs: [
    { id: "1", type: "input", text: "$ okfa sync notion" },
    { id: "2", type: "info", text: "[OKFA Engine] Loading configuration from ~/.okfa/config.yaml..." },
    { id: "3", type: "info", text: "[Notion Adapter] Fetching updated pages since 2026-07-01..." },
    { id: "4", type: "success", text: "[OKF Sync] Stream writing -> ~/iNon/notion/Q3-Product-Roadmap.md" },
    { id: "5", type: "markdown", text: "✓ Sync completed: 1 page updated, 0 deleted (read-only mode)" },
  ],
  activeDoc: NOTION_DOC,

  setActiveCommand: (cmd) => {
    if (get().isRunning) return;
    let initialLogs: LogLine[] = [];
    let doc: DocPreview = NOTION_DOC;

    if (cmd === "notion") {
      initialLogs = [
        { id: "1", type: "input", text: "$ okfa sync notion" },
        { id: "2", type: "info", text: "[OKFA Engine] Target workspace: ~/iNon" },
        { id: "3", type: "info", text: "[Notion] Connecting to Notion API (Read-Only)..." },
        { id: "4", type: "success", text: "[OKF] Written ~/iNon/notion/Q3-Product-Roadmap.md" },
      ];
      doc = NOTION_DOC;
    } else if (cmd === "lark") {
      initialLogs = [
        { id: "1", type: "input", text: "$ okfa sync lark" },
        { id: "2", type: "info", text: "[OKFA Engine] Target workspace: ~/iNon" },
        { id: "3", type: "info", text: "[Lark Adapter] Pulling Lark docx workspace..." },
        { id: "4", type: "success", text: "[OKF] Written ~/iNon/lark/团队知识库-技术规范.md" },
      ];
      doc = LARK_DOC;
    } else {
      initialLogs = [
        { id: "1", type: "input", text: "$ okfa shot search --query 'OKF'" },
        { id: "2", type: "info", text: "[okfa shot] Searching frontmatter & body with ripgrep..." },
        { id: "3", type: "success", text: "[okfa shot] Found 2 matching documents in 14ms." },
      ];
      doc = SHOT_DOC;
    }

    set({ activeCommand: cmd, logs: initialLogs, activeDoc: doc });
  },

  runCommand: (cmd) => {
    if (get().isRunning) return;
    set({ isRunning: true });

    get().setActiveCommand(cmd);

    setTimeout(() => {
      set((state) => ({
        logs: [
          ...state.logs,
          {
            id: Date.now().toString(),
            type: "success",
            text: `[OKF Sync] Operation completed successfully in ${Math.floor(Math.random() * 200 + 80)}ms!`,
          },
        ],
        isRunning: false,
      }));
    }, 800);
  },
}));
