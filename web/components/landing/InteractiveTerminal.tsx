"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Play,
  Copy,
  Check,
  FileText,
  Shield,
  FileCode2,
  Cpu,
  RefreshCw,
  Search,
} from "lucide-react";
import { useTerminalStore } from "@/store/useTerminalStore";
import { useI18n } from "@/lib/i18n";

export function InteractiveTerminal() {
  const { t } = useI18n();
  const {
    activeCommand,
    isRunning,
    logs,
    activeDoc,
    runCommand,
    setActiveCommand,
  } = useTerminalStore();
  const [copiedCode, setCopiedCode] = useState(false);

  const copyDoc = () => {
    if (!activeDoc) return;
    navigator.clipboard.writeText(activeDoc.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <section id="demo" className="w-full py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-1 font-mono text-xs font-semibold text-[var(--primary)]">
            <Cpu className="h-3.5 w-3.5" /> {t("demoBadge")}
          </div>
          <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
            {t("demoTitle")}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-2xl mx-auto font-sans">
            {t("demoSub")}
          </p>
        </div>

        {/* Command Tabs */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveCommand("notion")}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-xs font-semibold transition-all cursor-pointer ${
                activeCommand === "notion"
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--muted)]"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>okfa sync notion</span>
            </button>

            <button
              onClick={() => setActiveCommand("lark")}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-xs font-semibold transition-all cursor-pointer ${
                activeCommand === "lark"
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--muted)]"
              }`}
            >
              <FileCode2 className="h-4 w-4" />
              <span>okfa sync lark</span>
            </button>

            <button
              onClick={() => setActiveCommand("shot")}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-xs font-semibold transition-all cursor-pointer ${
                activeCommand === "shot"
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--muted)]"
              }`}
            >
              <Search className="h-4 w-4" />
              <span>okfa shot search</span>
            </button>
          </div>

          <button
            onClick={() => runCommand(activeCommand)}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 font-mono text-xs font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            <span>{t("runCommand")}</span>
          </button>
        </div>

        {/* Terminal & Preview Split Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Terminal Window */}
          <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[#0d1117] text-gray-200 shadow-xl overflow-hidden min-h-[380px]">
            {/* Window Topbar */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#161b22] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 font-mono text-xs font-medium text-gray-400">
                  zsh — okfa CLI
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                <Shield className="h-3 w-3" /> {t("readOnlyAuth")}
              </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-4 font-mono text-xs leading-relaxed space-y-2 overflow-y-auto max-h-[340px]">
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start gap-2"
                  >
                    {log.type === "input" && (
                      <span className="text-emerald-400 font-bold select-none">&gt;</span>
                    )}
                    {log.type === "info" && (
                      <span className="text-blue-400 font-bold select-none">[info]</span>
                    )}
                    {log.type === "success" && (
                      <span className="text-emerald-400 font-bold select-none">[ok]</span>
                    )}
                    {log.type === "markdown" && (
                      <span className="text-amber-400 font-bold select-none">[md]</span>
                    )}
                    <span
                      className={
                        log.type === "input"
                          ? "text-white font-bold"
                          : log.type === "success"
                          ? "text-emerald-300"
                          : log.type === "info"
                          ? "text-gray-300"
                          : "text-amber-200"
                      }
                    >
                      {log.text}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isRunning && (
                <div className="flex items-center gap-2 text-emerald-400 font-mono">
                  <span className="inline-block h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                  <span>Streaming write to disk...</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Generated OKF Document Preview */}
          <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-xl overflow-hidden min-h-[380px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-[var(--primary)]" />
                <span className="font-mono text-xs font-bold text-[var(--foreground)] truncate max-w-[240px]">
                  {activeDoc?.filename}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[var(--primary)]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--primary)] uppercase">
                  {activeDoc?.platform}
                </span>
                <button
                  onClick={copyDoc}
                  title="Copy"
                  className="rounded p-1 text-[var(--muted)] hover:bg-[var(--border)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 p-4 font-mono text-xs leading-relaxed overflow-y-auto max-h-[340px]">
              <div className="rounded border border-[var(--border)] bg-[var(--background)] p-3 mb-3">
                <div className="text-[11px] font-bold text-[var(--primary)] uppercase mb-1">
                  {t("yamlHeader")}
                </div>
                <div className="text-[11px] text-[var(--muted)] space-y-0.5">
                  <div>{activeDoc?.uuid}</div>
                  <div>last_edited_time: {activeDoc?.lastEdited}</div>
                </div>
              </div>

              <pre className="whitespace-pre-wrap font-mono text-xs text-[var(--foreground)]/90 leading-normal">
                {activeDoc?.content}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
