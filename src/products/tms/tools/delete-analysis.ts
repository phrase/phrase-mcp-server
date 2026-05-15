import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerDeleteAnalysisTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_delete_analysis",
    {
      description:
        "Delete a single analysis from Phrase TMS. Set purge=true to permanently delete instead of moving to trash. (DELETE /api2/v1/analyses/{analyseUid})",
      annotations: { title: "[TMS] Delete Analysis", destructiveHint: true },
      inputSchema: {
        analyse_uid: z.string().min(1).describe("Analysis UID."),
        purge: z
          .boolean()
          .optional()
          .describe("Permanently delete instead of moving to trash. Default: false."),
      },
    },
    async ({ analyse_uid, purge }) => {
      const result = await runtime.client.del(
        `/v1/analyses/${encodeURIComponent(analyse_uid)}`,
        purge !== undefined ? { purge } : undefined,
      );
      return asTextContent(result);
    },
  );
}
