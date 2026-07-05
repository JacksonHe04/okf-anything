/**
 * Convert Lark doc shape into OKF frontmatter.
 */
export interface LarkOkfFields {
  type: "Lark Document";
  source: "lark";
  title: string;
  resource: string;
  timestamp: string;
  lark_id: string;
  created_time: string;
  last_edited_time: string;
  lark_parent_type: string;
  lark_parent_id: string | null;
  /** CLI-minted, workspace-unique identity. Populated by `writeFrontmatterBody`. */
  inon_id?: string;
}

export function buildLarkFrontmatter(args: {
  token: string;
  title: string;
  url: string;
  createdTime: string;
  lastEditedTime: string;
  parentType: string;
  parentId: string | null;
}): LarkOkfFields {
  return {
    type: "Lark Document",
    source: "lark",
    title: args.title || "untitled",
    resource: args.url,
    timestamp: args.lastEditedTime,
    lark_id: args.token,
    created_time: args.createdTime,
    last_edited_time: args.lastEditedTime,
    lark_parent_type: args.parentType,
    lark_parent_id: args.parentId,
  };
}

import { writeFrontmatterBody } from "../../utils/frontmatter.js";

export function renderLarkDoc(args: {
  fm: LarkOkfFields;
  bodyMarkdown: string;
}): string {
  return writeFrontmatterBody(args.fm as unknown as Record<string, unknown>, `# ${args.fm.title}\n\n${args.bodyMarkdown}\n`);
}
