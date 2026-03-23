import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateBranchTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_create_branch",
    {
      description:
        "Create a new branch in a Phrase Strings project. WARNING: Creating a branch copies all keys and translations from the main branch. This operation can take several minutes and consume significant resources on large projects. Only create a branch when explicitly requested by the user.",
      inputSchema: {
        project_id: z.string().min(1),
        name: z.string().min(1),
      },
    },
    async ({ project_id, name }) => {
      const branch = await runtime.client.branchesApi.branchCreate({
        projectId: project_id,
        branchCreateParameters: { name },
      });
      return asTextContent(branch);
    },
  );
}
