import type { Metadata } from 'next';
import { ThemeProvider } from '@/design-system/theme';
import { I18nProvider } from '@/lib/i18n';
import '@/design-system/styles/globals.css';

export const metadata: Metadata = {
  title: 'MOONLESS | SAYLESS',
  description: 'ESCAPE / MOON / SHOT — Bye Bye SaaS, Hello OKF',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <I18nProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}