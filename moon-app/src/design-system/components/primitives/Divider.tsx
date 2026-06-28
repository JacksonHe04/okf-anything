'use client';

/**
 * Divider — 水平分割线（完全重构为 Tailwind CSS）。
 */

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export function Divider({ orientation = 'horizontal', spacing = 'md' }: DividerProps) {
  const baseClasses = 'border-none bg-borderSubtle';
  const orientClasses = orientation === 'horizontal' ? 'w-full h-px' : 'w-px self-stretch';
  const spacingClasses = (() => {
    if (orientation === 'horizontal') {
      switch (spacing) {
        case 'sm': return 'my-1';
        case 'md': return 'my-2';
        case 'lg': return 'my-4';
        default: return '';
      }
    } else {
      switch (spacing) {
        case 'sm': return 'mx-1';
        case 'md': return 'mx-2';
        case 'lg': return 'mx-4';
        default: return '';
      }
    }
  })();

  return <hr className={`${baseClasses} ${orientClasses} ${spacingClasses}`} />;
}