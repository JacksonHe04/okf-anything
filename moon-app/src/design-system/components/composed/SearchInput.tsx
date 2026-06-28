'use client';

/**
 * SearchInput — 顶栏常驻搜索输入框（完全重构为 Tailwind CSS）。
 *
 * 行为：
 * - 受控：value + onChange
 * - 触发：Enter 调用 onSubmit(value)
 * - 占位符：`搜索 ⌘K`
 */

import { Search } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes } from 'react';
import { Input } from '../primitives/Input';
import { Kbd } from '../primitives/Kbd';

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size' | 'onSubmit'> {
  value: string;
  onChange: (next: string) => void;
  /** Enter 键触发，回调搜索词 */
  onSearch?: (value: string) => void;
  placeholder?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    { value, onChange, onSearch, placeholder = '搜索', ...rest },
    ref,
  ) {
    return (
      <div className="relative inline-flex items-center w-[280px]">
        <div className="w-full pr-12">
          <Input
            ref={ref}
            size="sm"
            iconLeft={<Search size={14} />}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch?.(value);
            }}
            placeholder={placeholder}
            {...rest}
          />
        </div>
        <span className="absolute right-2 inline-flex items-center pointer-events-none">
          <Kbd>⌘ K</Kbd>
        </span>
      </div>
    );
  },
);