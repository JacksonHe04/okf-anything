'use client';

/**
 * SearchPanel — 全局搜索面板弹窗
 * - 统一使用 Kbd 组件显示快捷键
 */

import { useState, useEffect, useRef } from 'react';
import { SearchResults } from './SearchResults';
import { Kbd } from '@/design-system/components/primitives/Kbd';
import type { SearchResult } from '@/hooks/useSearchIndex';
import { useI18n } from '@/lib/i18n';

type SearchPanelProps = {
  open: boolean;
  onClose: () => void;
  search: (query: string) => SearchResult[];
  onPick: (result: SearchResult) => void;
};

export function SearchPanel({ open, onClose, search, onPick }: SearchPanelProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  const results = search(query);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-24 z-[100]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-appBg border border-borderSubtle rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-2 gap-2"
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-sidebarBg/50 text-fg text-sm font-sans border border-borderSubtle rounded-md px-3.5 py-2.5 pr-16 outline-none focus:border-accent focus:bg-appBg transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center pointer-events-none">
            <Kbd>Esc</Kbd>
          </span>
        </div>
        <SearchResults
          results={results}
          query={query}
          onPick={(r) => {
            onPick(r);
            onClose();
          }}
        />
      </div>
    </div>
  );
}