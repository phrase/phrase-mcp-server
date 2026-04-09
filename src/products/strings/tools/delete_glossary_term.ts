import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGlossaryTermDeleteTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_delete_glossary_term",
    {
      description: "Delete an existing term from a Phrase Strings term base (glossary).",
      annotations: { destructiveHint: true },
      inputSchema: {
        account_id: z.string().min(1),
        glossary_id: z.string().min(1),
        id: z.string().min(1),
      },
    },
    async ({ account_id, glossary_id, id }) => {
      const result = await runtime.client.glossaryTermsApi.glossaryTermDelete({
        accountId: account_id,
        glossaryId: glossary_id,
        id,
      });
      return asTextContent(result);
    },
  );
}
