import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "OKF Anything — 脱离中心化云端锁，重获数据绝对所有权",
  description: "可拉取并增量同步 Notion 与 飞书 Lark 文档，将数据落地至本地 OKF 开放知识格式 Markdown 工作区。绝对只读云端，无缝对接 AI Agent 与 Claude Code Skills。",
  keywords: ["OKF", "OKF Anything", "Notion", "Lark", "飞书", "Markdown", "Knowledge Base", "Claude Code", "RAG", "Data Sovereignty"],
  openGraph: {
    title: "OKF Anything — Open Knowledge Format",
    description: "Escape Notion / Lark. Sync into a local OKF Markdown knowledge base.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem={true}
          themes={["light", "dark", "system"]}
        >
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
