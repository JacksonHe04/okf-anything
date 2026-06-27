/**
 * 通用 try/catch 包装: 失败时 warn 日志并返回 null
 */
export async function safeRetrieve<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠ ${label}: ${msg}`);
    return null;
  }
}