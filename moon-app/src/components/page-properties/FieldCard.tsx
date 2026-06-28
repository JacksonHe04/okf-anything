'use client';

/**
 * FieldCard — 页面属性单项卡片（完全重构为 Tailwind CSS，消除 CSS 依赖）。
 */

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

type FieldType = 'string' | 'text' | 'datetime' | 'list' | 'select' | 'link' | 'readonly';

type FieldCardProps = {
  name: string;
  label?: string;
  type: FieldType;
  value: unknown;
  required?: boolean;
  options?: string[];
  onChange: (newValue: unknown) => void;
  error?: string;
};

export function FieldCard({ name, label, type, value, required, options, onChange, error }: FieldCardProps) {
  const { locale, t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(serializeValue(value));

  const commit = () => {
    try {
      onChange(parseValue(draft, type));
      setEditing(false);
    } catch (err) {
      console.error('Field parse error:', err);
    }
  };

  const cardBorder = error
    ? 'border-danger/40 bg-danger/5'
    : 'border-borderSubtle bg-sidebarBg/30 hover:border-accent/40';

  // Format datetime according to current locale
  const formatDatetimeValue = (v: unknown) => {
    if (typeof v === 'string') {
      try {
        return new Date(v).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US');
      } catch {
        return v;
      }
    }
    return String(v);
  };

  return (
    <div className={`flex flex-col gap-1 border p-2.5 rounded transition-colors ${cardBorder}`}>
      <div className="flex items-center justify-between text-[11px] font-sans text-fgMuted">
        <span className="font-semibold truncate">
          {label ?? name}
          {required && <span className="text-danger ml-0.5">*</span>}
        </span>
        <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">{type}</span>
      </div>

      {type === 'readonly' ? (
        <div className="text-xs text-fgMuted bg-sidebarBg/50 p-1.5 rounded select-all font-mono truncate">
          {name === 'created_time' || name === 'last_edited_time' ? formatDatetimeValue(value) : String(value ?? '')}
        </div>
      ) : editing ? (
        <div className="flex flex-col gap-1">
          {type === 'text' ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
              autoFocus
              rows={3}
              className="w-full text-xs font-sans border border-borderSubtle rounded px-2 py-1.5 focus:outline-none focus:border-accent bg-appBg text-fg resize-y"
            />
          ) : type === 'list' ? (
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
              placeholder={t('listPlaceholder')}
              autoFocus
              className="w-full text-xs font-sans border border-borderSubtle rounded px-2 py-1.5 focus:outline-none focus:border-accent bg-appBg text-fg"
            />
          ) : type === 'select' ? (
            <select
              value={draft}
              onChange={(e) => { setDraft(e.target.value); }}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
              autoFocus
              className="w-full text-xs font-sans border border-borderSubtle rounded px-2 py-1.5 focus:outline-none focus:border-accent bg-appBg text-fg"
            >
              {options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : type === 'datetime' ? (
            <input
              type="datetime-local"
              value={toDatetimeLocal(draft)}
              onChange={(e) => setDraft(fromDatetimeLocal(e.target.value))}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
              autoFocus
              className="w-full text-xs font-sans border border-borderSubtle rounded px-2 py-1.5 focus:outline-none focus:border-accent bg-appBg text-fg"
            />
          ) : type === 'link' ? (
            <input
              type="url"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
              placeholder="https://..."
              autoFocus
              className="w-full text-xs font-sans border border-borderSubtle rounded px-2 py-1.5 focus:outline-none focus:border-accent bg-appBg text-fg"
            />
          ) : (
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
              autoFocus
              className="w-full text-xs font-sans border border-borderSubtle rounded px-2 py-1.5 focus:outline-none focus:border-accent bg-appBg text-fg"
            />
          )}
          {error && <div className="text-[10px] text-danger mt-1 font-semibold">{error}</div>}
        </div>
      ) : (
        <div
          onClick={() => { setDraft(serializeValue(value)); setEditing(true); }}
          className="text-xs py-1.5 px-2 rounded hover:bg-sidebarHoverBg/40 cursor-pointer min-h-[28px] flex items-center font-medium font-sans truncate text-fg"
        >
          {value === undefined || value === null || value === '' ? (
            <span className="text-fgMuted italic font-normal">{t('emptyValue')}</span>
          ) : (
            <span>{type === 'datetime' ? formatDatetimeValue(value) : displayValue(value, type, locale)}</span>
          )}
        </div>
      )}
    </div>
  );
}

function serializeValue(v: unknown): string {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function parseValue(s: string, type: FieldType): unknown {
  if (s.trim() === '') return '';
  switch (type) {
    case 'list': return s.split(',').map((x) => x.trim()).filter(Boolean);
    case 'datetime': return new Date(s).toISOString();
    default: return s;
  }
}

function displayValue(v: unknown, type: FieldType, locale: string): string {
  if (type === 'datetime' && typeof v === 'string') {
    try { return new Date(v).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US'); } catch { return v; }
  }
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

function toDatetimeLocal(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ''; }
}

function fromDatetimeLocal(local: string): string {
  if (!local) return '';
  try {
    return new Date(local).toISOString();
  } catch { return local; }
}
