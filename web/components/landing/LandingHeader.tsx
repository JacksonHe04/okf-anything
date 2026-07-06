"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Terminal,
  Sun,
  Moon,
  Laptop,
  Check,
  Copy,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  Globe,
} from "lucide-react";
import { useI18n, type Locale } from "@/lib/i18n";

export function LandingHeader() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyCommand = () => {
    navigator.clipboard.writeText("npm i -g @inon-ai/okf-anything");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleLanguage = (lang: Locale) => {
    setLocale(lang);
    setLangOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md select-none transition-colors duration-300">
      {/* Top Accent Strip */}
      <div className="h-[3px] w-full bg-gradient-to-r from-orange-600 via-amber-500 to-red-600" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            className="group flex items-center gap-2.5 font-bold tracking-tight text-[var(--foreground)] whitespace-nowrap"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-base font-extrabold leading-none tracking-wider uppercase whitespace-nowrap">
                OKF <span className="text-[var(--primary)]">Anything</span>
              </span>
              <span className="font-mono text-[10px] leading-tight text-[var(--muted)] tracking-wider whitespace-nowrap">
                {t("okfSub")}
              </span>
            </div>
          </a>

          <span className="hidden lg:inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 whitespace-nowrap">
            <Sparkles className="h-3 w-3" /> v0.1.4
          </span>
        </div>

        {/* Navigation Items - Horizontal & Non-wrapping */}
        <nav className="hidden lg:flex items-center gap-5 font-mono text-xs uppercase tracking-wider text-[var(--muted)] whitespace-nowrap shrink-0">
          <a href="#features" className="transition-colors hover:text-[var(--foreground)] whitespace-nowrap">
            {t("navFeatures")}
          </a>
          <a href="#demo" className="transition-colors hover:text-[var(--foreground)] whitespace-nowrap">
            {t("navDemo")}
          </a>
          <a href="#architecture" className="transition-colors hover:text-[var(--foreground)] whitespace-nowrap">
            {t("navArchitecture")}
          </a>
          <a href="#skills" className="transition-colors hover:text-[var(--foreground)] whitespace-nowrap">
            {t("navSkills")}
          </a>
          <a href="#faq" className="transition-colors hover:text-[var(--foreground)] whitespace-nowrap">
            {t("navFaq")}
          </a>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 font-mono text-xs font-semibold text-[var(--foreground)] hover:border-[var(--muted)] transition-all cursor-pointer whitespace-nowrap"
            >
              <Globe className="h-3.5 w-3.5 text-[var(--muted)]" />
              <span>{locale === "zh" ? "中文" : "EN"}</span>
              <ChevronDown className="h-3 w-3 text-[var(--muted)]" />
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-28 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-xl z-50 font-mono text-xs">
                <button
                  onClick={() => toggleLanguage("zh")}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-semibold text-[var(--foreground)] hover:bg-[var(--background)] cursor-pointer whitespace-nowrap"
                >
                  <span>中文</span>
                  {locale === "zh" && <Check className="h-3.5 w-3.5 text-[var(--primary)]" />}
                </button>
                <button
                  onClick={() => toggleLanguage("en")}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-semibold text-[var(--foreground)] hover:bg-[var(--background)] cursor-pointer whitespace-nowrap"
                >
                  <span>English</span>
                  {locale === "en" && <Check className="h-3.5 w-3.5 text-[var(--primary)]" />}
                </button>
              </div>
            )}
          </div>

          {/* Theme Selector (Light [Vintage Paper] / Dark / System) */}
          <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
            <button
              onClick={() => setTheme("light")}
              title={t("themeLight")}
              className={`rounded p-1.5 transition-all cursor-pointer ${
                mounted && theme === "light"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              title={t("themeDark")}
              className={`rounded p-1.5 transition-all cursor-pointer ${
                mounted && theme === "dark"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Moon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme("system")}
              title={t("themeSystem")}
              className={`rounded p-1.5 transition-all cursor-pointer ${
                mounted && theme === "system"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Laptop className="h-4 w-4" />
            </button>
          </div>

          {/* Fixed-Width Copy NPM Command Button (Text never changes width) */}
          <button
            onClick={copyCommand}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 font-mono text-xs font-semibold text-[var(--foreground)] transition-all hover:border-[var(--primary)] active:scale-95 cursor-pointer whitespace-nowrap"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
            )}
            <span>npm i -g okf-anything</span>
          </button>

          {/* GitHub Repo Link */}
          <a
            href="https://github.com/JacksonHe04/okf-anything"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-[var(--foreground)] px-3.5 py-1.5 font-mono text-xs font-semibold text-[var(--background)] transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
          >
            <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span className="hidden md:inline">GitHub</span>
            <ArrowUpRight className="h-3 w-3 opacity-70 shrink-0" />
          </a>
        </div>
      </div>
    </header>
  );
}
