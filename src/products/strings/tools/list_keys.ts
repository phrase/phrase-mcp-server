import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListKeysTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_list_keys",
    {
      description: "List keys in a Phrase Strings project.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
        branch: z.string().optional(),
        sort: z.enum(["name", "created_at", "updated_at"]).optional(),
        order: z.enum(["asc", "desc"]).optional(),
        q: z.string().optional(),
        locale_id: z.string().optional(),
      },
    },
    async ({ project_id, page, per_page, branch, sort, order, q, locale_id }) => {
      const keys = await runtime.client.keysApi.keysList({
        projectId: project_id,
        page,
        perPage: per_page,
        branch,
        sort,
        order,
        q,
        localeId: locale_id,
      });
      return asTextContent(keys);
    },
  );
}
