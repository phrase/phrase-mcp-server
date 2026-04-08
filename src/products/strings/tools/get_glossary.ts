import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGlossaryShowTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_get_glossary",
    {
      description: "Get a single term base (previously: glossary) in Phrase Strings.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        account_id: z.string().min(1),
        id: z.string().min(1),
      },
    },
    async ({ account_id, id }) => {
      const glossary = await runtime.client.glossariesApi.glossaryShow({
        accountId: account_id,
        id,
      });
      return asTextContent(glossary);
    },
  );
}
