import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerDeleteAnalysesBatchTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_delete_analyses_batch",
    {
      description:
        "Delete multiple analyses at once from Phrase TMS (1–100 per call). Set purge=true to permanently delete instead of moving to trash. (DELETE /api2/v1/analyses)",
      annotations: { title: "[TMS] Delete Analyses (Batch)", destructiveHint: true },
      inputSchema: {
        analyses: z
          .array(z.object({ uid: z.string().min(1) }))
          .min(1)
          .max(100)
          .describe("Array of analysis objects with uid to delete (max 100)."),
        purge: z
          .boolean()
          .optional()
          .describe("Permanently delete instead of moving to trash. Default: false."),
      },
    },
    async ({ analyses, purge }) => {
      const payload: Record<string, unknown> = { analyses };
      if (purge !== undefined) payload.purge = purge;
      const result = await runtime.client.delJson("/v1/analyses", payload);
      return asTextContent(result);
    },
  );
}
