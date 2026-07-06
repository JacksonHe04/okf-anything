"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Cpu, Code2, Sparkles, Terminal, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function ArchitectureSection() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"notion" | "lark" | "skills">(
    "notion"
  );

  return (
    <>
      {/* OKF Mappings & Architecture Section */}
      <section id="architecture" className="w-full py-16 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 py-1 font-mono text-xs font-semibold text-[var(--muted)]">
              <Layers className="h-3.5 w-3.5 text-[var(--primary)]" /> {t("archBadge")}
            </div>
            <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
              {t("archTitle")}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)] max-w-2xl mx-auto font-sans">
              {t("archSub")}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--card)] p-1.5 font-mono text-xs">
              <button
                onClick={() => setActiveTab("notion")}
                className={`rounded-lg px-4 py-2 font-semibold transition-all cursor-pointer ${
                  activeTab === "notion"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {t("tabNotion")}
              </button>
              <button
                onClick={() => setActiveTab("lark")}
                className={`rounded-lg px-4 py-2 font-semibold transition-all cursor-pointer ${
                  activeTab === "lark"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {t("tabLark")}
              </button>
              <button
                onClick={() => setActiveTab("skills")}
                className={`rounded-lg px-4 py-2 font-semibold transition-all cursor-pointer ${
                  activeTab === "skills"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {t("tabSkills")}
              </button>
            </div>
          </div>

          {/* Content Viewer */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-xl">
            <AnimatePresence mode="wait">
              {activeTab === "notion" && (
                <motion.div
                  key="notion"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-8 md:grid-cols-2 items-center"
                >
                  <div>
                    <h3 className="font-sans text-xl font-bold text-[var(--foreground)] mb-3">
                      {t("notionTitle")}
                    </h3>
                    <p className="font-sans text-sm text-[var(--muted)] mb-6 leading-relaxed">
                      {t("notionDesc")}
                    </p>

                    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 font-mono text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                            <th className="pb-2 font-bold">Notion Raw Field</th>
                            <th className="pb-2 font-bold">OKF Field</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                          <tr>
                            <td className="py-2">id</td>
                            <td className="py-2 text-[var(--primary)] font-bold">notion_id</td>
                          </tr>
                          <tr>
                            <td className="py-2">title</td>
                            <td className="py-2 text-[var(--primary)] font-bold">title</td>
                          </tr>
                          <tr>
                            <td className="py-2">url</td>
                            <td className="py-2 text-[var(--primary)] font-bold">resource</td>
                          </tr>
                          <tr>
                            <td className="py-2">lastEditedTime</td>
                            <td className="py-2 text-[var(--primary)] font-bold">last_edited_time / timestamp</td>
                          </tr>
                          <tr>
                            <td className="py-2">parent.id</td>
                            <td className="py-2 text-[var(--primary)] font-bold">notion_parent_id</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-800 bg-[#0d1117] p-4 text-gray-200 font-mono text-xs overflow-x-auto shadow-inner">
                    <div className="text-amber-400 font-bold mb-2">
                      # OKF Markdown Sample (~/iNon/notion/page.md)
                    </div>
                    <pre className="text-gray-300">
{`---
inon_id: 9b8a7c6f-5e4d-3c2b-1a0f-9e8d7c6b5a4f
notion_id: 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d
title: "OKF Specification"
resource: "https://notion.so/1a2b3c4d"
created_time: "2026-06-01T10:00:00.000Z"
last_edited_time: "2026-07-06T09:30:00.000Z"
timestamp: "2026-07-06T09:30:00.000Z"
properties:
  Tags: ["Documentation", "OKF"]
---

# OKF Specification

Data stored in local \`~/iNon\` directory.`}
                    </pre>
                  </div>
                </motion.div>
              )}

              {activeTab === "lark" && (
                <motion.div
                  key="lark"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-8 md:grid-cols-2 items-center"
                >
                  <div>
                    <h3 className="font-sans text-xl font-bold text-[var(--foreground)] mb-3">
                      {t("larkTitle")}
                    </h3>
                    <p className="font-sans text-sm text-[var(--muted)] mb-6 leading-relaxed">
                      {t("larkDesc")}
                    </p>

                    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 font-mono text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                            <th className="pb-2 font-bold">Lark Raw Field</th>
                            <th className="pb-2 font-bold">OKF Field</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                          <tr>
                            <td className="py-2">document_id / token</td>
                            <td className="py-2 text-[var(--primary)] font-bold">lark_id</td>
                          </tr>
                          <tr>
                            <td className="py-2">title</td>
                            <td className="py-2 text-[var(--primary)] font-bold">title</td>
                          </tr>
                          <tr>
                            <td className="py-2">url</td>
                            <td className="py-2 text-[var(--primary)] font-bold">resource</td>
                          </tr>
                          <tr>
                            <td className="py-2">edit_time</td>
                            <td className="py-2 text-[var(--primary)] font-bold">last_edited_time</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-800 bg-[#0d1117] p-4 text-gray-200 font-mono text-xs overflow-x-auto shadow-inner">
                    <div className="text-emerald-400 font-bold mb-2">
                      # Lark OKF Markdown Sample (~/iNon/lark/docx.md)
                    </div>
                    <pre className="text-gray-300">
{`---
inon_id: 3c2b1a0f-9e8d-7c6b-5a4f-9b8a7c6f5e4d
lark_id: docx_9876543210fe
title: "Lark Team Document"
resource: "https://feishu.cn/docx/docx_9876543210fe"
last_edited_time: "2026-07-06T08:15:00.000Z"
---

# Lark Team Document

Streaming incremental sync enabled!`}
                    </pre>
                  </div>
                </motion.div>
              )}

              {activeTab === "skills" && (
                <motion.div
                  key="skills"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <h3 className="font-sans text-xl font-bold text-[var(--foreground)]">
                    {t("skillsTitle")}
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-2">
                      <div className="font-bold text-[var(--primary)]">1. okfa-init</div>
                      <p className="text-[var(--muted)] font-sans text-xs">
                        Init `.okfa/config.yaml` &amp; default `~/iNon` workspace.
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-2">
                      <div className="font-bold text-amber-500">2. okfa-sync-notion</div>
                      <p className="text-[var(--muted)] font-sans text-xs">
                        Notion API incremental pull &amp; Markdown streaming.
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-2">
                      <div className="font-bold text-emerald-500">3. okfa-sync-lark</div>
                      <p className="text-[var(--muted)] font-sans text-xs">
                        Lark API incremental pull &amp; Markdown streaming.
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-2">
                      <div className="font-bold text-blue-500">4. okfa-shot</div>
                      <p className="text-[var(--muted)] font-sans text-xs">
                        Fast ripgrep search, listing, and batch replace.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Dedicated AI Agent Skills Section Anchor */}
      <section id="skills" className="w-full py-16 border-b border-[var(--border)] bg-dot-grid">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Cpu className="h-3.5 w-3.5" /> AI Agent Skills &amp; Claude Code
            </div>
            <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
              {t("skillsTitle")}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)] max-w-2xl mx-auto font-sans">
              内置 4 大 Claude Agent 代码技能（Skills），让 AI 助手能够自动感知并操控您的 OKF 知识库。
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-md">
                  okfa-init
                </span>
                <Sparkles className="h-4 w-4 text-[var(--primary)]" />
              </div>
              <h4 className="font-sans text-base font-bold text-[var(--foreground)]">工作区初始化</h4>
              <p className="font-sans text-xs text-[var(--muted)] leading-relaxed">
                自动配置 <code className="rounded bg-[var(--border)] px-1 py-0.5 font-mono text-[10px]">.okfa/config.yaml</code> 校验规则与默认 <code className="rounded bg-[var(--border)] px-1 py-0.5 font-mono text-[10px]">~/iNon</code> 知识路径。
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md">
                  okfa-sync-notion
                </span>
                <Terminal className="h-4 w-4 text-amber-500" />
              </div>
              <h4 className="font-sans text-base font-bold text-[var(--foreground)]">Notion 增量拉取</h4>
              <p className="font-sans text-xs text-[var(--muted)] leading-relaxed">
                自动提取 Notion 页面、数据库与 Block，流式渲染落盘为 OKF 格式。
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                  okfa-sync-lark
                </span>
                <Terminal className="h-4 w-4 text-emerald-500" />
              </div>
              <h4 className="font-sans text-base font-bold text-[var(--foreground)]">飞书 Lark 同步</h4>
              <p className="font-sans text-xs text-[var(--muted)] leading-relaxed">
                增量解析飞书团队知识文档，生成干净统一的本地 Markdown。
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md">
                  okfa-shot
                </span>
                <Code2 className="h-4 w-4 text-blue-500" />
              </div>
              <h4 className="font-sans text-base font-bold text-[var(--foreground)]">Agent 检索与替换</h4>
              <p className="font-sans text-xs text-[var(--muted)] leading-relaxed">
                基于 ripgrep 实现 Frontmatter 属性过滤、全局全文匹配与批量更新。
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
