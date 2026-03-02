import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGlossaryTermShowTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_get_glossary_term",
    {
      description: "Get a single term in a term base (previously: glossary).",
      inputSchema: {
        account_id: z.string().min(1),
        glossary_id: z.string().min(1),
        id: z.string().min(1),
      },
    },
    async ({ account_id, glossary_id, id }) => {
      const glossaryTerm = await runtime.client.glossaryTermsApi.glossaryTermShow({
        accountId: account_id,
        glossaryId: glossary_id,
        id,
      });
      return asTextContent(glossaryTerm);
    },
  );
}
