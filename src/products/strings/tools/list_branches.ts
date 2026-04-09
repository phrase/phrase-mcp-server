import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListBranchesTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_list_branches",
    {
      description: "List all branches of a Phrase Strings project.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ project_id, page, per_page }) => {
      const branches = await runtime.client.branchesApi.branchesList({
        projectId: project_id,
        page,
        perPage: per_page,
      });
      return asTextContent(branches);
    },
  );
}
