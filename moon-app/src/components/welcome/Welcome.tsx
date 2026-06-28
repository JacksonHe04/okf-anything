'use client';

/**
 * Welcome — 主区空状态
 * - 最近文件只显示文件名，不显示完整路径
 */

import { FileText, Search, PanelLeft, PanelRight, Command } from 'lucide-react';
import { Kbd } from '@/design-system/components/primitives/Kbd';
import { SidebarItem } from '@/design-system/components/composed/SidebarItem';
import { getBasename, deslugify } from '@/lib/fs-access';
import { useI18n } from '@/lib/i18n';

export interface WelcomeProps {
  recentPaths: string[];
  hasWorkspace: boolean;
  onPickRecent?: (path: string) => void;
}

/**
 * 提取文件名（不含路径和 .md 后缀）
 */
function getFileName(path: string): string {
  const basename = getBasename(path);
  // 去掉 .md 后缀并 deslugify
  return deslugify(basename.replace(/\.md$/i, ''));
}

export function Welcome({ recentPaths, hasWorkspace, onPickRecent }: WelcomeProps) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-8 py-14 font-sans text-fg">
      <section className="rounded-xl border border-borderSubtle/70 bg-paneBg px-6 py-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-fgMuted">{t('workspace')}</p>
          <h1 className="m-0 text-[2rem] font-semibold leading-tight text-fg">MOONLESS</h1>
          <p className="m-0 max-w-xl text-sm leading-6 text-fgSecondary">
            {hasWorkspace ? t('welcomeSubtitleActive') : t('welcomeSubtitleEmpty')}
          </p>
        </div>
      </section>

      {/* Shortcuts */}
      <section className="rounded-xl border border-borderSubtle/70 bg-appBg px-6 py-5">
        <h2 className="mb-4 flex items-center gap-1.5 border-b border-borderSubtle/60 pb-2 text-sm font-semibold text-fg">
          {t('welcomeShortcuts')}
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className="flex items-center gap-2.5 text-xs text-fgSecondary">
            <Kbd>⌘ K</Kbd>
            <span>{t('welcomeSearch')}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-fgSecondary">
            <Kbd>⌘ S</Kbd>
            <span>{t('welcomeSave')}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-fgSecondary">
            <Kbd>⌘ B</Kbd>
            <span>{t('welcomeLeftSidebar')}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-fgSecondary">
            <Kbd>⌘ .</Kbd>
            <span>{t('welcomeRightSidebar')}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-fgSecondary">
            <Kbd>⌘ + Click</Kbd>
            <span>{t('welcomeFollowLink')}</span>
          </div>
        </div>
      </section>

      {/* Panes */}
      <section className="rounded-xl border border-borderSubtle/70 bg-appBg px-6 py-5">
        <h2 className="mb-4 border-b border-borderSubtle/60 pb-2 text-sm font-semibold text-fg">
          {t('welcomeInterface')}
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 text-xs text-fgSecondary leading-relaxed">
            <PanelLeft size={14} className="text-fgMuted mt-0.5" />
            <span>
              {t('welcomeLeftSidebarDesc')}
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-fgSecondary leading-relaxed">
            <Command size={14} className="text-fgMuted mt-0.5" />
            <span>
              {t('welcomeTopBarDesc')}
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-fgSecondary leading-relaxed">
            <PanelRight size={14} className="text-fgMuted mt-0.5" />
            <span>
              {t('welcomeRightSidebarDesc')}
            </span>
          </div>
        </div>
      </section>

      {/* Recent Files */}
      {recentPaths.length > 0 && (
        <section className="rounded-xl border border-borderSubtle/70 bg-appBg px-6 py-5">
          <h2 className="mb-4 flex items-center gap-1.5 border-b border-borderSubtle/60 pb-2 text-sm font-semibold text-fg">
            <Search size={14} className="text-fgMuted" />
            {t('recentTitle')}
          </h2>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
            {recentPaths.map((p) => (
              <div key={p} className="hover:bg-sidebarHoverBg/40 rounded transition-colors duration-100">
                <SidebarItem
                  label={getFileName(p)}
                  depth={0}
                  onClick={() => onPickRecent?.(p)}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}