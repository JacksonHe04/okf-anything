'use client';

/**
 * useToc — 从 markdown 字符串提取 headings，给右栏「目录」tab 用。
 */

import { useMemo } from 'react';
import { extractHeadings, type Heading } from '@/lib/headings-extract';

export function useToc(markdown: string | null | undefined): Heading[] {
  return useMemo(() => extractHeadings(markdown ?? ''), [markdown]);
}