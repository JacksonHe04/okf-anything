/**
 * BFS 递归拉取整棵 block tree
 *
 * Notion API 没有"一拉到底"接口:
 *   GET /v1/blocks/{id}/children 只返回一层
 *   has_children === true 时必须对该 block 再发一次请求
 *
 * 队列策略: BFS,避免深层递归爆栈
 * 限流: 每次 API 调用走 limiter (3 req/s + 429 backoff)
 */

export interface BlockLite {
  id: string;
  type: string;
  hasChildren: boolean;
  raw: Record<string, unknown>;
}

export interface FetchOptions {
  maxDepth?: number;
  onProgress?: (fetched: number) => void;
}

export async function fetchAllBlocks(
  fetchChildren: (blockId: string) => Promise<BlockLite[]>,
  rootId: string,
  opts: FetchOptions = {},
): Promise<BlockLite[]> {
  const maxDepth = opts.maxDepth ?? 20;
  const all: BlockLite[] = [];
  const queue: Array<{ id: string; depth: number }> = [
    { id: rootId, depth: 0 },
  ];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);

    const children = await fetchChildren(id);
    for (const c of children) {
      all.push(c);
      if (c.hasChildren && c.type !== "child_page" && c.type !== "child_database" && depth + 1 < maxDepth) {
        queue.push({ id: c.id, depth: depth + 1 });
      } else if (c.hasChildren && (c.type === "child_page" || c.type === "child_database")) {
        // Do not traverse into child pages or databases as they are separate entities
      } else if (c.hasChildren && depth + 1 >= maxDepth) {
        console.warn(
          `  ⚠ block ${c.id.slice(0, 8)} (${c.type}) has_children=true but maxDepth=${maxDepth} reached, skipping`,
        );
      }
    }
    opts.onProgress?.(all.length);
  }
  return all;
}

/**
 * 给一个 Notion 客户端 + limiter, 返回 fetchChildren 闭包
 */
export function makeFetchChildren(
  client: {
    blocks: {
      children: {
        list: (args: {
          block_id: string;
          page_size?: number;
          start_cursor?: string;
        }) => Promise<{
          results: Array<Record<string, unknown>>;
          has_more: boolean;
          next_cursor: string | null;
        }>;
      };
    };
  },
  limiter: { run: <T>(fn: () => Promise<T>, label?: string) => Promise<T> },
) {
  return async function fetchChildren(blockId: string): Promise<BlockLite[]> {
    const out: BlockLite[] = [];
    let cursor: string | undefined;

    while (true) {
      const res = await limiter.run(
        () =>
          client.blocks.children.list({
            block_id: blockId,
            page_size: 100,
            start_cursor: cursor,
          }),
        `blocks:${blockId.slice(0, 8)}`,
      );
      for (const raw of res.results) {
        out.push({
          id: raw.id as string,
          type: (raw.type as string) ?? "unknown",
          hasChildren: Boolean(raw.has_children),
          raw,
        });
      }
      if (!res.has_more || !res.next_cursor) break;
      cursor = res.next_cursor;
    }
    return out;
  };
}/**
 * 把 BFS 拉平的 blocks 还原成嵌套树 (按 parent -> children 关系)
 */
export interface BlockNode extends BlockLite {
  children: BlockNode[];
}

export function buildTree(rootBlocks: BlockLite[]): BlockNode[] {
  const byId = new Map<string, BlockNode>();
  for (const b of rootBlocks) {
    byId.set(b.id, { ...b, children: [] });
  }
  const roots: BlockNode[] = [];
  for (const b of rootBlocks) {
    const node = byId.get(b.id)!;
    const parentId = (b.raw.parent as Record<string, unknown> | undefined)
      ?.block_id as string | undefined;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}