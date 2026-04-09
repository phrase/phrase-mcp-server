import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetLocaleTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_get_locale",
    {
      description: "Get details of a single locale in a Phrase Strings project.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, id, branch }) => {
      const locale = await runtime.client.localesApi.localeShow({
        projectId: project_id,
        id,
        branch,
      });
      return asTextContent(locale);
    },
  );
}
