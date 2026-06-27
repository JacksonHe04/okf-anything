'use client';

/**
 * PageProperties — 页面属性面板（完全重构为 Tailwind CSS，消除 CSS 依赖）。
 */

import { useState, useEffect } from 'react';
import { FieldCard } from './FieldCard';
import type { Frontmatter } from '@/types/document';

type FieldDef = { type: 'string' | 'text' | 'datetime' | 'list' | 'select' | 'link' | 'readonly'; required?: boolean; options?: string[] };

const FIELD_DEFS: Record<string, FieldDef> = {
  title:              { type: 'string',   required: true },
  type:               { type: 'select',   options: ['Notion Page', 'Notion Database', 'Local Page'] },
  description:        { type: 'text' },
  resource:           { type: 'link' },
  tags:               { type: 'list' },
  timestamp:          { type: 'datetime' },
  notion_id:          { type: 'readonly' },
  created_time:       { type: 'readonly' },
  last_edited_time:   { type: 'datetime' },
  notion_parent_type: { type: 'select',   options: ['workspace', 'page_id', 'database_id'] },
  notion_parent_id:   { type: 'string' },
};

type PagePropertiesProps = {
  fileHandle: FileSystemFileHandle | null;
  currentPath: string;
  allFileTexts: { path: string; text: string }[];
  frontmatter: Frontmatter;
  onFrontmatterChange: (frontmatter: Frontmatter) => void;
};

export function PageProperties({ fileHandle, currentPath, allFileTexts, frontmatter: externalFrontmatter, onFrontmatterChange }: PagePropertiesProps) {
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

  return (
    <div className="flex flex-col gap-4 font-sans text-fg w-full">
      <h3 className="text-sm font-bold text-fg border-b border-borderSubtle/60 pb-1.5">页面属性</h3>
      {!hasFrontmatter ? (
        <div className="flex flex-col items-center gap-3 p-6 border border-dashed border-borderSubtle rounded-lg text-center bg-sidebarBg/10">
          <p className="text-xs text-fgMuted">此文件无 frontmatter</p>
          <button
            onClick={addFrontmatter}
            className="px-3 py-1.5 bg-accent text-white rounded text-xs font-semibold hover:bg-accentHover transition-colors focus:outline-none"
          >
            添加 frontmatter
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {Object.entries(FIELD_DEFS).map(([name, def]) => (
            <FieldCard
              key={name}
              name={name}
              type={def.type}
              value={frontmatter[name]}
              required={def.required}
              options={def.options}
              onChange={(v) => updateField(name, v)}
              error={def.required && !frontmatter[name] ? '必填' : undefined}
            />
          ))}
          {extraFields.map((name) => (
            <FieldCard
              key={name}
              name={name}
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
