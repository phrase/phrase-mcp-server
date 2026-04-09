import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateLocaleTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_create_locale",
    {
      description: "Create a locale in a Phrase Strings project.",
      annotations: { destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        name: z.string().min(1),
        code: z.string().min(1),
        branch: z.string().optional(),
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
      name,
      code,
      branch,
      default: is_default,
      main,
      rtl,
      source_locale_id,
      fallback_locale_id,
      unverify_new_translations,
      unverify_updated_translations,
      autotranslate,
    }) => {
      const locale = await runtime.client.localesApi.localeCreate({
        projectId: project_id,
        localeCreateParameters: {
          name,
          code,
          branch,
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
