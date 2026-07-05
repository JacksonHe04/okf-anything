/**
 * Notion SDK initialization. Token is supplied by the syncer (which in
 * turn resolves it from `.mookf/config.yaml` or env).
 */
import { Client } from "@notionhq/client";

export interface NotionContext {
  client: Client;
  tokenLast4: string;
}

export function createNotionClient(token: string): NotionContext {
  if (!token) {
    throw new Error(
      "Notion token is missing. Set notion.token in .mookf/config.yaml or NOTION_TOKEN env.",
    );
  }
  const client = new Client({
    auth: token,
    notionVersion: "2026-03-11",
    timeoutMs: 60_000,
  });
  return {
    client,
    tokenLast4: token.slice(-4),
  };
}