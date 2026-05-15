import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateQuoteTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_create_quote",
    {
      description:
        "Create a quote for translation work in Phrase TMS. Requires a price list, analysis, and project reference. Returns the created quote including total price, billing unit, currency, and status. (POST /api2/v1/quotes)",
      annotations: { title: "[TMS] Create Quote", destructiveHint: true },
      inputSchema: {
        quote: z
          .record(z.unknown())
          .describe(
            "QuoteCreateRequest body. Required: name (string, max 255), analyse (object with uid), priceList (object with uid), project (object with uid). Optional: additionalSteps (string[]), netRateScheme (object with uid), provider (object with uid), units (object[]), workflowSettings (object[]).",
          ),
      },
    },
    async ({ quote }) => {
      const result = await runtime.client.postJson("/v1/quotes", quote);
      return asTextContent(result);
    },
  );
}
