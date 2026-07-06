import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OKF Anything — Open Knowledge Format",
  description: "Escape Notion / Lark, sync into a local OKF Markdown knowledge base.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
