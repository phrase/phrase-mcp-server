import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGlossaryTermUpdateTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_update_glossary_term",
    {
      description: "Update an existing term in a Phrase Strings term base (glossary).",
      annotations: { destructiveHint: true },
      inputSchema: {
        account_id: z.string().min(1),
        glossary_id: z.string().min(1),
        id: z.string().min(1),
        term: z.string().optional(),
        description: z.string().optional(),
        translatable: z.boolean().optional(),
        case_sensitive: z.boolean().optional(),
      },
    },
    async ({ account_id, glossary_id, id, term, description, translatable, case_sensitive }) => {
      const glossaryTerm = await runtime.client.glossaryTermsApi.glossaryTermUpdate({
        accountId: account_id,
        glossaryId: glossary_id,
        id,
        glossaryTermUpdateParameters: {
          term,
          description,
          translatable,
          caseSensitive: case_sensitive,
        },
      });
      return asTextContent(glossaryTerm);
    },
  );
}
