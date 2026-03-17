import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListLocalesTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_list_locales",
    {
      description: "List locales for a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
        branch: z.string().optional(),
        sort_by: z.enum(["name_asc", "name_desc", "default_asc", "default_desc"]).optional(),
      },
    },
    async ({ project_id, page, per_page, branch, sort_by }) => {
      const locales = await runtime.client.localesApi.localesList({
        projectId: project_id,
        page,
        perPage: per_page,
        branch,
        sortBy: sort_by,
      });
      return asTextContent(locales);
    },
  );
}
