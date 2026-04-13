import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerUpdateBranchTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_update_branch",
    {
      description: "Update an existing branch in a Phrase Strings project (e.g. rename it).",
      annotations: { title: "[Strings] Update Branch", destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        name: z.string().min(1).describe("Current name of the branch"),
        new_name: z.string().min(1).describe("New name for the branch"),
      },
    },
    async ({ project_id, name, new_name }) => {
      const branch = await runtime.client.branchesApi.branchUpdate({
        projectId: project_id,
        name,
        branchUpdateParameters: { name: new_name },
      });
      return asTextContent(branch);
    },
  );
}
