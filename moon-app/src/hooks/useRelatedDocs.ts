'use client';

/**
 * useRelatedDocs — 给定当前文件 + 全部文件，计算 outgoing / incoming。
 *
 * allFiles 来自 useDirectory / useFileTree 的扫描结果。
 */

import { useMemo } from 'react';
import { resolveRelated, type ResolvedRelated } from '@/lib/related-docs-resolve';

export function useRelatedDocs(
  currentPath: string | null,
  allFiles: { path: string; text: string }[],
): ResolvedRelated {
  return useMemo(() => {
    if (!currentPath) return { outgoing: [], incoming: [] };
    return resolveRelated({ currentPath, allFiles });
  }, [currentPath, allFiles]);
}