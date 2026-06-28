'use client';

/**
 * Kbd — 键盘快捷键展示（完全重构为 Tailwind CSS）。
 * 用法：<Kbd>⌘ K</Kbd>、<Kbd>Esc</Kbd>
 */

import { type ReactNode } from 'react';

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 font-mono text-[10px] font-medium text-fgMuted bg-appBg border border-borderSubtle border-b-2 rounded-sm leading-none">
      {children}
    </kbd>
  );
}