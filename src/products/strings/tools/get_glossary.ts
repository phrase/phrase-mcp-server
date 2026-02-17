import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import type { ProductRuntime } from "../../types.js";
import type { StringsClient } from "../client.js";

export function registerGlossaryShowTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_get_glossary",
    {
      description: "Get a single term base (previously: glossary) in Phrase Strings.",
      inputSchema: {
        account_id: z.string().min(1),
        id: z.string().min(1),
      },
    },
    async ({ account_id, id }) => {
      const glossary = await (runtime.client as StringsClient).glossariesApi.glossaryShow({
        accountId: account_id,
        id,
      });
      return asTextContent(glossary);
    },
  );
}
