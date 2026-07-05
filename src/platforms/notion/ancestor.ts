/**
 * 把 `parentType === "block_id"` 的 page 归位到它真正"挂在哪个祖先 page 下面"
 *
 * 用法:
 *   const index = await buildBlockAncestorIndex(client, limiter, allSearchPages);
 *   // index: Map<ancestorPageId, Set<pageId>>
 *
 * 算法: 对每个 block_id parent 的 page X, 沿 X.parent.block_id 调 blocks.retrieve
 *       链式向上, 直到 parent.type === "page_id" 停下. 防环 + 深度上限 30.
 */
import type { Client } from "@notionhq/client";
import type { NotionLimiter } from "../../utils/limiter.js";
import type { SearchHit } from "./search.js";

export async function traceBlockAncestor(
  client: Client,
  limiter: NotionLimiter,
  startBlockId: string,
): Promise<string | null> {
  let cur = startBlockId;
  const visited = new Set<string>();
  for (let depth = 0; depth < 30; depth++) {
    if (visited.has(cur)) return null;
    visited.add(cur);
    let block: any;
    try {
      block = await limiter.run(
        () => client.blocks.retrieve({ block_id: cur }),
        `trace:${cur.slice(0, 8)}`,
      );
    } catch {
      return null;
    }
    const par = (block.parent as Record<string, unknown>) ?? {};
    const t = par.type as string;
    if (t === "page_id") return (par.page_id as string) ?? null;
    if (t !== "block_id") return null;
    cur = par.block_id as string;
  }
  return null;
}

/**
 * 构建反向索引: ancestorPageId -> Set<pageId> (祖先 page 的 block 子树下嵌的子 page)
 *
 * 359 个 `parentType === "block_id"` 的 page 通过这个索引找到归属祖先, 进而在
 * 递归遍历时跟着祖先 page 一起被拉到本地.
 */
export async function buildBlockAncestorIndex(
  client: Client,
  limiter: NotionLimiter,
  allSearchPages: SearchHit[],
): Promise<Map<string, Set<string>>> {
  const blockIdParentPages = allSearchPages.filter(
    (p) => p.parentType === "block_id" && !p.archived && p.parentId,
  );
  const index = new Map<string, Set<string>>();
  for (const p of blockIdParentPages) {
    const ancestor = await traceBlockAncestor(client, limiter, p.parentId!);
    if (ancestor) {
      const set = index.get(ancestor) ?? new Set<string>();
      set.add(p.id);
      index.set(ancestor, set);
    }
  }
  return index;
}
