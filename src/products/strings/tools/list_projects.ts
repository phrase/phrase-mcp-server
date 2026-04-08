import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListProjectsTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_list_projects",
    {
      description: "List Phrase Strings projects available for the authenticated account.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ page, per_page }) => {
      const projects = await runtime.client.projectsApi.projectsList({
        page,
        perPage: per_page,
      });
      return asTextContent(projects);
    },
  );
}
