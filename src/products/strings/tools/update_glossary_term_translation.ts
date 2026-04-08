import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGlossaryTermTranslationUpdateTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_update_glossary_term_translation",
    {
      description: "Update a translation for a term in a term base (previously: glossary).",
      annotations: { destructiveHint: true },
      inputSchema: {
        account_id: z.string().min(1),
        glossary_id: z.string().min(1),
        term_id: z.string().min(1),
        id: z.string().min(1),
        locale_code: z.string().optional(),
        content: z.string().optional(),
      },
    },
    async ({ account_id, glossary_id, term_id, id, locale_code, content }) => {
      const glossaryTermTranslation =
        await runtime.client.glossaryTermTranslationsApi.glossaryTermTranslationUpdate({
          accountId: account_id,
          glossaryId: glossary_id,
          termId: term_id,
          id,
          glossaryTermTranslationUpdateParameters: {
            localeCode: locale_code,
            content,
          },
        });
      return asTextContent(glossaryTermTranslation);
    },
  );
}
