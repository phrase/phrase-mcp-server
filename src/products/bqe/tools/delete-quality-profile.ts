import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerDeleteQualityProfileTool(
  server: McpServer,
  runtime: ProductRuntime<"bqe">,
) {
  server.registerTool(
    "bqe_delete_quality_profile",
    {
      description:
        "Delete a Quality Profile in Phrase Quality Evaluator. AI Checks referenced by this profile are not deleted. (DELETE /v1/qualityProfiles/{uid})",
      annotations: { title: "[BQE] Delete Quality Profile", destructiveHint: true },
      inputSchema: {
        uid: z.string().min(1).describe("Quality Profile UID."),
      },
    },
    async ({ uid }) => {
      const result = await runtime.client.del(`/v1/qualityProfiles/${encodeURIComponent(uid)}`);
      return asTextContent(result);
    },
  );
}
