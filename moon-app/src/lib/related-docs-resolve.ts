/**
 * 关联文档解析器。
 *
 * 输入：所有 markdown 文件的 { path, text } 列表 + 当前文件路径。
 * 输出：
 * - outgoing: 当前文件里 [[link]] 链出去的目标（按出现顺序）
 * - incoming: 别的文件链向当前文件（按文件名排序）
 *
 * 双链识别：
 * - [[path]]           → 精确路径
 * - [[path|alias]]     → 精确路径 + 显示别名（我们只用路径）
 * - 不区分大小写、忽略前后空格
 */

import { resolveMdPath } from './double-link';

export interface RelatedDoc {
  /** 相对工作区的目标路径（解析后） */
  path: string;
  /** 显示名（取 basename，无后缀） */
  label: string;
  /** 引用类型：outgoing（当前文档主动链出去）/ incoming（被引用） */
  refType: 'outgoing' | 'incoming';
}

export interface ResolvedRelated {
  outgoing: RelatedDoc[];
  incoming: RelatedDoc[];
}

interface Input {
  /** 当前文档的相对路径（不含工作区） */
  currentPath: string;
  /** 全部 .md 文件 */
  allFiles: { path: string; text: string }[];
}

// 匹配 [[...]]，捕获内部内容（不含方括号）
const WIKILINK_RE = /\[\[([^\]\n]+?)\]\]/g;

// 从路径拿 label（basename 去掉 .md）
function labelOf(path: string): string {
  const base = path.split('/').pop() ?? path;
  return base.replace(/\.md$/i, '');
}

// 从单篇 markdown 文本里抽出 [[...]] 引用路径列表
function extractWikilinks(text: string): string[] {
  if (!text) return [];
  // 去掉 fenced code block
  const cleaned = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  WIKILINK_RE.lastIndex = 0;
  while ((m = WIKILINK_RE.exec(cleaned)) !== null) {
    const inner = (m[1] ?? '').trim();
    if (!inner) continue;
    // 可能是 [[path|alias]] 或 [[alias]]（无后缀，纯别名形式）
    const target = inner.split('|')[0]?.trim() ?? '';
    if (target) out.push(target);
  }
  return out;
}

export function resolveRelated({ currentPath, allFiles }: Input): ResolvedRelated {
  const allPaths = new Set(allFiles.map((f) => f.path));

  // outgoing：当前文档链出去的目标
  const current = allFiles.find((f) => f.path === currentPath);
  const outgoing: RelatedDoc[] = [];
  if (current) {
    const links = extractWikilinks(current.text);
    const seen = new Set<string>();
    for (const link of links) {
      // link 可能是 [[alias]] 或 [[path]]
      let resolved: string | null = null;
      if (link.includes('/') || link.endsWith('.md')) {
        resolved = resolveMdPath(current.path, link, allPaths);
      } else {
        // 别名形式：尝试 basename 匹配（大小写不敏感）
        const lower = link.toLowerCase();
        const candidate = Array.from(allPaths).find((p) => labelOf(p).toLowerCase() === lower);
        resolved = candidate ?? null;
      }
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        outgoing.push({ path: resolved, label: labelOf(resolved), refType: 'outgoing' });
      }
    }
  }

  // incoming：所有其他文件里 [[... currentPath ...]] 或 [[label]]
  const currentLabel = labelOf(currentPath);
  const incoming: RelatedDoc[] = [];
  for (const file of allFiles) {
    if (file.path === currentPath) continue;
    const links = extractWikilinks(file.text);
    const matched = links.some((link) => {
      if (link === currentPath) return true;
      if (link.toLowerCase() === currentLabel.toLowerCase()) return true;
      if (link.endsWith('.md') && resolveMdPath(file.path, link, allPaths) === currentPath) {
        return true;
      }
      return false;
    });
    if (matched) {
      incoming.push({ path: file.path, label: labelOf(file.path), refType: 'incoming' });
    }
  }
  // incoming 按 label 排序
  incoming.sort((a, b) => a.label.localeCompare(b.label));

  return { outgoing, incoming };
}