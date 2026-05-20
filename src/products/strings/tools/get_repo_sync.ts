import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetRepoSyncTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_get_repo_sync",
    {
      description: "Get a single Repo Sync setting for a Phrase Strings account.",
      annotations: { title: "[Strings] Get Repo Sync", readOnlyHint: true },
      inputSchema: {
        account_id: z.string().min(1).describe("Account ID"),
        id: z.string().min(1).describe("Repo Sync ID"),
      },
    },
    async ({ account_id, id }) => {
      const result = await runtime.client.repoSyncsApi.repoSyncShow({
        accountId: account_id,
        id,
      });
      return asTextContent(result);
    },
  );
}
