import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerSyncBranchTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_sync_branch",
    {
      description:
        "Sync an existing branch with the main branch of a Phrase Strings project. Note: Only available for branches created with new branching (currently in private beta).",
      annotations: { title: "[Strings] Sync Branch", destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        name: z.string().min(1).describe("Name of the branch to sync"),
        strategy: z
          .enum(["use_main", "use_branch"])
          .optional()
          .describe("Conflict resolution strategy"),
      },
    },
    async ({ project_id, name, strategy }) => {
      const result = await runtime.client.branchesApi.branchSync({
        projectId: project_id,
        name,
        branchSyncParameters: { strategy },
      });
      return asTextContent(result);
    },
  );
}
