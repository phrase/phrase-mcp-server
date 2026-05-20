import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListRepoSyncsTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_list_repo_syncs",
    {
      description: "List all Repo Syncs for a Phrase Strings account.",
      annotations: { title: "[Strings] List Repo Syncs", readOnlyHint: true },
      inputSchema: {
        account_id: z.string().min(1).describe("Account ID"),
      },
    },
    async ({ account_id }) => {
      const result = await runtime.client.repoSyncsApi.repoSyncList({
        accountId: account_id,
      });
      return asTextContent(result);
    },
  );
}
