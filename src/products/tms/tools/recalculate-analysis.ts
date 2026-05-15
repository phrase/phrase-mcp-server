import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerRecalculateAnalysisTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_recalculate_analysis",
    {
      description:
        "Recalculate one or more existing analyses in Phrase TMS. Returns async request objects. (POST /api2/v1/analyses/recalculate)",
      annotations: { title: "[TMS] Recalculate Analysis", destructiveHint: true },
      inputSchema: {
        analyses: z
          .array(z.object({ id: z.string().min(1) }))
          .min(1)
          .max(100)
          .describe("Array of analysis objects with id to recalculate (max 100)."),
        callbackUrl: z
          .string()
          .optional()
          .describe("Webhook URL called when recalculation completes."),
      },
    },
    async ({ analyses, callbackUrl }) => {
      const payload: Record<string, unknown> = { analyses };
      if (callbackUrl) payload.callbackUrl = callbackUrl;
      const result = await runtime.client.postJson("/v1/analyses/recalculate", payload);
      return asTextContent(result);
    },
  );
}
