"use client";

import React, { useState } from "react";
import { ChevronDown, Terminal, Heart, Shield, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function FooterSection() {
  const { t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    { q: t("faq1q"), a: t("faq1a") },
    { q: t("faq2q"), a: t("faq2a") },
    { q: t("faq3q"), a: t("faq3a") },
    { q: t("faq4q"), a: t("faq4a") },
  ];

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--background)]">
      {/* FAQ Section */}
      <div id="faq" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 border-b border-[var(--border)]">
        <div className="text-center mb-10">
          <h2 className="font-sans text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            {t("faqTitle")}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t("faqSub")}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between p-5 text-left font-sans text-base font-bold text-[var(--foreground)] cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-5 w-5 text-[var(--muted)] transition-transform duration-200 ${
                    openFaq === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 font-sans text-sm text-[var(--muted)] leading-relaxed border-t border-[var(--border)]/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-mono font-bold text-sm">
              OKF
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">
                OKF Anything
              </span>
              <span className="font-mono text-xs text-[var(--muted)]">
                Escape Notion / Lark, sync into a local OKF Markdown knowledge base.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs text-[var(--muted)]">
            <a
              href="https://github.com/JacksonHe04/okf-anything"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--foreground)] flex items-center gap-1"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg> GitHub
            </a>
            <a href="#features" className="hover:text-[var(--foreground)]">
              {t("navFeatures")}
            </a>
            <a href="#demo" className="hover:text-[var(--foreground)]">
              {t("navDemo")}
            </a>
            <a href="#architecture" className="hover:text-[var(--foreground)]">
              {t("navArchitecture")}
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--border)] pt-8 flex flex-col sm:flex-row items-center justify-between font-mono text-xs text-[var(--muted)] gap-4">
          <div>© 2026 OKF Anything. Open Knowledge Format. MIT License.</div>
          <div className="flex items-center gap-1">
            {t("builtFor")} <Heart className="h-3.5 w-3.5 text-red-500 fill-current inline" />
          </div>
        </div>
      </div>
    </footer>
  );
}
