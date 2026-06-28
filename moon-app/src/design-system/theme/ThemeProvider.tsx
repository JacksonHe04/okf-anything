'use client';

/**
 * MOON Theme System
 *
 * 支持 light / dark / system 三种模式。
 * - mode: 用户选择
 * - resolved: 实际生效（system 时跟随 OS）
 *
 * 通过 CSS 变量 + data-theme 属性绑定到 design tokens，
 * 组件样式全部基于 var(--moon-*)，无需感知 mode。
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { lightColors, darkColors, type SemanticColors } from '../tokens/colors';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  colors: SemanticColors;
}

const STORAGE_KEY = 'moon-theme-mode';

// 系统主题查询
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

// 把当前 mode + system 解析成实际主题
function resolveTheme(mode: ThemeMode, system: ResolvedTheme): ResolvedTheme {
  return mode === 'system' ? system : mode;
}

// 把 SemanticColors 序列化成 CSS 变量字符串，注入到 :root / [data-theme]
function colorsToCssVars(colors: SemanticColors): string {
  return Object.entries(colors)
    .map(([k, v]) => `--moon-${k}: ${v};`)
    .join('\n');
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');

  // 初始加载：读 localStorage + 系统主题
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setModeState(stored);
    }
    setSystemTheme(getSystemTheme());
  }, []);

  // 监听 OS 主题变化（仅 system 模式有效，但总是监听以便响应）
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolved = resolveTheme(mode, systemTheme);
  const colors = resolved === 'dark' ? darkColors : lightColors;

  // 把主题 + colors 写到 <html data-theme> + CSS 变量
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolved;
    const styleEl =
      document.getElementById('moon-theme-vars') ??
      (() => {
        const el = document.createElement('style');
        el.id = 'moon-theme-vars';
        document.head.appendChild(el);
        return el;
      })();
    styleEl.textContent = `:root[data-theme="${resolved}"] {
${colorsToCssVars(colors)}
}
/* 主题切换平滑过渡 */
html {
  transition: background-color 0.3s ease, color 0.3s ease;
}
* {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
`;
  }, [resolved, colors]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, setMode, colors }),
    [mode, resolved, setMode, colors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}