import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerUpdateLocaleTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_update_locale",
    {
      description: "Update an existing locale in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
        name: z.string().optional(),
        code: z.string().optional(),
        default: z.boolean().optional(),
        main: z.boolean().optional(),
        rtl: z.boolean().optional(),
        source_locale_id: z.string().optional(),
        fallback_locale_id: z.string().optional(),
        unverify_new_translations: z.boolean().optional(),
        unverify_updated_translations: z.boolean().optional(),
        autotranslate: z.boolean().optional(),
      },
    },
    async ({
      project_id,
      id,
      branch,
      name,
      code,
      default: is_default,
      main,
      rtl,
      source_locale_id,
      fallback_locale_id,
      unverify_new_translations,
      unverify_updated_translations,
      autotranslate,
    }) => {
      const locale = await runtime.client.localesApi.localeUpdate({
        projectId: project_id,
        id,
        localeUpdateParameters: {
          branch,
          name,
          code,
          _default: is_default,
          main,
          rtl,
          sourceLocaleId: source_locale_id,
          fallbackLocaleId: fallback_locale_id,
          unverifyNewTranslations: unverify_new_translations,
          unverifyUpdatedTranslations: unverify_updated_translations,
          autotranslate,
        },
      });
      return asTextContent(locale);
    },
  );
}
