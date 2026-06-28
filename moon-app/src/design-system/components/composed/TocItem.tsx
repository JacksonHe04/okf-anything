'use client';

/**
 * TocItem — 右栏「目录」tab 的 heading 项
 * - 优化样式，更明显和易读
 * - 支持 active 状态高亮
 */

import { type ReactNode } from 'react';

export interface TocItemProps {
  depth: number; // 1-6
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
}

export function TocItem({ depth, label, active = false, onClick, icon }: TocItemProps) {
  const cappedDepth = Math.min(Math.max(depth, 1), 6);

  // 根据层级调整样式
  const depthStyles: Record<number, string> = {
    1: 'font-semibold text-[13px]',
    2: 'font-medium text-[12px]',
    3: 'font-normal text-[12px]',
    4: 'font-normal text-[11px]',
    5: 'font-normal text-[11px]',
    6: 'font-normal text-[11px]',
  };

  const stateClasses = active
    ? 'bg-accentMuted text-accent border-l-2 border-accent'
    : 'text-fgSecondary hover:bg-sidebarHoverBg hover:text-fg border-l-2 border-transparent';

  const indentStyles = [
    'pl-3 ml-1',
    'pl-4 ml-3',
    'pl-5 ml-5',
    'pl-6 ml-7',
    'pl-7 ml-9',
    'pl-8 ml-11',
  ];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 w-full text-left py-1.5 px-2 rounded-r transition-all duration-150 select-none font-sans ${depthStyles[cappedDepth]} ${stateClasses}`}
      style={{ paddingLeft: `${12 + (cappedDepth - 1) * 16}px` }}
    >
      {icon && <span className="flex items-center justify-center flex-shrink-0">{icon}</span>}
      <span className="truncate flex-1 leading-snug">{label}</span>
    </button>
  );
}