'use client';

/**
 * PropertyRow — 11 字段卡的最小单元（完全重构为 Tailwind CSS）。
 *
 * 布局：icon (左) + 字段名 (左) + 可编辑值 (右)
 * category = 'okf' → contract 色；'notion' → source 色
 */

import { type ReactNode } from 'react';

export interface PropertyRowProps {
  icon: ReactNode;
  name: string;
  value: ReactNode;
  category?: 'okf' | 'notion';
  onClick?: () => void;
  placeholder?: string;
}

export function PropertyRow({
  icon,
  name,
  value,
  category = 'okf',
  onClick,
  placeholder,
}: PropertyRowProps) {
  const hasValue = value !== null && value !== undefined && value !== '';
  const iconColorClass = category === 'okf' ? 'text-contract' : 'text-source';

  return (
    <button
      type="button"
      className="w-full flex items-center gap-2 px-2 py-1 rounded text-sm font-sans text-fg cursor-pointer transition-colors duration-120 hover:bg-sidebarHoverBg text-left bg-transparent border-none"
      onClick={onClick}
    >
      <span className={`inline-flex items-center justify-center w-4 h-4 flex-shrink-0 ${iconColorClass} [&>svg]:w-3.5 [&>svg]:h-3.5`}>
        {icon}
      </span>
      <span className="shrink-0 text-fgSecondary text-xs min-w-[60px]">{name}</span>
      <span className={`flex-1 min-w-0 text-right truncate ${hasValue ? 'text-fg' : 'text-fgMuted italic'}`}>
        {hasValue ? value : placeholder ?? '点击编辑'}
      </span>
    </button>
  );
}
