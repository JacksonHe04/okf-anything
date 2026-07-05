/**
 * YAML frontmatter read/write.
 *
 * Compatible shape with the legacy `moon-escape/common/frontmatter.ts` but
 * slightly hardened:
 * - Matches both `---\n...\n---` and `---\n...\n---...` variants.
 * - Tolerant of malformed YAML (falls back to no-frontmatter).
 */
import * as fs from "fs";
import YAML from "yaml";

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;

export interface ParsedMd {
  frontmatter: Record<string, unknown> | null;
  body: string;
}

export async function readFrontmatter(filePath: string): Promise<ParsedMd> {
  const content = await fs.promises.readFile(filePath, "utf8");
  return parseFrontmatter(content);
}

export function parseFrontmatter(content: string): ParsedMd {
  const m = content.match(FRONTMATTER_RE);
  if (!m) return { frontmatter: null, body: content };
  let fm: Record<string, unknown> | null = null;
  try {
    const parsed = YAML.parse(m[1]);
    if (parsed && typeof parsed === "object") fm = parsed as Record<string, unknown>;
  } catch {
    fm = null;
  }
  const body = content.slice(m[0].length).replace(/^\s*\n/, "");
  return { frontmatter: fm, body };
}

export function writeFrontmatterBody(
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  const fm = YAML.stringify(frontmatter).trimEnd();
  const bodyClean = body.startsWith("\n") ? body : "\n" + body;
  return `---\n${fm}\n---${bodyClean}`;
}
