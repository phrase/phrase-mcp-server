import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerDeleteQuoteTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_delete_quote",
    {
      description:
        "Delete a quote from Phrase TMS by UID. This action is irreversible. (DELETE /api2/v1/quotes/{quoteUid})",
      annotations: { title: "[TMS] Delete Quote", destructiveHint: true },
      inputSchema: {
        quote_uid: z.string().min(1).describe("Quote UID."),
      },
    },
    async ({ quote_uid }) => {
      const result = await runtime.client.del(`/v1/quotes/${encodeURIComponent(quote_uid)}`);
      return asTextContent(result);
    },
  );
}
