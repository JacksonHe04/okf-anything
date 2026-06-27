/**
 * 预算所有 page 的最终 localPath (相对 exportRootDir).
 *
 * 为什么要预算?
 *   - streaming 顺序: 父 page 先渲染 markdown, 后才递归到子 page 拉取
 *   - 父 page 的 markdown 里如果含 mention/href 指向子 page, 渲染时子 page
 *     还没在 disk 注册表, pagePathMap 找不到 → fallback 到原文 Notion URL
 *   - 预算表在启动时一次性算好, 渲染时直接查, 就能正确重写
 *
 * 算法 (BFS 自上而下):
 *   1. 把 disk 上已注册的 page 路径填入 budget (它们的路径已固定, 不会变)
 *   2. 从顶级 (parentType=workspace) 开始 BFS, 按 parent chain 向下展开
 *   3. 每个 page 的 localPath 由 (parentDir, sanitizedTitle, kind) 决定
 *      - kind: 有 child (page_id + inline) → dir, 否则 file
 *   4. 路径冲突时 allocator 走 -1/-2 后缀
 *   5. parentType=block_id (inline) 的 page 通过 blockAncestorIndex 找 ancestor
 *   6. parentType=database/data_source/agent 等的 page 不在本预算范围 (这些
 *      走 scanAndWriteDatabase 路径, 不需要预算 localPath)
 */
import type { SearchHit } from "./search.js";
import { sanitizeFileName } from "../../../moon-escape/common/sanitize.js";
import type { PathAllocator } from "../../../moon-escape/common/path-allocator.js";
import * as path from "path";

/** notion_id → 相对 exportRootDir 的 localPath */
export type BudgetedPathMap = Map<string, string>;

export interface BudgetOptions {
  exportRootDir: string;
  pages: SearchHit[];
  dataSources: SearchHit[];
  blockAncestorIndex: Map<string, Set<string>>;
  /** disk 上已注册的 page (notion_id → localPath) */
  existing: Map<string, string>;
  /** 路径分配器, 预填了 existing + 我们即将分配的预算路径 */
  allocator: PathAllocator;
}

export function buildBudgetedPathMap(opts: BudgetOptions): BudgetedPathMap {
  const { pages, blockAncestorIndex, existing, allocator } = opts;
  const budget: BudgetedPathMap = new Map();

  // 1. disk 上已有: 填入 budget + 标记已分配 (allocator 已 preallocated)
  for (const [id, relPath] of existing) {
    budget.set(id, relPath);
  }

  // 2. child 索引 (page_id + inline)
  const childByParent = new Map<string, string[]>();
  for (const p of pages) {
    if (p.parentType === "page_id" && p.parentId) {
      const list = childByParent.get(p.parentId) ?? [];
      list.push(p.id);
      childByParent.set(p.parentId, list);
    }
  }
  for (const [ancestor, ids] of blockAncestorIndex) {
    const list = childByParent.get(ancestor) ?? [];
    for (const id of ids) list.push(id);
    childByParent.set(ancestor, list);
  }

  // 3. inline page (parentType=block_id) → 通过 blockAncestorIndex 反查 ancestor
  //    预算 inline 时, 它是 ancestor 的 child, parentDir 是 ancestor 的 localPath.dirname
  //    inline 必须排在 ancestor 之后算
  const inlineChildOf = new Map<string, string | null>(); // inline pageId -> ancestorId (or null)
  for (const [ancestor, ids] of blockAncestorIndex) {
    for (const id of ids) inlineChildOf.set(id, ancestor);
  }

  // 4. BFS: 从"父已 budget"的 page 开始, 处理其 children
  //    初始: 所有顶级 (parentType=workspace) + 没有祖先的 inline (orphan ancestor)
  const remaining = new Set(pages.map((p) => p.id));
  for (const id of remaining) if (budget.has(id)) remaining.delete(id);

  let safety = 100;
  let lastProgress = remaining.size + 1;
  while (remaining.size > 0 && safety-- > 0) {
    let progressed = 0;
    for (const id of Array.from(remaining)) {
      const p = pages.find((x) => x.id === id);
      if (!p) { remaining.delete(id); continue; }

      let parentDir: string | null = null;
      if (p.parentType === "workspace") {
        parentDir = ".";
      } else if (p.parentType === "page_id" && p.parentId) {
        if (budget.has(p.parentId)) {
          const parentPath = budget.get(p.parentId)!;
          parentDir = path.dirname(parentPath);
        }
      } else if (p.parentType === "block_id" && p.parentId) {
        const ancestor = inlineChildOf.get(id);
        if (ancestor && budget.has(ancestor)) {
          parentDir = path.dirname(budget.get(ancestor)!);
        }
      } else {
        // database / data_source / agent 等, 不在本预算范围
        remaining.delete(id);
        continue;
      }

      if (parentDir === null) continue; // 父未 budget, 等下一轮

      const sanitized = sanitizeFileName(p.title || "untitled");
      const hasChild = (childByParent.get(id)?.length ?? 0) > 0;
      const kind: "file" | "dir" = hasChild ? "dir" : "file";

      const localPath = allocator.allocate(parentDir, sanitized, kind);
      budget.set(id, localPath);
      remaining.delete(id);
      progressed++;
    }
    if (progressed === 0) {
      console.warn(
        `  ⚠ budget: ${remaining.size} page 解析父失败, 跳过 (orphan page_id parent 或 cycle)`,
      );
      break;
    }
    if (progressed >= lastProgress) {
      // 正常推进
    }
    lastProgress = progressed;
  }

  return budget;
}
