/**
 * OKF 11 字段 → lucide icon 映射。
 *
 * 在右栏「属性」tab 用，每个 PropertyRow 需要 icon。
 */

import {
  Type,
  AlignLeft,
  Tag,
  Clock,
  Hash,
  Calendar,
  Link2,
  FolderOpen,
  FileText,
  Database,
  type LucideIcon,
} from 'lucide-react';

export const FIELD_ICONS: Record<string, LucideIcon> = {
  // OKF 6（contract 蓝）
  title: Type,
  type: FileText,
  description: AlignLeft,
  resource: Link2,
  tags: Tag,
  timestamp: Clock,

  // Notion 5（source 灰）
  notion_id: Hash,
  created_time: Calendar,
  last_edited_time: Calendar,
  notion_parent_type: FolderOpen,
  notion_parent_id: Database,
};

export const OKF_FIELDS = new Set([
  'title',
  'type',
  'description',
  'resource',
  'tags',
  'timestamp',
]);

export const NOTION_FIELDS = new Set([
  'notion_id',
  'created_time',
  'last_edited_time',
  'notion_parent_type',
  'notion_parent_id',
]);

export function fieldCategory(name: string): 'okf' | 'notion' {
  return OKF_FIELDS.has(name) ? 'okf' : 'notion';
}