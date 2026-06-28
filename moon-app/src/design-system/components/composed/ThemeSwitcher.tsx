'use client';

/**
 * ThemeSwitcher — 主题切换（light / dark / system，完全重构为 Tailwind CSS）。
 * 循环点击：light → dark → system → light ...
 */

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type ThemeMode } from '../../theme';
import { Menu, type MenuItem } from '../primitives/Menu';
import { IconButton } from '../primitives/IconButton';

export function ThemeSwitcher() {
  const { mode, resolved, setMode } = useTheme();

  const items: MenuItem[] = [
    {
      id: 'light',
      label: '浅色',
      icon: <Sun size={14} />,
      onSelect: () => setMode('light'),
    },
    {
      id: 'dark',
      label: '深色',
      icon: <Moon size={14} />,
      onSelect: () => setMode('dark'),
    },
    {
      id: 'system',
      label: '跟随系统',
      icon: <Monitor size={14} />,
      onSelect: () => setMode('system'),
    },
  ];

  const Glyph =
    resolved === 'dark' ? <Moon size={16} /> : <Sun size={16} />;

  return (
    <Menu
      trigger={
        <IconButton icon={Glyph} size="sm" aria-label={`主题：${mode}`} />
      }
      items={items}
      align="end"
    />
  );
}

export type { ThemeMode };