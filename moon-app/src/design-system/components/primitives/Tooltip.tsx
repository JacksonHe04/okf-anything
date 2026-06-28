'use client';

/**
 * Tooltip — 简易 tooltip（完全重构为 Tailwind CSS，使用 group/group-hover 特性）。
 */

import { type ReactNode } from 'react';

export interface TooltipProps {
  label: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
}

export function Tooltip({ label, side = 'bottom', children }: TooltipProps) {
  const positionClasses = (() => {
    switch (side) {
      case 'top':
        return 'absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 origin-bottom';
      case 'left':
        return 'absolute right-full top-1/2 -translate-y-1/2 mr-1.5 origin-left';
      case 'right':
        return 'absolute left-full top-1/2 -translate-y-1/2 ml-1.5 origin-right';
      default: // bottom
        return 'absolute top-full left-1/2 -translate-x-1/2 mt-1.5 origin-top';
    }
  })();

  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={`${positionClasses} absolute z-50 px-2 py-1 bg-fg text-fgInverse font-sans text-[11px] leading-tight rounded whitespace-nowrap pointer-events-none opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150`}
      >
        {label}
      </span>
    </span>
  );
}