import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetBranchTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_get_branch",
    {
      description: "Get details on a single branch of a Phrase Strings project.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        name: z.string().min(1),
      },
    },
    async ({ project_id, name }) => {
      const branch = await runtime.client.branchesApi.branchShow({
        projectId: project_id,
        name,
      });
      return asTextContent(branch);
    },
  );
}
