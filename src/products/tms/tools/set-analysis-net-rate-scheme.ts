import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerSetAnalysisNetRateSchemeTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_set_analysis_net_rate_scheme",
    {
      description:
        "Set or remove the net rate scheme for an analysis in Phrase TMS. Pass an empty object to remove. (PUT /api2/v1/analyses/{analyseUid}/netRateScheme)",
      annotations: { title: "[TMS] Set Analysis Net Rate Scheme", destructiveHint: true },
      inputSchema: {
        analyse_uid: z.string().min(1).describe("Analysis UID."),
        net_rate_scheme: z
          .record(z.unknown())
          .describe("Net rate scheme object with uid, or empty object {} to remove."),
      },
    },
    async ({ analyse_uid, net_rate_scheme }) => {
      const result = await runtime.client.putJson(
        `/v1/analyses/${encodeURIComponent(analyse_uid)}/netRateScheme`,
        net_rate_scheme,
      );
      return asTextContent(result);
    },
  );
}
