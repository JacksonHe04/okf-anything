/**
 * 最近打开文件列表（localStorage 持久化）。
 */

const KEY = 'moon-recent-files';
const MAX = 10;

export function getRecentFiles(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function pushRecentFile(path: string): void {
  if (typeof window === 'undefined') return;
  const list = getRecentFiles().filter((p) => p !== path);
  list.unshift(path);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function clearRecentFiles(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}