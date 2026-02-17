import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

export function registerListTranslationsTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_list_translations",
    {
      description: "List translations for a locale in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        locale_id: z.string().min(1),
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
        branch: z.string().optional(),
        sort: z.enum(["key_name", "created_at", "updated_at"]).optional(),
        order: z.enum(["asc", "desc"]).optional(),
        q: z.string().optional(),
      },
    },
    async ({ project_id, locale_id, page, per_page, branch, sort, order, q }) => {
      const translations = await runtime.client.translationsApi.translationsByLocale({
        projectId: project_id,
        localeId: locale_id,
        page,
        perPage: per_page,
        branch,
        sort,
        order,
        q,
      });
      return asTextContent(translations);
    },
  );
}
