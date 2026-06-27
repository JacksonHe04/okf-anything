/**
 * 从 markdown 字符串中提取 headings（H1-H6）。
 * 用于右栏「目录」tab。
 *
 * 不引入额外依赖，用最简单的正则实现；
 * 只识别行首的 `# `、`## ` ... 形式，代码块内的井号忽略。
 */

export interface Heading {
  level: number; // 1-6
  text: string;
  /** 用作点击跳转的锚点 ID（去掉空格、加 lowercase） */
  anchor: string;
  /** 在 markdown 中的字符偏移，用于编辑器跳转 */
  offset: number;
}

const HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*\s*$/gm;

export function extractHeadings(markdown: string): Heading[] {
  if (!markdown) return [];

  // 简单粗暴：去掉 fenced code block 避免误匹配
  const cleaned = markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  const out: Heading[] = [];
  let m: RegExpExecArray | null;
  HEADING_RE.lastIndex = 0;
  while ((m = HEADING_RE.exec(cleaned)) !== null) {
    const hashes = m[1] ?? '';
    const text = (m[2] ?? '').trim();
    if (!text) continue;
    out.push({
      level: hashes.length,
      text,
      anchor: slugify(text),
      offset: m.index,
    });
  }
  return out;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\p{Letter}\p{Number}\-_]/gu, '');
}