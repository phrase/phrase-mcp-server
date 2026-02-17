import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { StringsClient } from "../client.js";

export function registerGlossariesListTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_list_glossaries",
    {
      description: "List term bases (previously: glossaries) in a Phrase Strings account.",
      inputSchema: {
        account_id: z.string().min(1),
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ account_id, page, per_page }) => {
      const glossaries = await (runtime.client as StringsClient).glossariesApi.glossariesList({
        accountId: account_id,
        page,
        perPage: per_page,
      });
      return asTextContent(glossaries);
    },
  );
}
