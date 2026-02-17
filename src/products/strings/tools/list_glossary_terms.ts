import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { StringsClient } from "../client.js";

export function registerGlossaryTermsListTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_list_glossary_terms",
    {
      description: "List terms in a term base (previously: glossary).",
      inputSchema: {
        account_id: z.string().min(1),
        glossary_id: z.string().min(1),
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ account_id, glossary_id, page, per_page }) => {
      const glossaryTerms = await (runtime.client as StringsClient).glossaryTermsApi.glossaryTermsList({
        accountId: account_id,
        glossaryId: glossary_id,
        page,
        perPage: per_page,
      });
      return asTextContent(glossaryTerms);
    },
  );
}
