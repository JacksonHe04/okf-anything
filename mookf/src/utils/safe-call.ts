/**
 * try/catch wrapper that logs a warning and returns null on failure.
 */
export async function safeRetrieve<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠ ${label}: ${msg}`);
    return null;
  }
}
