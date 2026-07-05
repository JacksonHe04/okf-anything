import * as path from "path";
import { type BlockNode } from "./blocks.js";

export interface RenderContext {
  pagePathMap: Map<string, string>; // notionId -> localRelativePath
  currentPagePath: string; // 当前页面文件路径，例如 'local/World’s End Notion/index.md'
  indentLevel: number;
}

/** Type-erased alias for Notion raw block / rich-text structures. */
type AnyObj = Record<string, any>;
type AnyArr = any[];

/**
 * 提取 URL 中 32 字符的 Notion UUID，并还原为 8-4-4-4-12 格式的 UUID
 */
function extractNotionIdFromUrl(url: string): string | null {
  const s = url.trim();
  const hex32Match = s.match(/[0-9a-fA-F]{32}/);
  if (hex32Match) {
    const compact = hex32Match[0];
    return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
  }
  const uuidMatch = s.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (uuidMatch) {
    return uuidMatch[0];
  }
  return null;
}

/**
 * 渲染 rich_text 数组为 Markdown 格式的富文本，并自动重写内部链接
 */
export function renderRichText(
  richTextArr: AnyArr | undefined,
  context: RenderContext
): string {
  if (!richTextArr || !Array.isArray(richTextArr)) return "";

  return richTextArr.map((item) => {
    let text = item.plain_text || "";
    if (!text) return "";

    // 如果全部为空格/空白，直接返回，不加 annotations 包裹
    if (/^\s+$/.test(text)) {
      return text;
    }

    // 处理 annotations 格式
    const ann = item.annotations;
    if (ann) {
      if (ann.code) {
        text = `\`${text}\``;
      } else {
        if (ann.bold) text = `**${text}**`;
        if (ann.italic) text = `*${text}*`;
        if (ann.strikethrough) text = `~~${text}~~`;
        if (ann.underline) text = `<u>${text}</u>`;
      }
    }

    // 优先处理 mention (Notion 内联 page/user/database 引用, 形如
    //   { type: "mention", mention: { type: "page", page: { id } } })
    // 与 href 不同, mention 没有 href 字段, 链接信息藏在 mention.page.id 里
    const mention = item.mention as Record<string, any> | undefined;
    if (mention && typeof mention === "object") {
      if (mention.type === "page" && mention.page?.id) {
        const targetId = mention.page.id as string;
        if (context.pagePathMap.has(targetId)) {
          const targetPath = context.pagePathMap.get(targetId)!;
          const fromDir = path.dirname(context.currentPagePath);
          let relPath = path.relative(fromDir, targetPath);
          if (!relPath.startsWith(".") && !relPath.startsWith("/")) {
            relPath = "./" + relPath;
          }
          return `[${text}](${encodeURI(relPath)})`;
        }
        // mention 的目标 page 未注册 (可能 streaming 模式下尚未拉到) — fallback 到纯文本
        return text;
      }
      // user / database / date_mention 等其它 mention 类型, 暂只输出纯文本
      return text;
    }

    // 重写并包裹 href 超链接
    let href = item.href;
    if (href) {
      const targetId = extractNotionIdFromUrl(href);
      if (targetId && context.pagePathMap.has(targetId)) {
        const targetPath = context.pagePathMap.get(targetId)!;
        const fromDir = path.dirname(context.currentPagePath);
        let relPath = path.relative(fromDir, targetPath);
        if (!relPath.startsWith(".") && !relPath.startsWith("/")) {
          relPath = "./" + relPath;
        }
        href = encodeURI(relPath);
      }
      text = `[${text}](${href})`;
    }

    return text;
  }).join("");
}

/**
 * 渲染 Notion 表格 Block 为 Markdown 表格
 */
function renderTable(tableNode: BlockNode, context: RenderContext): string {
  const indent = "  ".repeat(context.indentLevel);
  const rows = tableNode.children.filter((c) => c.type === "table_row");
  if (rows.length === 0) return "";

  const hasColHeader = Boolean((tableNode.raw as AnyObj).table?.has_column_header);

  // 提取 cell 文本并转义其中的 | 与换行
  const processedRows = rows.map((rowNode) => {
    const cells = ((rowNode.raw as AnyObj).table_row?.cells as AnyArr) || [];
    return cells.map((cellRichText) => {
      let txt = renderRichText(cellRichText, context);
      txt = txt.replace(/\|/g, "\\|");
      txt = txt.replace(/\n/g, "<br>");
      return txt;
    });
  });

  const colCount = Math.max(...processedRows.map((r) => r.length), 0);
  if (colCount === 0) return "";

  const lines: string[] = [];
  let headerRow: string[];
  let dataRows: string[][];

  if (hasColHeader) {
    headerRow = processedRows[0];
    dataRows = processedRows.slice(1);
  } else {
    headerRow = Array(colCount).fill(" ");
    dataRows = processedRows;
  }

  // 1. Header Row
  lines.push(indent + "| " + headerRow.join(" | ") + " |");
  // 2. Separator Row
  const sep = Array(colCount).fill("---");
  lines.push(indent + "| " + sep.join(" | ") + " |");
  // 3. Data Rows
  for (const r of dataRows) {
    const fullRow = [...r];
    while (fullRow.length < colCount) fullRow.push("");
    lines.push(indent + "| " + fullRow.join(" | ") + " |");
  }

  return lines.join("\n");
}

/**
 * 递归渲染单个 Block 节点
 */
export function renderBlockNode(
  node: BlockNode,
  context: RenderContext
): string {
  const indent = "  ".repeat(context.indentLevel);
  const raw = node.raw as AnyObj;
  let md = "";

  switch (node.type) {
    case "paragraph": {
      const text = renderRichText(raw.paragraph?.rich_text, context);
      md = indent + text;
      break;
    }
    case "heading_1": {
      const text = renderRichText(raw.heading_1?.rich_text, context);
      md = `# ${text}`;
      break;
    }
    case "heading_2": {
      const text = renderRichText(raw.heading_2?.rich_text, context);
      md = `## ${text}`;
      break;
    }
    case "heading_3": {
      const text = renderRichText(raw.heading_3?.rich_text, context);
      md = `### ${text}`;
      break;
    }
    case "bulleted_list_item": {
      const text = renderRichText(raw.bulleted_list_item?.rich_text, context);
      md = `${indent}- ${text}`;
      break;
    }
    case "numbered_list_item": {
      const text = renderRichText(raw.numbered_list_item?.rich_text, context);
      md = `${indent}1. ${text}`;
      break;
    }
    case "to_do": {
      const text = renderRichText(raw.to_do?.rich_text, context);
      const checked = raw.to_do?.checked ? "[x]" : "[ ]";
      md = `${indent}- ${checked} ${text}`;
      break;
    }
    case "quote": {
      const text = renderRichText(raw.quote?.rich_text, context);
      md = `${indent}> ${text}`;
      break;
    }
    case "callout": {
      const text = renderRichText(raw.callout?.rich_text, context);
      const iconObj = raw.callout?.icon;
      let iconStr = "";
      if (iconObj && typeof iconObj === "object") {
        const i = iconObj as AnyObj;
        if (i.type === "emoji") iconStr = i.emoji + " ";
      }
      md = `${indent}> ${iconStr}${text}`;
      break;
    }
    case "code": {
      const richText = raw.code?.rich_text || [];
      const codeText = richText.map((r: any) => r.plain_text || "").join("");
      const lang = raw.code?.language || "";
      md = `${indent}\`\`\`${lang}\n${codeText}\n\`\`\``;
      break;
    }
    case "divider": {
      md = `${indent}---`;
      break;
    }
    case "image": {
      const imageObj = raw.image as AnyObj | undefined;
      const url = imageObj?.file?.url || imageObj?.external?.url || "";
      const caption = renderRichText(imageObj?.caption, context);
      md = `${indent}![${caption}](${url})`;
      break;
    }
    case "file":
    case "pdf":
    case "video":
    case "audio": {
      const resourceObj = raw[node.type] as AnyObj | undefined;
      const url = resourceObj?.file?.url || resourceObj?.external?.url || "";
      const caption = renderRichText(resourceObj?.caption, context);
      md = `${indent}[${node.type.toUpperCase()}: ${caption || "download"}](${url})`;
      break;
    }
    case "bookmark": {
      const bookmarkObj = raw.bookmark as AnyObj | undefined;
      const url = bookmarkObj?.url || "";
      const caption = renderRichText(bookmarkObj?.caption, context);
      md = `${indent}[Bookmark: ${caption || url}](${url})`;
      break;
    }
    case "child_page": {
      const title = raw.child_page?.title || "Untitled Page";
      const targetId = node.id;
      if (context.pagePathMap.has(targetId)) {
        const targetPath = context.pagePathMap.get(targetId)!;
        const fromDir = path.dirname(context.currentPagePath);
        let relPath = path.relative(fromDir, targetPath);
        if (!relPath.startsWith(".") && !relPath.startsWith("/")) {
          relPath = "./" + relPath;
        }
        md = `${indent}[${title}](${encodeURI(relPath)})`;
      } else {
        md = `${indent}${title}`;
      }
      break;
    }
    case "child_database": {
      const title = raw.child_database?.title || "Untitled Database";
      const targetId = node.id;
      if (context.pagePathMap.has(targetId)) {
        const targetPath = context.pagePathMap.get(targetId)!;
        const fromDir = path.dirname(context.currentPagePath);
        let relPath = path.relative(fromDir, targetPath);
        if (!relPath.startsWith(".") && !relPath.startsWith("/")) {
          relPath = "./" + relPath;
        }
        md = `${indent}[${title}](${encodeURI(relPath)})`;
      } else {
        md = `${indent}${title}`;
      }
      break;
    }
    case "table": {
      md = renderTable(node, context);
      break;
    }
    case "table_row": {
      break;
    }
    default: {
      const anyObj = raw[node.type] as AnyObj | undefined;
      if (anyObj && Array.isArray(anyObj.rich_text)) {
        const text = renderRichText(anyObj.rich_text, context);
        md = indent + text;
      } else {
        md = `${indent}*${node.type}*`;
      }
      break;
    }
  }

  // 递归遍历并拼装子 blocks (跳过 table / child_page / child_database 的内部 blocks 递归，因为这些有自己独特的解析结构)
  if (
    node.children &&
    node.children.length > 0 &&
    node.type !== "table" &&
    node.type !== "child_page" &&
    node.type !== "child_database"
  ) {
    const childContext = {
      ...context,
      indentLevel: context.indentLevel + 1,
    };
    
    const childLines = node.children.map((c) => {
      let rendered = renderBlockNode(c, childContext);
      if (node.type === "quote" || node.type === "callout") {
        rendered = rendered
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n");
      }
      return rendered;
    });
    
    md = md + "\n" + childLines.join("\n");
  }
  
  return md;
}

/**
 * 将整棵树渲染为完整的 Markdown 正文
 */
export function renderBlocksToMarkdown(
  nodes: BlockNode[],
  context: RenderContext
): string {
  return nodes.map((n) => renderBlockNode(n, context)).join("\n\n");
}
