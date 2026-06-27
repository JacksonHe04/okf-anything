'use client';

/**
 * Welcome — 主区空状态。
 * 没打开文件时显示：
 * - 一句话定位
 * - 快捷键清单
 * - 最近打开文件列表
 * - 三栏引导
 */

import { FileText, Search, PanelLeft, PanelRight, Command, Save, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Kbd } from '@/design-system/components/primitives/Kbd';
import { SidebarItem } from '@/design-system/components/composed/SidebarItem';
import './Welcome.css';

export interface WelcomeProps {
  recentPaths: string[];
  hasWorkspace: boolean;
  onPickRecent?: (path: string) => void;
}

export function Welcome({ recentPaths, hasWorkspace, onPickRecent }: WelcomeProps) {
  return (
    <div className="moon-welcome">
      <div className="moon-welcome-hero">
        <h1 className="moon-welcome-title">MOON</h1>
        <p className="moon-welcome-subtitle">
          你的知识，已经回到你的硬盘。
        </p>
        <p className="moon-welcome-tip">
          {hasWorkspace
            ? '在左侧选一个文件开始 — 或者用搜索 / 快捷键'
            : '点击左上方"选择 local/ 目录"，挑一个 Notion 拉回来的目录'}
        </p>
      </div>

      <div className="moon-welcome-grid">
        <section className="moon-welcome-card">
          <h2 className="moon-welcome-card-title">
            <ArrowDownToLine size={14} />
            ESCAPE
          </h2>
          <p className="moon-welcome-card-desc">
            从 Notion / 飞书 / 语雀拉回本地，写成 OKF。
          </p>
        </section>
        <section className="moon-welcome-card">
          <h2 className="moon-welcome-card-title">
            <FileText size={14} />
            MOON
          </h2>
          <p className="moon-welcome-card-desc">
            本地编辑器：三栏布局 · 衬线正文 · 双链跳转。
          </p>
        </section>
        <section className="moon-welcome-card">
          <h2 className="moon-welcome-card-title">
            <ArrowUpFromLine size={14} />
            SHOT
          </h2>
          <p className="moon-welcome-card-desc">
            检索 · RAG · Agent API — 让本地知识被 Agent 用起来。
          </p>
        </section>
      </div>

      <section className="moon-welcome-section">
        <h2 className="moon-welcome-section-title">快捷键</h2>
        <div className="moon-welcome-shortcuts">
          <div className="moon-welcome-shortcut">
            <Kbd>⌘ K</Kbd>
            <span>全局搜索</span>
          </div>
          <div className="moon-welcome-shortcut">
            <Kbd>⌘ S</Kbd>
            <span>立即保存</span>
          </div>
          <div className="moon-welcome-shortcut">
            <Kbd>⌘ B</Kbd>
            <span>折叠 / 展开左栏</span>
          </div>
          <div className="moon-welcome-shortcut">
            <Kbd>⌘ .</Kbd>
            <span>折叠 / 展开右栏</span>
          </div>
          <div className="moon-welcome-shortcut">
            <Kbd>⌘ + 点击</Kbd>
            <span>跟随双链</span>
          </div>
        </div>
      </section>

      <section className="moon-welcome-section">
        <h2 className="moon-welcome-section-title">三栏功能</h2>
        <div className="moon-welcome-panes">
          <div className="moon-welcome-pane">
            <PanelLeft size={14} />
            <span>
              <strong>左栏</strong>：文件树（Notion 风格，可折叠、可新建文件 / 文件夹）
            </span>
          </div>
          <div className="moon-welcome-pane">
            <Command size={14} />
            <span>
              <strong>顶栏</strong>：面包屑路径 · 搜索 · 三点菜单（主题 / 重载 / 关于）
            </span>
          </div>
          <div className="moon-welcome-pane">
            <PanelRight size={14} />
            <span>
              <strong>右栏</strong>：属性 / 目录 / 关联（三个 tab 切换）
            </span>
          </div>
        </div>
      </section>

      {recentPaths.length > 0 && (
        <section className="moon-welcome-section">
          <h2 className="moon-welcome-section-title">
            <Search size={14} />
            最近打开
          </h2>
          <div className="moon-welcome-recent">
            {recentPaths.map((p) => (
              <div key={p} className="moon-welcome-recent-row">
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

      <footer className="moon-welcome-footer">
        <Save size={12} />
        <span>MOON · ESCAPE · SHOT — knowledge, no monthly seat fee.</span>
      </footer>
    </div>
  );
}