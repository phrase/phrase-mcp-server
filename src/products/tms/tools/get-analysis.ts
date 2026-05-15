import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetAnalysisTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_analysis",
    {
      description:
        "Fetch a single analysis by UID from Phrase TMS. Returns analysis details including word counts, match rates, and associated jobs. (GET /api2/v3/analyses/{analyseUid})",
      annotations: { title: "[TMS] Get Analysis", readOnlyHint: true },
      inputSchema: {
        analyse_uid: z.string().min(1).describe("Analysis UID."),
      },
    },
    async ({ analyse_uid }) => {
      const result = await runtime.client.get(`/v3/analyses/${encodeURIComponent(analyse_uid)}`);
      return asTextContent(result);
    },
  );
}
