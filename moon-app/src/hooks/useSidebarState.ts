'use client';

/**
 * useSidebarState — 左 / 右栏的折叠状态。
 *
 * localStorage 持久化，key = moon-sidebar-{side}-collapsed。
 */

import { useCallback, useEffect, useState } from 'react';

const KEY_PREFIX = 'moon-sidebar-';

export function useSidebarState(side: 'left' | 'right', defaultCollapsed = false) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    const stored = localStorage.getItem(KEY_PREFIX + side);
    if (stored === 'true') setCollapsed(true);
    else if (stored === 'false') setCollapsed(false);
  }, [side]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(KEY_PREFIX + side, String(next));
      return next;
    });
  }, [side]);

  return { collapsed, toggle, setCollapsed };
}