import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerMergeBranchTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_merge_branch",
    {
      description:
        "Merge an existing branch into the main branch of a Phrase Strings project. Note: Merging may take several minutes depending on diff size.",
      annotations: { title: "[Strings] Merge Branch", destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        name: z.string().min(1).describe("Name of the branch to merge into main"),
        strategy: z
          .enum(["use_main", "use_branch"])
          .optional()
          .describe("Conflict resolution strategy"),
      },
    },
    async ({ project_id, name, strategy }) => {
      const result = await runtime.client.branchesApi.branchMerge({
        projectId: project_id,
        name,
        branchMergeParameters: { strategy },
      });
      return asTextContent(result);
    },
  );
}
