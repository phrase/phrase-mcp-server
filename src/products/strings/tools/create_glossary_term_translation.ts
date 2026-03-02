import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGlossaryTermTranslationCreateTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_create_glossary_term_translation",
    {
      description: "Create a translation for a term in a term base (previously: glossary).",
      inputSchema: {
        account_id: z.string().min(1),
        glossary_id: z.string().min(1),
        term_id: z.string().min(1),
        locale_code: z.string().min(1),
        content: z.string(),
      },
    },
    async ({ account_id, glossary_id, term_id, locale_code, content }) => {
      const glossaryTermTranslation =
        await runtime.client.glossaryTermTranslationsApi.glossaryTermTranslationCreate({
          accountId: account_id,
          glossaryId: glossary_id,
          termId: term_id,
          glossaryTermTranslationCreateParameters: {
            localeCode: locale_code,
            content,
          },
        });
      return asTextContent(glossaryTermTranslation);
    },
  );
}
