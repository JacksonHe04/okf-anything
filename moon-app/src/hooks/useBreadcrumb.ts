'use client';

/**
 * useBreadcrumb — 从 filePath 生成面包屑 segments。
 *
 * 给定相对工作区的路径（如 "notes/daily/2026-06-27.md"），生成：
 * [
 *   { label: 'notes', onClick: openFolder },
 *   { label: 'daily', onClick: openFolder },
 *   { label: '2026-06-27.md' },  // 最后一段不可点
 * ]
 */

import { useMemo } from 'react';
import type { BreadcrumbSegment } from '@/design-system/components/composed/Breadcrumb';

export interface UseBreadcrumbOptions {
  /** 相对工作区的路径（不含工作区名），如 'notes/daily/today.md' */
  relativePath: string | null | undefined;
  /** 工作区显示名（用于 root 标签） */
  workspaceName?: string;
  /** 点击中间段时的回调（打开该文件夹 / 跳到该层级） */
  onNavigateTo?: (segmentIndex: number, segmentLabel: string) => void;
}

export function useBreadcrumb({
  relativePath,
  workspaceName = '工作区',
  onNavigateTo,
}: UseBreadcrumbOptions): BreadcrumbSegment[] {
  return useMemo(() => {
    if (!relativePath) return [];
    const parts = relativePath.split('/').filter(Boolean);
    return parts.map((label, idx) => {
      const isLast = idx === parts.length - 1;
      return {
        label,
        onClick: isLast || !onNavigateTo ? undefined : () => onNavigateTo(idx, label),
      };
    });
  }, [relativePath, onNavigateTo]);
}

// 单独导出 root 节点的 label，方便 page.tsx 拼到 Breadcrumb 的 root prop
export function getWorkspaceLabel(name?: string) {
  return name ?? '工作区';
}