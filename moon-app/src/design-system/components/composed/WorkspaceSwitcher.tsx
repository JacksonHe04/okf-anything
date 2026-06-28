'use client';

/**
 * WorkspaceSwitcher — 左栏顶部的工作区切换器
 * - 简洁设计，聚焦选择/切换工作区
 */

import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export type WorkspaceStatus =
  | 'unsupported'
  | 'idle'
  | 'ready'
  | 'needs-reauth'
  | 'denied';

export interface WorkspaceSwitcherProps {
  name: string | null;
  status: WorkspaceStatus;
  onPick: () => void;
  onReauthorize: () => void;
}

export function WorkspaceSwitcher({
  name,
  status,
  onPick,
  onReauthorize,
}: WorkspaceSwitcherProps) {
  const { t } = useI18n();
  const isUnsupported = status === 'unsupported';
  const needsReauth = status === 'needs-reauth';

  return (
    <div className="flex flex-col gap-1 p-4 pb-2 w-full">
      {/* 工作区行：点击切换工作区 */}
      <button
        type="button"
        onClick={needsReauth ? onReauthorize : onPick}
        disabled={isUnsupported}
        className="flex items-center gap-2.5 w-full text-left py-2.5 px-3.5 border border-borderStrong/60 rounded-lg bg-appBg hover:bg-sidebarHoverBg hover:border-accent/40 transition-all duration-120 select-none font-sans text-fg disabled:cursor-not-allowed focus:outline-none shadow-xs"
        title={isUnsupported ? t('unsupportedBrowserTitle') : t('clickToSwitchWorkspace')}
      >
        <span className="flex-1 truncate text-[13px] font-semibold text-fg">
          {name ?? t('selectWorkspace')}
        </span>
        <ChevronDown size={13} className="text-fgMuted flex-shrink-0" />
      </button>

      {/* 状态提示 */}
      {status === 'denied' && (
        <div className="flex items-center gap-1.5 px-3.5 py-1 text-xs text-danger font-sans mt-0.5">
          <span>{t('permissionDenied')}</span>
        </div>
      )}
      {status === 'unsupported' && (
        <div className="flex items-center gap-1.5 px-3.5 py-1 text-xs text-danger font-sans mt-0.5">
          <span>{t('useSupportedBrowser')}</span>
        </div>
      )}
    </div>
  );
}