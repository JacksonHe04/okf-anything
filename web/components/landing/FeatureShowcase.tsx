"use client";

import React from "react";
import {
  RefreshCw,
  FileCode2,
  Cpu,
  Search,
  CheckCircle,
  Zap,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function FeatureShowcase() {
  const { t } = useI18n();

  const features = [
    {
      icon: RefreshCw,
      color: "text-amber-500",
      title: t("f1Title"),
      description: t("f1Desc"),
      bullets: [t("f1b1"), t("f1b2"), t("f1b3")],
    },
    {
      icon: FileCode2,
      color: "text-orange-500",
      title: t("f2Title"),
      description: t("f2Desc"),
      bullets: [t("f2b1"), t("f2b2"), t("f2b3")],
    },
    {
      icon: Cpu,
      color: "text-blue-500",
      title: t("f3Title"),
      description: t("f3Desc"),
      bullets: [t("f3b1"), t("f3b2"), t("f3b3")],
    },
    {
      icon: Search,
      color: "text-emerald-500",
      title: t("f4Title"),
      description: t("f4Desc"),
      bullets: [t("f4b1"), t("f4b2"), t("f4b3")],
    },
  ];

  return (
    <section id="features" className="w-full py-16 border-b border-[var(--border)] bg-dot-grid">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3.5 py-1 font-mono text-xs font-semibold text-[var(--primary)]">
            <Zap className="h-3.5 w-3.5" /> {t("featBadge")}
          </div>
          <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
            {t("featTitle")}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-2xl mx-auto font-sans">
            {t("featSub")}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="mb-4 inline-flex rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 shadow-xs">
                    <Icon className={`h-6 w-6 ${feat.color}`} />
                  </div>
                  <h3 className="font-sans text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="mt-2 font-sans text-xs text-[var(--muted)] leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <ul className="mt-6 pt-4 border-t border-[var(--border)] space-y-2 font-mono text-[11px] text-[var(--foreground)]/80">
                  {feat.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
