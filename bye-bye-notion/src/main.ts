import * as fs from "fs";
import * as path from "path";
import YAML from "yaml";
import {
  resolveExportDir,
  parseFlagValue,
  sanitizeFileName,
  createPathAllocator,
  safeRetrieve,
  parseFrontmatter,
  countMdFiles,
  DEFAULT_EXPORT_DIR,
  EXPORT_DIR_HELP,
} from "../../moon-escape/common/index.js";
import { createNotionClient } from "./notion/client.js";
import { NotionLimiter } from "./limiter.js";
import { retrievePage } from "./notion/page.js";
import { retrieveDataSource, queryAllRows } from "./notion/database.js";
import { makeFetchChildren, fetchAllBlocks, buildTree } from "./notion/blocks.js";
import { searchAll, type SearchHit } from "./notion/search.js";
import { buildBlockAncestorIndex } from "./notion/ancestor.js";
import { buildBudgetedPathMap } from "./notion/budget.js";
import { renderBlocksToMarkdown } from "./notion/markdown.js";

interface RegistryEntry {
  /** 相对 exportRootDir 的路径 (与 node.localPath 一致) */
  localPath: string;
  /** 解析自 frontmatter，用于父页 index.md 中生成链接文字 */
  title: string;
  /** "page" | "database" */
  type: "page" | "database";
}

interface AppContext {
  client: ReturnType<typeof createNotionClient>["client"];
  limiter: NotionLimiter;
  fetchChildren: ReturnType<typeof makeFetchChildren>;
  allSearchPages: SearchHit[];
  allSearchDataSources: SearchHit[];
  /**
   * block_id parent 的 page 反向索引:
   *   祖先 page_id → Set<page_id> (该祖先 page 的 block 子树里嵌的子 page)
   * 359 个 `parentType === "block_id"` 的 page 都要靠这个索引找到归属祖先。
   */
  blockAncestorIndex: Map<string, Set<string>>;
  /** notion_id → 注册表项：disk 加载的 + 本次新增的 */
  registry: Map<string, RegistryEntry>;
  /** 路径分配器（已占用的小写路径集合，case-insensitive） */
  allocator: ReturnType<typeof createPathAllocator>;
  /**
   * 预算路径表: 启动时算好所有 page 的最终 localPath (相对 exportRootDir).
   * 渲染时用作 pagePathMap, 让引用能重写到还没实际写入 disk 的 page.
   */
  budgetedPathMap: Map<string, string>;
  /** 本次新写入/统计 */
  stats: { written: number; skipped: number; failed: number };
  exportRootDir: string;
}

/**
 * Notion 私有属性扁平化（Notion API 的 properties 比较啰嗦，OKF frontmatter 直接要扁平字段）
 */
function flattenProperties(properties: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, prop] of Object.entries(properties)) {
    if (!prop || typeof prop !== "object") continue;
    if (prop.type === "title") continue;
    let val: any = null;
    switch (prop.type) {
      case "checkbox": val = prop.checkbox; break;
      case "number": val = prop.number; break;
      case "select": val = prop.select?.name ?? null; break;
      case "multi_select":
        val = Array.isArray(prop.multi_select) ? prop.multi_select.map((s: any) => s.name) : [];
        break;
      case "status": val = prop.status?.name ?? null; break;
      case "date":
        if (prop.date) val = prop.date.end ? `${prop.date.start} ~ ${prop.date.end}` : prop.date.start;
        break;
      case "rich_text":
        val = Array.isArray(prop.rich_text) ? prop.rich_text.map((r: any) => r.plain_text || "").join("") : "";
        break;
      case "url": val = prop.url; break;
      case "email": val = prop.email; break;
      case "phone_number": val = prop.phone_number; break;
      case "people":
        val = Array.isArray(prop.people) ? prop.people.map((p: any) => p.name || p.id) : [];
        break;
      case "relation":
        val = Array.isArray(prop.relation) ? prop.relation.map((r: any) => r.id) : [];
        break;
      case "files":
        val = Array.isArray(prop.files) ? prop.files.map((f: any) => f.name || f.file?.url || f.external?.url) : [];
        break;
      case "formula":
        if (prop.formula) val = prop.formula.string ?? prop.formula.number ?? prop.formula.boolean ?? prop.formula.date ?? null;
        break;
      default: break;
    }
    if (val !== null && val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0)) {
      result[key] = val;
    }
  }
  return result;
}

/**
 * 从 notion.so URL / 紧凑 UUID / 带连字符 UUID 中提取标准 8-4-4-4-12 UUID
 */
function extractUuid(input: string): string {
  let s = input.trim();
  const urlMatch = s.match(/notion\.so\/[^/]+\/([0-9a-fA-F-]+)/);
  if (urlMatch) s = urlMatch[1];
  const compact = s.replace(/-/g, "");
  if (/^[0-9a-fA-F]{32}$/.test(compact)) {
    return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
  }
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s)) {
    return s;
  }
  throw new Error(`Cannot extract UUID from: ${input}`);
}

/**
 * 启动时递归扫描 exportRootDir，从每个 .md 的 frontmatter 抽出 notion_id → 路径 + 标题 的注册表。
 * 这是 notion_id 幂等的核心：重跑时，命中注册表的节点直接跳过整棵子树。
 */
async function loadRegistry(exportRootDir: string): Promise<Map<string, RegistryEntry>> {
  const map = new Map<string, RegistryEntry>();
  if (!fs.existsSync(exportRootDir)) return map;

  async function walk(dir: string): Promise<void> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.isFile() && e.name.endsWith(".md")) {
        try {
          const content = await fs.promises.readFile(full, "utf8");
          const { frontmatter } = parseFrontmatter(content);
          if (frontmatter && typeof frontmatter.notion_id === "string") {
            map.set(frontmatter.notion_id, {
              localPath: path.relative(exportRootDir, full),
              title: typeof frontmatter.title === "string" ? frontmatter.title : "untitled",
              type: frontmatter.type === "Notion Database" ? "database" : "page",
            });
          }
        } catch (err) {
          // 单个 .md 解析失败不影响其他
        }
      }
    }
  }
  await walk(exportRootDir);
  return map;
}

/**
 * 流式扫描 + 立即写盘：扫到一个 page 节点时（不论 leaf 还是 non-leaf）就把它写到本地，
 * 父页的 index.md 也包含子页链接。挂掉时已扫描的都已经在 exportRootDir 里。
 */
async function scanAndWritePage(
  ctx: AppContext,
  pageId: string,
  parentDir: string
): Promise<RegistryEntry | null> {
  // 1. 注册表命中：跳过整棵子树（已写过的内容不重写）
  //    但仍然向下递归到 child page (page_id + inline), 目的是让 inline 补救机制
  //    能 propagate 到叶: 一个 cached page 自己的 inline child 可能没在
  //    blockAncestorIndex 里, 但更深的子孙的 inline child 是的.
  //    性能影响: 每次 re-run 会全树穿透; 真正去重写在 child 走"未 cached"分支时
  //    才发生, 这里只是 propagate.
  //
  // 修复 A: 如果 cached 是 file 形式 (e.g. ".../Transportation DONTKILL.md") 但
  //         实际有 child (page_id + inline), 必须 rename 成 dir 形式, 否则子 page
  //         会写到同级而非子目录里.
  const cached = ctx.registry.get(pageId);
  if (cached) {
    ctx.stats.skipped++;
    const inlineChildIds = Array.from(ctx.blockAncestorIndex.get(pageId) ?? []);
    const pageIdChildIds = ctx.allSearchPages
      .filter((p) => p.parentType === "page_id" && p.parentId === pageId)
      .map((p) => p.id);
    // child_database blocks 也要 propagate (Notion 2025 inline database)
    const childDbIdsFromBlocks = new Set<string>();
    const directChildrenForDb = await safeRetrieve(
      () => ctx.fetchChildren(pageId),
      `children of ${pageId.slice(0, 8)} (cached)`
    ) || [];
    for (const c of directChildrenForDb) {
      if (c.type === "child_database") childDbIdsFromBlocks.add(c.id);
    }
    const hasChildren =
      inlineChildIds.length > 0 ||
      pageIdChildIds.length > 0 ||
      childDbIdsFromBlocks.size > 0;

    let targetDir = path.dirname(path.resolve(ctx.exportRootDir, cached.localPath));
    if (hasChildren) {
      // 检查 cached 是否已是 dir 形式 (ends with /index.md)
      const isDirForm = cached.localPath.endsWith(`${path.sep}index.md`) || cached.localPath === "index.md";
      if (!isDirForm) {
        const oldAbs = path.resolve(ctx.exportRootDir, cached.localPath);
        const oldName = path.basename(cached.localPath, ".md");
        const newDir = path.join(path.dirname(oldAbs), oldName);
        const newIndex = path.join(newDir, "index.md");
        if (fs.existsSync(oldAbs)) {
          if (!fs.existsSync(newDir)) {
            // 标准情况: file → dir
            fs.mkdirSync(newDir, { recursive: true });
            fs.renameSync(oldAbs, newIndex);
          } else if (!fs.existsSync(newIndex)) {
            // dir 已存在但无 index.md: 复制 file 内容到 dir/index.md, 删 old
            fs.copyFileSync(oldAbs, newIndex);
            fs.unlinkSync(oldAbs);
          } else {
            // dir + index.md 都已存在: old 是过时的, 删
            fs.unlinkSync(oldAbs);
          }
          const newRel = path.relative(ctx.exportRootDir, newIndex);
          cached.localPath = newRel;
          ctx.registry.set(pageId, cached);
          ctx.allocator.allocated.delete(oldAbs.toLowerCase());
          ctx.allocator.allocated.add(newIndex.toLowerCase());
          targetDir = newDir;
        }
      }
    }

    // 收集所有需要向下 propagate 的 child id
    const propagateIds = new Set<string>();
    for (const id of inlineChildIds) propagateIds.add(id);
    for (const id of pageIdChildIds) propagateIds.add(id);
    for (const id of childDbIdsFromBlocks) {
      await scanAndWriteDatabase(ctx, id, targetDir);
    }
    for (const cid of propagateIds) {
      await scanAndWritePage(ctx, cid, targetDir);
    }
    return cached;
  }

  // 2. 拉取 page 元数据
  const meta = await safeRetrieve(
    () => retrievePage(ctx.client, ctx.limiter, pageId),
    `page meta ${pageId.slice(0, 8)}`
  );
  if (!meta) return null;

  const title = meta.title || "untitled";
  const sanitizedTitle = sanitizeFileName(title);

  // 3. 找子页/子库：直接 block children + search 反向引用 + block_id parent 反向索引
  const directChildren = await safeRetrieve(
    () => ctx.fetchChildren(meta.id),
    `direct children of ${meta.id.slice(0, 8)}`
  ) || [];
  const childIdsFromBlocks = new Set<string>();
  const childDbIdsFromBlocks = new Set<string>();
  for (const c of directChildren) {
    if (c.type === "child_page") childIdsFromBlocks.add(c.id);
    else if (c.type === "child_database") childDbIdsFromBlocks.add(c.id);
  }
  const linkedChildIds = ctx.allSearchPages
    .filter((p) => p.parentType === "page_id" && p.parentId === meta.id)
    .map((p) => p.id);
  // 嵌在 meta 的 block 子树里的子 page (parentType=block_id, 祖先 page 是 meta)
  const inlineChildIds = Array.from(ctx.blockAncestorIndex.get(meta.id) ?? []);
  const childIds = new Set<string>([
    ...childIdsFromBlocks,
    ...linkedChildIds,
    ...inlineChildIds,
  ]);
  const linkedDbIds = ctx.allSearchDataSources
    .filter((d) => d.parentType === "page_id" && d.parentId === meta.id)
    .map((d) => d.id);
  const dbIds = new Set<string>([...childDbIdsFromBlocks, ...linkedDbIds]);

  const isLeaf = (childIds.size === 0 && dbIds.size === 0);
  const localPath = isLeaf
    ? ctx.allocator.allocate(parentDir, sanitizedTitle, "file")
    : ctx.allocator.allocate(parentDir, sanitizedTitle, "dir");
  const targetDirForChildren = isLeaf ? parentDir : path.dirname(localPath);

  // 4. 递归处理子页 / 子库
  const childEntries: RegistryEntry[] = [];
  if (!isLeaf) {
    for (const cid of childIds) {
      const entry = await scanAndWritePage(ctx, cid, targetDirForChildren);
      if (entry) childEntries.push(entry);
    }
    for (const dbid of dbIds) {
      const entry = await scanAndWriteDatabase(ctx, dbid, targetDirForChildren);
      if (entry) childEntries.push(entry);
    }
  }

  // 5. 抓取本页 blocks 并渲染 markdown
  let markdownBody = "";
  try {
    const blocks = await fetchAllBlocks(ctx.fetchChildren, meta.id);
    const blockTree = buildTree(blocks);
    const renderCtx = {
      // 修复 B: 用 budgetedPathMap 代替 registry-only 的 pagePathMap, 让引用能重写
      //        到还没实际写入 disk 的 page 路径 (streaming 顺序: 父先渲染, 子后拉)
      pagePathMap: ctx.budgetedPathMap,
      currentPagePath: localPath,
      indentLevel: 0
    };
    markdownBody = renderBlocksToMarkdown(blockTree, renderCtx);
  } catch (err) {
    console.warn(`  ⚠ fetchAllBlocks ${meta.id.slice(0, 8)}: ${err instanceof Error ? err.message : err}`);
  }

  // 6. 拼 frontmatter
  const frontmatter: Record<string, any> = {
    type: "Notion Page",
    title,
    resource: meta.url,
    timestamp: meta.lastEditedTime,
    notion_id: meta.id,
    created_time: meta.createdTime,
    last_edited_time: meta.lastEditedTime,
    notion_parent_type: meta.parentType,
    notion_parent_id: meta.parentId,
  };
  if (meta.properties) {
    const flatProps = flattenProperties(meta.properties);
    if (Object.keys(flatProps).length > 0) frontmatter.properties = flatProps;
  }

  // 7. 非 leaf 页：追加子节点链接列表
  let fileContent = `---\n${YAML.stringify(frontmatter)}---\n\n# ${title}\n\n${markdownBody}\n`;
  if (!isLeaf && childEntries.length > 0) {
    const linkLines = childEntries.map((c) => {
      const relPath = path.relative(path.dirname(localPath), c.localPath);
      let p = relPath;
      if (!p.startsWith(".") && !p.startsWith("/")) p = "./" + p;
      return `- [${c.title}](${encodeURI(p)})`;
    });
    fileContent += `\n## Children\n\n${linkLines.join("\n")}\n`;
  }

  // 8. 写盘 + 注册
  const absoluteFilePath = path.resolve(ctx.exportRootDir, localPath);
  try {
    fs.mkdirSync(path.dirname(absoluteFilePath), { recursive: true });
    fs.writeFileSync(absoluteFilePath, fileContent, "utf8");
    ctx.stats.written++;
    process.stdout.write(`  ✓ wrote ${title} (${meta.id.slice(0, 8)}…)\n`);
  } catch (err) {
    ctx.stats.failed++;
    console.error(`  ✗ write failed ${title} (${meta.id.slice(0, 8)}):`, err);
    return null;
  }

  const entry: RegistryEntry = { localPath, title, type: "page" };
  ctx.registry.set(meta.id, entry);
  return entry;
}

async function scanAndWriteDatabase(
  ctx: AppContext,
  dbId: string,
  parentDir: string
): Promise<RegistryEntry | null> {
  const cached = ctx.registry.get(dbId);
  if (cached) {
    ctx.stats.skipped++;
    return cached;
  }

  // Notion 2025 model: child_database block id === DATABASE id (container)
  //   database 包含 1+ dataSource; rows 的 parent 引用 dataSource_id
  //   必须先 databases.retrieve({ database_id }) → 取 dataSources[0].id
  //   再用 dataSource_id 调 retrieveDataSource + queryAllRows
  const db: any = await safeRetrieve(
    () => (ctx.client.databases as any).retrieve({ database_id: dbId }),
    `database ${dbId.slice(0, 8)}`
  );
  let resolvedDsId = dbId;
  if (db && Array.isArray(db.data_sources) && db.data_sources.length > 0) {
    resolvedDsId = db.data_sources[0].id as string;
  }

  const ds = await safeRetrieve(
    () => retrieveDataSource(ctx.client, ctx.limiter, resolvedDsId),
    `ds meta ${resolvedDsId.slice(0, 8)}`
  );
  if (!ds) return null;

  const title = ds.title || "untitled";
  const sanitizedTitle = sanitizeFileName(title);

  const rows = await safeRetrieve(
    () => queryAllRows(ctx.client, ctx.limiter, resolvedDsId),
    `rows for ds ${resolvedDsId.slice(0, 8)}`
  ) || [];

  const isLeaf = rows.length === 0;
  const localPath = isLeaf
    ? ctx.allocator.allocate(parentDir, sanitizedTitle, "file")
    : ctx.allocator.allocate(parentDir, sanitizedTitle, "dir");
  const targetDirForChildren = isLeaf ? parentDir : path.dirname(localPath);

  // 递归处理每行
  const rowEntries: RegistryEntry[] = [];
  if (!isLeaf) {
    for (const r of rows) {
      const entry = await scanAndWritePage(ctx, r.id, targetDirForChildren);
      if (entry) rowEntries.push(entry);
    }
  }

  // 数据库本身的 frontmatter
  const frontmatter: Record<string, any> = {
    type: "Notion Database",
    title,
    resource: ds.url,
    timestamp: ds.lastEditedTime,
    notion_id: dbId,
    created_time: ds.createdTime,
    last_edited_time: ds.lastEditedTime,
    notion_parent_type: ds.parentType,
    notion_parent_id: ds.parentId,
  };

  let fileContent = `---\n${YAML.stringify(frontmatter)}---\n\n# ${title}\n\n`;
  if (!isLeaf && rowEntries.length > 0) {
    const linkLines = rowEntries.map((c) => {
      const relPath = path.relative(path.dirname(localPath), c.localPath);
      let p = relPath;
      if (!p.startsWith(".") && !p.startsWith("/")) p = "./" + p;
      return `- [${c.title}](${encodeURI(p)})`;
    });
    fileContent += `## Rows (${rowEntries.length})\n\n${linkLines.join("\n")}\n`;
  } else {
    fileContent += `*(no rows)*\n`;
  }

  const absoluteFilePath = path.resolve(ctx.exportRootDir, localPath);
  try {
    fs.mkdirSync(path.dirname(absoluteFilePath), { recursive: true });
    fs.writeFileSync(absoluteFilePath, fileContent, "utf8");
    ctx.stats.written++;
    process.stdout.write(`  ✓ wrote ${title} (db, ${rows.length} rows, ${ds.id.slice(0, 8)}…)\n`);
  } catch (err) {
    ctx.stats.failed++;
    console.error(`  ✗ write failed ${title} (db):`, err);
    return null;
  }

  const entry: RegistryEntry = { localPath, title, type: "database" };
  ctx.registry.set(ds.id, entry);
  return entry;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: npm start -- [options]

Modes (mutually exclusive):
  --root <id>, -r <id>       Start from a Notion page (recursive)
  --data-source <id>, -ds <id>  Pull a specific database directly

Options:
  --parent-dir <path>           Parent directory for data_source mode (relative to export dir)
  ${EXPORT_DIR_HELP}
      也可以通过环境变量 BYE_BYE_EXPORT_DIR 设置

Behavior:
  - Streams writes: each page is written to disk the moment it's done.
  - Idempotent via notion_id: re-running skips already-exported subtrees
    (detected from frontmatter of existing .md files under exportRootDir).
  - To force re-export of a subtree, delete the parent .md or its directory.

Default export directory: ${DEFAULT_EXPORT_DIR}
`);
    process.exit(0);
  }

  let rootId: string | null = null;
  let dataSourceId: string | null = null;
  let overrideParentDir: string | null = null;

  const rootArg = parseFlagValue(args, "--root") ?? parseFlagValue(args, "-r");
  const dsArg = parseFlagValue(args, "--data-source") ?? parseFlagValue(args, "-ds");
  const parentDirArg = parseFlagValue(args, "--parent-dir") ?? parseFlagValue(args, "-pd");

  if (rootArg) rootId = extractUuid(rootArg);
  if (dsArg) dataSourceId = extractUuid(dsArg);
  if (parentDirArg) overrideParentDir = parentDirArg;

  // 互斥检查
  if (rootId && dataSourceId) {
    console.error("Error: --root and --data-source are mutually exclusive.");
    process.exit(1);
  }
  if (!rootId && !dataSourceId) {
    console.error("Must provide either --root <id> or --data-source <id>.");
    process.exit(1);
  }

  const exportDir = resolveExportDir({ argv: args });
  const exportRootDir = exportDir.resolved;

  console.log("→ bye-bye-notion — Starting Migration (streaming + notion_id dedup)");
  console.log(`  Mode:       ${rootId ? "page (recursive)" : "data_source (direct)"}`);
  console.log(`  ID:         ${rootId ?? dataSourceId}`);
  console.log(`  Export dir: ${exportRootDir} (source: ${exportDir.source}, raw: ${exportDir.raw})`);

  // 启动时从 exportRootDir 加载 notion_id 注册表
  console.log("[init] Loading notion_id registry from export dir ...");
  const t0 = Date.now();
  const registry = await loadRegistry(exportRootDir);
  console.log(`[init] loaded ${registry.size} entries (${Date.now() - t0}ms)\n`);

  const { client, tokenLast4 } = createNotionClient();
  const limiter = new NotionLimiter();
  const fetchChildren = makeFetchChildren(client, limiter);
  console.log(`  Notion token (last 4): ****${tokenLast4}\n`);

  console.log("[1/3] Pre-fetching all pages & data sources...");
  const allSearchPages = await searchAll(client, limiter, "page");
  console.log(`  ✓ found ${allSearchPages.length} pages in workspace`);
  const allSearchDataSources = await searchAll(client, limiter, "data_source");
  console.log(`  ✓ found ${allSearchDataSources.length} data sources in workspace\n`);

  // 1.5 把 `parentType === "block_id"` 的 page 追溯到祖先 page,
  //     构建反向索引: ancestorPageId -> Set<pageId> (祖先 page 的 block 子树下嵌的子 page)
  console.log("[1.5/3] Tracing block_id parents to ancestor pages...");
  const blockAncestorIndex = await buildBlockAncestorIndex(client, limiter, allSearchPages);
  let tracedCount = 0;
  for (const s of blockAncestorIndex.values()) tracedCount += s.size;
  console.log(
    `  ✓ traced ${tracedCount} block_id parents to ${blockAncestorIndex.size} ancestor pages`,
  );

  // 把磁盘上已注册的文件路径预占进 allocator，避免本次新增产生冲突
  const allocator = createPathAllocator(
    Array.from(registry.values()).map((e) =>
      path.resolve(exportRootDir, e.localPath),
    ),
  );

  // 1.6 预算所有 page 的最终 localPath (含未写入 disk 的), 渲染时用作完整 pagePathMap
  console.log("[1.6/3] Budgeting all page paths for link rewriting...");
  const existingPaths = new Map<string, string>();
  for (const [id, e] of registry) existingPaths.set(id, e.localPath);
  const budgetedPathMap = buildBudgetedPathMap({
    exportRootDir,
    pages: allSearchPages,
    dataSources: allSearchDataSources,
    blockAncestorIndex,
    existing: existingPaths,
    allocator,
  });
  console.log(`  ✓ budgeted ${budgetedPathMap.size} page paths`);

  const ctx: AppContext = {
    client,
    limiter,
    fetchChildren,
    allSearchPages,
    allSearchDataSources,
    blockAncestorIndex,
    registry,
    allocator,
    budgetedPathMap,
    stats: { written: 0, skipped: 0, failed: 0 },
    exportRootDir,
  };

  console.log("[2/3] Streaming pull...\n");

  if (dataSourceId) {
    // --data-source 模式：直接拉取数据库
    // 先获取 dataSource 的 parent 信息，找到对应的本地路径
    let parentDir = exportRootDir;

    // 优先使用手动指定的 parent-dir
    if (overrideParentDir) {
      parentDir = path.resolve(exportRootDir, overrideParentDir);
      console.log(`  Using override parent-dir: ${parentDir}`);
    } else {
      try {
        const ds = await retrieveDataSource(client, limiter, dataSourceId);

        // 尝试多种方式查找 parent：
        // 1. ds.parentId (来自 database_parent.page_id)
        // 2. ds.parent 中的 database_id (container ID，可能在 registry 中)
        let parentFound = false;
        const idsToTry = new Set<string>();

        if (ds.parentId) idsToTry.add(ds.parentId);

        // 直接从 API 获取 parent.database_id (container ID)
        const rawDs = await limiter.run(
          () => client.dataSources.retrieve({ data_source_id: dataSourceId }),
          `ds:${dataSourceId.slice(0, 8)}`,
        ) as any;
        if (rawDs.parent?.database_id) idsToTry.add(rawDs.parent.database_id);

        for (const id of idsToTry) {
          const parentEntry = ctx.registry.get(id);
          if (parentEntry) {
            const parentAbsPath = path.resolve(exportRootDir, parentEntry.localPath);
            parentDir = path.dirname(parentAbsPath);
            console.log(`  Parent found locally: ${parentEntry.title} → ${parentDir}`);
            parentFound = true;
            break;
          }
        }

        if (!parentFound) {
          const triedIds = Array.from(idsToTry).map(id => id.slice(0, 8) + "…").join(", ");
          console.log(`  Parent not in registry [${triedIds}], using exportRootDir`);
        }
      } catch (e) {
        console.warn(`  Could not fetch dataSource metadata, using exportRootDir: ${e}`);
      }
    }

    const result = await scanAndWriteDatabase(ctx, dataSourceId, parentDir);
    if (!result) {
      console.error(`\n  ✗ Could not pull data_source ${dataSourceId.slice(0, 8)}`);
      process.exit(1);
    }
  } else {
    // --root 模式：递归拉取页面
    const result = await scanAndWritePage(ctx, rootId!, exportRootDir);
    if (!result) {
      console.error(`\n  ✗ Could not pull root ${rootId!.slice(0, 8)}`);
      process.exit(1);
    }
  }

  console.log(`\n[3/3] Done! Wrote ${ctx.stats.written} new, skipped ${ctx.stats.skipped} (already exported), ${ctx.stats.failed} failed.`);
  console.log(`  Total .md files in ${exportRootDir}: ${countMdFiles(exportRootDir)}`);
}

main().catch((err) => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});