import type { Metadata } from 'next';
import { ThemeProvider } from '@/design-system/theme';
import { I18nProvider } from '@/lib/i18n';
import '@/design-system/styles/globals.css';

export const metadata: Metadata = {
  title: 'MOONLESS — 本地编辑器',
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
        <I18nProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}