/**
 * 文件名清洗: 去掉文件系统不安全字符, 折叠空白, 默认 "untitled"
 */
export function sanitizeFileName(name: string): string {
  if (!name) return "untitled";
  return name.replace(/[\\\/\?%\*\:\|"<>]/g, " ").trim() || "untitled";
}