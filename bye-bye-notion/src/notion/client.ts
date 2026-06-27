/**
 * Notion SDK 初始化
 * 显式使用最新 Notion-Version: 2026-03-11 (Context7 验证)
 */
import { Client } from "@notionhq/client";
import { config } from "dotenv";

config({ path: ".env.local" });
config(); // 也兼容 .env

export interface NotionContext {
  client: Client;
  tokenLast4: string;
}

export function createNotionClient(): NotionContext {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error(
      "NOTION_TOKEN is missing. Set it in .env.local or as env var.",
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