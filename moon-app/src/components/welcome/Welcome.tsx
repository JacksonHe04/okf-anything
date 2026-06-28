'use client';

/**
 * Welcome — 主区空状态（完全重构为 Tailwind CSS，消除 Welcome.css 依赖）。
 */

import { FileText, Search, PanelLeft, PanelRight, Command } from 'lucide-react';
import { Kbd } from '@/design-system/components/primitives/Kbd';
import { SidebarItem } from '@/design-system/components/composed/SidebarItem';

export interface WelcomeProps {
  recentPaths: string[];
  hasWorkspace: boolean;
  onPickRecent?: (path: string) => void;
}

export function Welcome({ recentPaths, hasWorkspace, onPickRecent }: WelcomeProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-8 py-14 font-sans text-fg">
      <section className="rounded-xl border border-borderSubtle/70 bg-paneBg px-6 py-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-fgMuted">Workspace</p>
          <h1 className="m-0 text-[2rem] font-semibold leading-tight text-fg">MOON</h1>
          <p className="m-0 max-w-xl text-sm leading-6 text-fgSecondary">
            {hasWorkspace
              ? '从左侧文档树选择页面开始编辑，或使用顶部搜索快速跳转。'
              : '先选择一个本地工作区。MOON 会直接在你的 Markdown 文档上工作，不做额外同步层。'}
          </p>
        </div>
      </section>

      {/* Shortcuts */}
      <section className="rounded-xl border border-borderSubtle/70 bg-appBg px-6 py-5">
        <h2 className="mb-4 flex items-center gap-1.5 border-b border-borderSubtle/60 pb-2 text-sm font-semibold text-fg">
          快捷键
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className="flex items-center gap-2.5 text-xs text-fgSecondary">
            <Kbd>⌘ K</Kbd>
            <span>全局搜索</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-fgSecondary">
            <Kbd>⌘ S</Kbd>
            <span>立即保存</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-fgSecondary">
            <Kbd>⌘ B</Kbd>
            <span>折叠 / 展开左栏</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-fgSecondary">
            <Kbd>⌘ .</Kbd>
            <span>折叠 / 展开右栏</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-fgSecondary">
            <Kbd>⌘ + 点击</Kbd>
            <span>跟随双向链接</span>
          </div>
        </div>
      </section>

      {/* Panes */}
      <section className="rounded-xl border border-borderSubtle/70 bg-appBg px-6 py-5">
        <h2 className="mb-4 border-b border-borderSubtle/60 pb-2 text-sm font-semibold text-fg">
          界面说明
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 text-xs text-fgSecondary leading-relaxed">
            <PanelLeft size={14} className="text-fgMuted mt-0.5" />
            <span>
              <strong>左栏</strong>：文档树与工作区切换。
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-fgSecondary leading-relaxed">
            <Command size={14} className="text-fgMuted mt-0.5" />
            <span>
              <strong>顶栏</strong>：面包屑、搜索、保存状态和主题切换。
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-fgSecondary leading-relaxed">
            <PanelRight size={14} className="text-fgMuted mt-0.5" />
            <span>
              <strong>右栏</strong>：属性、目录和关联文档。
            </span>
          </div>
        </div>
      </section>

      {/* Recent Files */}
      {recentPaths.length > 0 && (
        <section className="rounded-xl border border-borderSubtle/70 bg-appBg px-6 py-5">
          <h2 className="mb-4 flex items-center gap-1.5 border-b border-borderSubtle/60 pb-2 text-sm font-semibold text-fg">
            <Search size={14} className="text-fgMuted" />
            最近打开
          </h2>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
            {recentPaths.map((p) => (
              <div key={p} className="hover:bg-sidebarHoverBg/40 rounded transition-colors duration-100">
                <SidebarItem
                  label={p}
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
