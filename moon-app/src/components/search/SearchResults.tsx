'use client';

/**
 * SearchResults — 搜索结果列表（支持关键词高亮）
 */

import type { SearchResult } from '@/hooks/useSearchIndex';

import { useI18n } from '@/lib/i18n';

type SearchResultsProps = {
  results: SearchResult[];
  query: string;
  onPick: (result: SearchResult) => void;
};

/**
 * 高亮文本中的匹配关键词
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const parts: React.ReactNode[] = [];
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const matches = text.split(regex);

  matches.forEach((part, i) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      parts.push(
        <mark key={i} className="bg-warning/30 text-fg rounded px-0.5">
          {part}
        </mark>
      );
    } else {
      parts.push(part);
    }
  });

  return <>{parts}</>;
}

/**
 * 转义正则特殊字符
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function SearchResults({ results, query, onPick }: SearchResultsProps) {
  const { t } = useI18n();

  if (results.length === 0) {
    return (
      <div className="text-xs text-fgMuted p-6 text-center select-none font-sans">
        {query ? t('noSearchResults') : t('typeToSearch')}
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-0.5 max-h-80 overflow-y-auto list-none m-0 p-0">
      {results.map((r) => (
        <li
          key={r.id}
          onClick={() => onPick(r)}
          className="p-2.5 rounded cursor-pointer transition-colors duration-120 hover:bg-sidebarHoverBg select-none font-sans"
        >
          <div className="text-xs font-semibold text-fg">{highlightMatch(r.title, query)}</div>
          <div className="text-[10px] text-fgMuted font-mono mt-0.5 truncate" title={r.path || r.id}>
            {r.path || r.id}
          </div>
        </li>
      ))}
    </ul>
  );
}