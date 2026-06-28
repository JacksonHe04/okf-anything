'use client';

/**
 * Input — 文本输入框（完全重构为 Tailwind CSS）。
 * 用途：顶栏搜索、属性面板字段值编辑等。
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md';
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'md',
    iconLeft,
    iconRight,
    fullWidth = false,
    className,
    ...rest
  },
  ref,
) {
  const heightClass = size === 'sm' ? 'h-[26px]' : 'h-8';

  return (
    <div
      className={[
        'inline-flex items-center',
        'bg-appBg border border-borderSubtle rounded-md',
        'transition-colors duration-150',
        'hover:border-borderStrong',
        'focus-within:border-accent',
        heightClass,
        iconLeft ? 'pl-2 pr-2' : iconRight ? 'pl-2 pr-2' : 'px-2',
        fullWidth ? 'flex w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {iconLeft && (
        <span className="inline-flex items-center justify-center text-fgMuted flex-shrink-0 mr-1.5 [&>svg]:w-3.5 [&>svg]:h-3.5">
          {iconLeft}
        </span>
      )}
      <input
        ref={ref}
        className="flex-1 min-w-0 h-full bg-transparent border-none outline-none font-sans text-xs text-fg placeholder:text-fgMuted"
        {...rest}
      />
      {iconRight && (
        <span className="inline-flex items-center justify-center text-fgMuted flex-shrink-0 ml-1.5 [&>svg]:w-3.5 [&>svg]:h-3.5">
          {iconRight}
        </span>
      )}
    </div>
  );
});
