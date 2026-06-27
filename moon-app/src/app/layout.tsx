import type { Metadata } from 'next';
import { ThemeProvider } from '@/design-system/theme';
import '@/design-system/styles/globals.css';

export const metadata: Metadata = {
  title: 'MOON — 本地编辑器',
  description: 'ESCAPE / MOON / SHOT — knowledge, no monthly seat fee.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}