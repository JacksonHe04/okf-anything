/**
 * Replace filesystem-unsafe characters with spaces, fold whitespace,
 * and fall back to "untitled" when the result would be empty.
 */
export function sanitizeFileName(name: string): string {
  if (!name) return "untitled";
  const cleaned = name.replace(/[\\\/\?%\*\:\|"<>]/g, " ").trim();
  return cleaned.length === 0 ? "untitled" : cleaned;
}
