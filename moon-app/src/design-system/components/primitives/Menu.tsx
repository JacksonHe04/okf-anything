'use client';

/**
 * Menu — 下拉菜单（完全重构为 Tailwind CSS）。
 *
 * 触发器 + 弹出层。
 * 弹出层定位：相对触发器绝对定位，CSS 控制方向。
 * 关闭逻辑：点击外部 / Esc。
 */

import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

export interface MenuItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  shortcut?: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
  separatorAfter?: boolean;
}

export interface MenuProps {
  trigger: ReactElement;
  items: MenuItem[];
  align?: 'start' | 'end';
}

export function Menu({ trigger, items, align = 'start' }: MenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  // clone 触发器，挂 onClick
  const clonedTrigger = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          setOpen((v) => !v);
          // 触发器原有的 onClick 仍可被调用
          const handler = (trigger.props as { onClick?: (e: React.MouseEvent) => void }).onClick;
          handler?.(e);
        },
      })
    : trigger;

  return (
    <div className="relative inline-flex" ref={wrapRef}>
      {clonedTrigger}
      {open && (
        <div
          role="menu"
          className={`absolute top-full z-50 mt-1 min-w-[200px] max-w-[320px] p-1 bg-appBg border border-borderSubtle rounded-lg shadow-lg ${
            align === 'end' ? 'right-0' : 'left-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item) => (
            <div key={item.id}>
              <button
                role="menuitem"
                disabled={item.disabled}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-sans text-left cursor-pointer transition-colors duration-120 ${
                  item.danger
                    ? 'text-danger hover:bg-danger/10'
                    : 'text-fg hover:bg-sidebarHoverBg'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (item.disabled) return;
                  item.onSelect();
                  setOpen(false);
                }}
              >
                {item.icon && (
                  <span className={`inline-flex items-center justify-center w-3.5 h-3.5 flex-shrink-0 ${
                    item.danger ? 'text-danger' : 'text-fgMuted'
                  } [&>svg]:w-3.5 [&>svg]:h-3.5`}>
                    {item.icon}
                  </span>
                )}
                <span className="flex-1 min-w-0 truncate">{item.label}</span>
                {item.shortcut && (
                  <span className="font-mono text-[11px] text-fgMuted flex-shrink-0">{item.shortcut}</span>
                )}
              </button>
              {item.separatorAfter && <div className="h-px my-1 bg-borderSubtle" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
