import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetQuoteTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_quote",
    {
      description:
        "Fetch a quote by UID from Phrase TMS. Returns full quote details: name, status (NEW/DRAFT/FOR_APPROVAL/APPROVED/DECLINED), quoteType (BUYER/PROVIDER), totalPrice, currency, billingUnit, priceList, netRateScheme, provider, and workflowStepList. (GET /api2/v1/quotes/{quoteUid})",
      annotations: { title: "[TMS] Get Quote", readOnlyHint: true },
      inputSchema: {
        quote_uid: z.string().min(1).describe("Quote UID."),
      },
    },
    async ({ quote_uid }) => {
      const result = await runtime.client.get(`/v1/quotes/${encodeURIComponent(quote_uid)}`);
      return asTextContent(result);
    },
  );
}
