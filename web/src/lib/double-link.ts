export function isMdLink(href: string): boolean {
  return href.endsWith('.md');
}

/**
 * 解析相对路径到文件
 * @param currentPath 当前文件路径
 * @param href 链接 href
 * @param allFiles 所有已知文件路径的 Set
 * @returns 解析后的绝对路径,或 null
 */
export function resolveMdPath(
  currentPath: string,
  href: string,
  allFiles: Set<string>,
): string | null {
  if (!isMdLink(href)) return null;
  const lastSlash = currentPath.lastIndexOf('/');
  const currentDir = lastSlash === -1 ? '' : currentPath.slice(0, lastSlash);
  const parts = currentDir.split('/').filter(Boolean);
  for (const seg of href.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.' && seg !== '') parts.push(seg);
  }
  const resolved = parts.join('/');
  return allFiles.has(resolved) ? resolved : null;
}

/**
 * 扫描 markdown 文本找出所有 .md 链接
 */
export function extractMdLinks(text: string): { href: string; text: string }[] {
  const out: { href: string; text: string }[] = [];
  const re = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
  let m;
  while ((m = re.exec(text))) {
    out.push({ href: m[2], text: m[1] });
  }
  return out;
}
