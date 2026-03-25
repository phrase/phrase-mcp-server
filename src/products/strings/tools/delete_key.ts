import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerDeleteKeyTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_delete_key",
    {
      description: "Delete an existing translation key in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, id, branch }) => {
      const result = await runtime.client.keysApi.keyDelete({
        projectId: project_id,
        id,
        branch,
      });
      return asTextContent(result);
    },
  );
}
