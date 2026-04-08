import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCompareBranchTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_compare_branch",
    {
      description:
        "Create an async comparison between a branch and the main branch of a Phrase Strings project. Returns a comparison job — use strings_get_branch_comparison to fetch the result.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        name: z.string().min(1).describe("Name of the branch to compare with main"),
        direction: z
          .enum(["sync", "merge"])
          .optional()
          .describe("Direction of comparison: sync or merge (v2 branches only)"),
      },
    },
    async ({ project_id, name, direction }) => {
      const result = await runtime.client.branchesApi.branchComparisonCreate({
        projectId: project_id,
        name,
        branchCreateComparisonParameters: { direction },
      });
      return asTextContent(result);
    },
  );
}
