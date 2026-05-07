import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetAnalyticsTool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_get_analytics",
    {
      description:
        "Return aggregated evaluation analytics from Phrase Quality Evaluator for the supplied date range and optional Quality Profile filter. (GET /v1/analytics)",
      annotations: { title: "[BQE] Get Analytics", readOnlyHint: true },
      inputSchema: {
        qualityProfileUid: z
          .string()
          .optional()
          .describe("Filter analytics by Quality Profile UID."),
        dayAfter: z
          .string()
          .optional()
          .describe("Start of the date range, inclusive (UTC) in YYYY-MM-DD format."),
        dayBefore: z
          .string()
          .optional()
          .describe("End of the date range, inclusive (UTC) in YYYY-MM-DD format."),
      },
    },
    async ({ qualityProfileUid, dayAfter, dayBefore }) => {
      const result = await runtime.client.get("/v1/analytics", {
        qualityProfileUid,
        dayAfter,
        dayBefore,
      });
      return asTextContent(result);
    },
  );
}
