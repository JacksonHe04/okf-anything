'use client';

/**
 * RightRail — 右栏三 tab 容器。
 *
 * tabs: 属性 / 目录 / 关联
 * 顶部 Tabs 切换，主体根据 activeId 渲染对应面板。
 */

import { useState, type ReactNode } from 'react';
import { FileText, ListTree, Link2 } from 'lucide-react';
import { Tabs, type TabItem } from '@/design-system/components/primitives/Tabs';
import { PageProperties } from '@/components/page-properties/PageProperties';
import { TocItem } from '@/design-system/components/composed/TocItem';
import { RelatedDocItem, type RelatedDocItemProps } from '@/design-system/components/composed/RelatedDocItem';
import type { Heading } from '@/lib/headings-extract';
import type { ResolvedRelated } from '@/lib/related-docs-resolve';
import type { Frontmatter } from '@/types/document';
import './RightRail.css';

type TabId = 'properties' | 'toc' | 'related';

export interface RightRailProps {
  // properties
  fileHandle: FileSystemFileHandle | null;
  currentPath: string;
  allFileTexts: { path: string; text: string }[];
  onFrontmatterChange: (fm: Frontmatter) => void;

  // toc
  headings: Heading[];
  onJumpToHeading?: (heading: Heading) => void;

  // related
  related: ResolvedRelated;
  onOpenRelated?: (path: string) => void;
}

export function RightRail({
  fileHandle,
  currentPath,
  allFileTexts,
  onFrontmatterChange,
  headings,
  onJumpToHeading,
  related,
  onOpenRelated,
}: RightRailProps) {
  const [activeTab, setActiveTab] = useState<TabId>('properties');

  const tabs: TabItem[] = [
    { id: 'properties', icon: <FileText size={14} />, label: '属性' },
    { id: 'toc', icon: <ListTree size={14} />, label: '目录' },
    { id: 'related', icon: <Link2 size={14} />, label: '关联' },
  ];

  return (
    <aside className="moon-right-rail">
      <div className="moon-right-rail-tabs">
        <Tabs items={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
      </div>
      <div className="moon-right-rail-body">
        {activeTab === 'properties' && (
          <div className="moon-right-rail-panel">
            <PageProperties
              fileHandle={fileHandle}
              currentPath={currentPath}
              allFileTexts={allFileTexts}
              onFrontmatterChange={onFrontmatterChange}
            />
          </div>
        )}
        {activeTab === 'toc' && (
          <div className="moon-right-rail-panel">
            {headings.length === 0 ? (
              <p className="moon-right-rail-empty">本文档无 headings</p>
            ) : (
              <div className="moon-right-rail-list">
                {headings.map((h) => (
                  <TocItem
                    key={`${h.offset}-${h.anchor}`}
                    depth={h.level}
                    label={h.text}
                    onClick={() => onJumpToHeading?.(h)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'related' && (
          <div className="moon-right-rail-panel">
            {related.outgoing.length === 0 && related.incoming.length === 0 ? (
              <p className="moon-right-rail-empty">无关联文档</p>
            ) : (
              <div className="moon-right-rail-list">
                {related.outgoing.map((r) => (
                  <RelatedDocItem
                    key={`out-${r.path}`}
                    label={r.label}
                    refType="outgoing"
                    onClick={() => onOpenRelated?.(r.path)}
                  />
                ))}
                {related.incoming.map((r) => (
                  <RelatedDocItem
                    key={`in-${r.path}`}
                    label={r.label}
                    refType="incoming"
                    onClick={() => onOpenRelated?.(r.path)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}