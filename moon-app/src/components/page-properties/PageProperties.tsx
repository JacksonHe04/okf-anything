'use client';

/**
 * PageProperties — 页面属性面板
 * - 字段按重要性排序：title > type > description > tags > resource > 时间 > Notion ID
 */

import { useState, useEffect } from 'react';
import { FieldCard } from './FieldCard';
import type { Frontmatter } from '@/types/document';
import { useI18n } from '@/lib/i18n';

type FieldDef = { type: 'string' | 'text' | 'datetime' | 'list' | 'select' | 'link' | 'readonly'; required?: boolean; options?: string[] };

// 字段定义：按重要性排序
const FIELD_DEFS: Record<string, FieldDef> = {
  title:              { type: 'string',   required: true },
  type:               { type: 'select',   options: ['Notion Page', 'Notion Database', 'Local Page'] },
  description:        { type: 'text' },
  tags:               { type: 'list' },
  resource:           { type: 'link' },
  timestamp:          { type: 'datetime' },
  notion_id:          { type: 'readonly' },
  created_time:       { type: 'readonly' },
  last_edited_time:   { type: 'datetime' },
  notion_parent_type: { type: 'select',   options: ['workspace', 'page_id', 'database_id'] },
  notion_parent_id:   { type: 'string' },
};

// 字段显示顺序（按重要性）
const FIELD_ORDER = [
  'title',
  'type',
  'description',
  'tags',
  'resource',
  'timestamp',
  'notion_id',
  'created_time',
  'last_edited_time',
  'notion_parent_type',
  'notion_parent_id',
];

type PagePropertiesProps = {
  fileHandle: FileSystemFileHandle | null;
  currentPath: string;
  allFileTexts: { path: string; text: string }[];
  frontmatter: Frontmatter;
  onFrontmatterChange: (frontmatter: Frontmatter) => void;
};

export function PageProperties({ fileHandle, currentPath, allFileTexts, frontmatter: externalFrontmatter, onFrontmatterChange }: PagePropertiesProps) {
  const { t } = useI18n();
  const [frontmatter, setFrontmatter] = useState<Frontmatter>({});
  const [extraFields, setExtraFields] = useState<string[]>([]);
  const [hasFrontmatter, setHasFrontmatter] = useState(false);

  useEffect(() => {
    if (!fileHandle) {
      setFrontmatter({});
      setHasFrontmatter(false);
      setExtraFields([]);
      return;
    }
    setFrontmatter(externalFrontmatter);
    setHasFrontmatter(Object.keys(externalFrontmatter).length > 0);
    const known = new Set(Object.keys(FIELD_DEFS));
    setExtraFields(Object.keys(externalFrontmatter).filter((k) => !known.has(k)));
  }, [externalFrontmatter, fileHandle]);

  const updateField = (name: string, value: unknown) => {
    const next = { ...frontmatter, [name]: value };
    setFrontmatter(next);
    onFrontmatterChange(next);
  };

  const addFrontmatter = () => {
    const init: Frontmatter = {
      type: 'Local Page',
      title: 'Untitled',
      notion_id: 'local-' + crypto.randomUUID(),
    };
    setFrontmatter(init);
    setHasFrontmatter(true);
    onFrontmatterChange(init);
  };

  const getFieldLabel = (fieldName: string) => {
    switch (fieldName) {
      case 'title': return t('propTitle');
      case 'type': return t('propType');
      case 'description': return t('propDescription');
      case 'tags': return t('propTags');
      case 'resource': return t('propResource');
      case 'created_time': return t('propCreatedTime');
      case 'last_edited_time': return t('propLastEditedTime');
      case 'notion_id': return t('propNotionId');
      case 'notion_parent_type': return t('propParentType');
      case 'notion_parent_id': return t('propParentId');
      default: return fieldName;
    }
  };

  // 按 FIELD_ORDER 排序字段
  const sortedFields = FIELD_ORDER.filter((name) => frontmatter[name] !== undefined || FIELD_DEFS[name]);

  return (
    <div className="flex flex-col gap-4 font-sans text-fg w-full">
      <h3 className="text-sm font-bold text-fg border-b border-borderSubtle/60 pb-1.5">{t('propertiesTitle')}</h3>
      {!hasFrontmatter ? (
        <div className="flex flex-col items-center gap-3 p-6 border border-dashed border-borderSubtle rounded-lg text-center bg-sidebarBg/10">
          <p className="text-xs text-fgMuted">{t('noFrontmatter')}</p>
          <button
            onClick={addFrontmatter}
            className="px-3 py-1.5 bg-accent text-white rounded text-xs font-semibold hover:bg-accentHover transition-colors focus:outline-none cursor-pointer"
          >
            {t('addFrontmatter')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {sortedFields.map((name) => {
            const def = FIELD_DEFS[name];
            return (
              <FieldCard
                key={name}
                name={name}
                label={getFieldLabel(name)}
                type={def?.type ?? 'string'}
                value={frontmatter[name]}
                required={def?.required}
                options={def?.options}
                onChange={(v) => updateField(name, v)}
                error={def?.required && !frontmatter[name] ? t('requiredField') : undefined}
              />
            );
          })}
          {extraFields.map((name) => (
            <FieldCard
              key={name}
              name={name}
              label={name}
              type="string"
              value={frontmatter[name]}
              onChange={(v) => updateField(name, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
