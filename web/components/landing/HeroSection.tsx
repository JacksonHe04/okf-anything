"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Terminal,
  Shield,
  Zap,
  Check,
  Copy,
  FolderTree,
  Database,
  Lock,
  Layers,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function HeroSection() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText("npm i -g @inon-ai/okf-anything");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 border-b border-[var(--border)] bg-dot-grid">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1.5 font-mono text-xs font-semibold text-orange-600 dark:text-orange-400"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>{t("badgeOkf")}</span>
            </motion.div>

            {/* Main Slogan */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-sans text-4xl font-black tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl leading-[1.08]"
            >
              {t("heroTitleLine1")}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-red-600">
                {t("heroTitleLine2")}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 max-w-2xl font-sans text-base text-[var(--muted)] sm:text-lg leading-relaxed"
            >
              {t("heroSubtitle")}
            </motion.p>

            {/* Command Box CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto"
            >
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 font-mono text-sm font-semibold text-[var(--foreground)] shadow-sm">
                <Terminal className="h-4 w-4 text-[var(--primary)] shrink-0" />
                <span className="select-all">npm i -g @inon-ai/okf-anything</span>
                <button
                  onClick={copyCommand}
                  className="rounded-md p-1.5 hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Key Value Bullets */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-[var(--border)] w-full font-mono text-xs text-[var(--muted)]"
            >
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-500" />
                <span>{t("bulletReadOnly")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>{t("bulletSync")}</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-blue-500" />
                <span>{t("bulletLocalDir")}</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Visual Infographic Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl overflow-hidden">
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/10 blur-3xl pointer-events-none" />

              {/* Title Header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-5">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                  <Database className="h-4 w-4 text-[var(--primary)]" />
                  <span>{t("diagramTitle")}</span>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {t("readOnlyBadge")}
                </span>
              </div>

              {/* Diagram Flow */}
              <div className="space-y-4 font-mono text-xs">
                {/* Step 1: Cloud */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {t("stepCloudTitle")}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--muted)] font-sans">
                    {t("stepCloudSub")}
                  </p>
                </div>

                {/* Step 2: Sync Engine */}
                <div className="relative flex items-center justify-center py-1">
                  <div className="h-full w-px bg-gradient-to-b from-amber-500 to-orange-500 absolute" />
                  <span className="z-10 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] px-2.5 py-0.5 text-[10px] font-bold uppercase">
                    {t("stepMatch")}
                  </span>
                </div>

                {/* Step 3: Local OKF Workspace */}
                <div className="rounded-xl border-2 border-[var(--primary)] bg-[var(--background)] p-3.5 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[var(--foreground)]">
                      {t("stepLocalTitle")}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-bold">
                      ~/iNon
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-[var(--muted)] font-mono">
                    <div className="flex items-center gap-1 text-[var(--foreground)]">
                      <Layers className="h-3.5 w-3.5 text-[var(--primary)]" />
                      <span>{t("stepLocalSub")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
