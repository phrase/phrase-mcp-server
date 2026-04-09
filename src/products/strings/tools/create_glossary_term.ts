import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGlossaryTermCreateTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_create_glossary_term",
    {
      description: "Create a term in a term base (previously: glossary).",
      annotations: { destructiveHint: true },
      inputSchema: {
        account_id: z.string().min(1),
        glossary_id: z.string().min(1),
        term: z.string().min(1),
        description: z.string().optional(),
        translatable: z.boolean().optional(),
        case_sensitive: z.boolean().optional(),
      },
    },
    async ({ account_id, glossary_id, term, description, translatable, case_sensitive }) => {
      const glossaryTerm = await runtime.client.glossaryTermsApi.glossaryTermCreate({
        accountId: account_id,
        glossaryId: glossary_id,
        glossaryTermCreateParameters: {
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
