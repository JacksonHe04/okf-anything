"use client";

import React from "react";
import {
  XCircle,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function ComparisonSection() {
  const { t } = useI18n();

  return (
    <section className="w-full py-16 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 py-1 font-mono text-xs font-semibold text-[var(--muted)]">
            <Unlock className="h-3.5 w-3.5 text-[var(--primary)]" /> {t("compBadge")}
          </div>
          <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
            {t("compTitle")}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-2xl mx-auto font-sans">
            {t("compSub")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Traditional SaaS Card */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-red-500/10 p-2 text-red-500">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="font-sans text-xl font-bold text-[var(--foreground)]">
                  {t("saasTitle")}
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-red-500 uppercase">
                {t("saasTag")}
              </span>
            </div>

            <ul className="space-y-4 font-sans text-sm text-[var(--foreground)]/80">
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--foreground)]">{t("saas1Bold")}</strong>
                  {t("saas1Text")}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--foreground)]">{t("saas2Bold")}</strong>
                  {t("saas2Text")}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--foreground)]">{t("saas3Bold")}</strong>
                  {t("saas3Text")}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--foreground)]">{t("saas4Bold")}</strong>
                  {t("saas4Text")}
                </div>
              </li>
            </ul>
          </div>

          {/* OKF Anything Card */}
          <div className="rounded-2xl border-2 border-[var(--primary)] bg-[var(--card)] p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-[var(--primary)] p-2 text-[var(--primary-foreground)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-sans text-xl font-bold text-[var(--foreground)]">
                  {t("okfTitle")}
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-500 uppercase">
                {t("okfTag")}
              </span>
            </div>

            <ul className="space-y-4 font-sans text-sm text-[var(--foreground)]">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--primary)]">{t("okf1Bold")}</strong>
                  {t("okf1Text")}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--primary)]">{t("okf2Bold")}</strong>
                  {t("okf2Text")}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--primary)]">{t("okf3Bold")}</strong>
                  {t("okf3Text")}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--primary)]">{t("okf4Bold")}</strong>
                  {t("okf4Text")}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
