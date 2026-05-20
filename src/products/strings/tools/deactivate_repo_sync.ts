import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerDeactivateRepoSyncTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_deactivate_repo_sync",
    {
      description:
        "Deactivate an active Repo Sync. Import and export cannot be performed on deactivated syncs and pushes to the repository will not trigger imports to Phrase.",
      annotations: { title: "[Strings] Deactivate Repo Sync", destructiveHint: true },
      inputSchema: {
        account_id: z.string().min(1).describe("Account ID"),
        id: z.string().min(1).describe("Repo Sync ID"),
      },
    },
    async ({ account_id, id }) => {
      const result = await runtime.client.repoSyncsApi.repoSyncDeactivate({
        accountId: account_id,
        id,
      });
      return asTextContent(result);
    },
  );
}
