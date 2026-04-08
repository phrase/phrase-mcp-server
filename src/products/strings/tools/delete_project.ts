import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerDeleteProjectTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_delete_project",
    {
      description: "Delete an existing project in Phrase Strings.",
      annotations: { destructiveHint: true },
      inputSchema: {
        id: z.string().min(1),
      },
    },
    async ({ id }) => {
      const result = await runtime.client.projectsApi.projectDelete({ id });
      return asTextContent(result);
    },
  );
}
