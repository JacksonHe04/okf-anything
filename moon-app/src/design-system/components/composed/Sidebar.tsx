'use client';

/**
 * Sidebar — 可折叠 + 可拖拽的侧栏容器
 * - 支持边缘悬停弹出 (Peek)
 * - 拖拽无延迟，正常拖拽
 * - Peek 状态下支持右键菜单
 */

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { IconButton } from '../primitives/IconButton';
import { Tooltip } from '../primitives/Tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface SidebarProps {
  side: 'left' | 'right';
  collapsed: boolean;
  onToggleCollapsed: () => void;
  children: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export function Sidebar({
  side,
  collapsed,
  onToggleCollapsed,
  children,
  defaultWidth,
  minWidth = 180,
  maxWidth = 480,
}: SidebarProps) {
  const DEFAULT_WIDTH = defaultWidth ?? (side === 'left' ? 264 : 280);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isPeeking, setIsPeeking] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const leaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (collapsed) return;
      e.preventDefault();
      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;

      const onMouseMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = side === 'left' ? ev.clientX - startX.current : startX.current - ev.clientX;
        const next = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
        setWidth(next);
      };

      const onMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [collapsed, width, side, minWidth, maxWidth],
  );

  const isShown = !collapsed || isPeeking;
  const sidebarWidth = isShown ? width : 0;

  // 侧栏主体 CSS 类名
  const sidebarClasses = [
    'relative flex flex-col bg-sidebarBg border-borderSubtle flex-shrink-0 h-full transition-all duration-200 ease-in-out font-sans',
    side === 'left' ? 'border-r' : 'border-l',
    collapsed && !isPeeking ? 'w-0 border-r-0 border-l-0 overflow-hidden' : '',
    collapsed && isPeeking ? 'absolute top-0 bottom-0 z-40 shadow-2xl' : '',
    side === 'left' && collapsed && isPeeking ? 'left-0' : '',
    side === 'right' && collapsed && isPeeking ? 'right-0' : '',
  ].filter(Boolean).join(' ');

  // 折叠按钮定位：始终落在「侧栏本来在的那一侧」的内边距处，避免折叠时按钮脱离侧栏。
  // 当侧栏完全隐藏（既未展开也未 peek）时按钮也不可见、不可点。
  const toggleBtnClasses = [
    'absolute top-3 z-50 bg-sidebarBg border border-borderSubtle rounded-md flex items-center justify-center shadow-sm transition-opacity duration-150',
    side === 'left' ? 'right-3' : 'left-3',
    isShown
      ? 'opacity-0 group-hover/sidebar:opacity-100 focus-within:opacity-100'
      : 'opacity-0 pointer-events-none',
  ].filter(Boolean).join(' ');

  // 处理鼠标离开：使用延迟关闭 Peek，允许右键菜单操作
  const handleMouseLeave = () => {
    if (isPeeking && !isDragging.current) {
      // 延迟 300ms 关闭 Peek，给右键菜单操作留出时间
      leaveTimeout.current = setTimeout(() => {
        setIsPeeking(false);
      }, 300);
    }
  };

  // 鼠标重新进入时取消延迟关闭
  const handleMouseEnter = () => {
    if (leaveTimeout.current) {
      clearTimeout(leaveTimeout.current);
      leaveTimeout.current = null;
    }
  };

  return (
    <>
      {/* 边缘触发区：折叠时鼠标移到屏幕边缘触发 Peek */}
      {collapsed && !isPeeking && (
        <div
          className={`absolute top-0 bottom-0 w-2 z-40 cursor-pointer ${
            side === 'left' ? 'left-0' : 'right-0'
          }`}
          onMouseEnter={() => {
            setIsPeeking(true);
            handleMouseEnter();
          }}
        />
      )}

      <aside
        className={`group/sidebar ${sidebarClasses}`}
        style={{ width: sidebarWidth }}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        {/* 内容容器 */}
        <div
          className={`flex-1 min-w-0 flex flex-col overflow-hidden transition-opacity duration-200 ${
            !isShown ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {children}
        </div>

        {/* 拖拽边缘调整宽度（展开时有效，边缘可拖拽） */}
        {isShown && (
          <div
            className={`absolute top-0 bottom-0 w-2 z-30 cursor-col-resize opacity-0 hover:opacity-100 active:opacity-100 transition-opacity duration-150 ${
              side === 'left' ? 'right-[-4px]' : 'left-[-4px]'
            }`}
            onMouseDown={onMouseDown}
            title="拖拽调整宽度"
          >
            {/* 拖拽指示线 */}
            <div className="h-full w-[2px] bg-accent mx-auto" />
          </div>
        )}

        {/* 折叠/展开按钮 */}
        <div className={toggleBtnClasses}>
          <Tooltip label={collapsed ? '展开' : '收起'} side={side === 'left' ? 'right' : 'left'}>
            <IconButton
              icon={
                side === 'left' ? (
                  collapsed ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronLeft size={16} />
                  )
                ) : collapsed ? (
                  <ChevronLeft size={16} />
                ) : (
                  <ChevronRight size={16} />
                )
              }
              size="sm"
              onClick={() => {
                setIsPeeking(false);
                if (leaveTimeout.current) {
                  clearTimeout(leaveTimeout.current);
                  leaveTimeout.current = null;
                }
                onToggleCollapsed();
              }}
              aria-label={collapsed ? '展开侧栏' : '收起侧栏'}
            />
          </Tooltip>
        </div>
      </aside>
    </>
  );
}