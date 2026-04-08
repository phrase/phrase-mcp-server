import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerDeleteBranchTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_delete_branch",
    {
      description: "Delete an existing branch in a Phrase Strings project.",
      annotations: { destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        name: z.string().min(1),
      },
    },
    async ({ project_id, name }) => {
      const result = await runtime.client.branchesApi.branchDelete({
        projectId: project_id,
        name,
      });
      return asTextContent(result);
    },
  );
}
