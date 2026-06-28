'use client';

/**
 * RightRail — 右栏三 tab 容器（完全重构为 Tailwind CSS，Tab 高度增大，仅显示 3 个图标无文字）。
 */

import { useState } from 'react';
import { FileText, ListTree, Link2 } from 'lucide-react';
import { Tabs, type TabItem } from '@/design-system/components/primitives/Tabs';
import { PageProperties } from '@/components/page-properties/PageProperties';
import { TocItem } from '@/design-system/components/composed/TocItem';
import { RelatedDocItem } from '@/design-system/components/composed/RelatedDocItem';
import type { Heading } from '@/lib/headings-extract';
import type { ResolvedRelated } from '@/lib/related-docs-resolve';
import type { Frontmatter } from '@/types/document';
import { useI18n } from '@/lib/i18n';

type TabId = 'properties' | 'toc' | 'related';

export interface RightRailProps {
  // properties
  fileHandle: FileSystemFileHandle | null;
  currentPath: string;
  allFileTexts: { path: string; text: string }[];
  frontmatter: Frontmatter;
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
  frontmatter,
  onFrontmatterChange,
  headings,
  onJumpToHeading,
  related,
  onOpenRelated,
}: RightRailProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>('properties');

  const tabs: TabItem[] = [
    { id: 'properties', icon: <FileText size={17} />, label: t('propertiesTab') },
    { id: 'toc', icon: <ListTree size={17} />, label: t('tocTab') },
    { id: 'related', icon: <Link2 size={17} />, label: t('relatedTab') },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden w-full font-sans text-fg bg-sidebarBg/25">
      {/* 顶部 Tab 导航：与顶栏严格等高 (h-11)，padding 由 Tabs 自身提供 */}
      <div className="flex-shrink-0 border-b border-borderSubtle bg-appBg h-11 flex items-center">
        <Tabs items={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'properties' && (
          <div className="p-4 flex flex-col gap-4">
            <PageProperties
               fileHandle={fileHandle}
               currentPath={currentPath}
               allFileTexts={allFileTexts}
               frontmatter={frontmatter}
               onFrontmatterChange={onFrontmatterChange}
            />
          </div>
        )}
        {activeTab === 'toc' && (
          <div className="p-4">
            {headings.length === 0 ? (
              <p className="text-xs text-fgMuted p-6 text-center select-none font-sans">{t('noHeadings')}</p>
            ) : (
              <div className="flex flex-col gap-1">
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
          <div className="p-4">
            {related.outgoing.length === 0 && related.incoming.length === 0 ? (
              <p className="text-xs text-fgMuted p-6 text-center select-none font-sans">{t('noRelated')}</p>
            ) : (
              <div className="flex flex-col gap-1.5">
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
    </div>
  );
}
