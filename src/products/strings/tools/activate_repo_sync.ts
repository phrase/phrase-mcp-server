import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerActivateRepoSyncTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_activate_repo_sync",
    {
      description:
        "Activate a deactivated Repo Sync. Active syncs can be used to import and export translations, and imports are automatically triggered by pushes to the repository if configured.",
      annotations: { title: "[Strings] Activate Repo Sync", destructiveHint: true },
      inputSchema: {
        account_id: z.string().min(1).describe("Account ID"),
        id: z.string().min(1).describe("Repo Sync ID"),
      },
    },
    async ({ account_id, id }) => {
      const result = await runtime.client.repoSyncsApi.repoSyncActivate({
        accountId: account_id,
        id,
      });
      return asTextContent(result);
    },
  );
}
