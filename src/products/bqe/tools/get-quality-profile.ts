import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetQualityProfileTool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_get_quality_profile",
    {
      description:
        "Fetch a single Quality Profile by its UID, including the AI Checks it contains. (GET /v1/qualityProfiles/{uid})",
      annotations: { title: "[BQE] Get Quality Profile", readOnlyHint: true },
      inputSchema: {
        uid: z
          .string()
          .min(1)
          .describe("Quality Profile UID. Obtain from bqe_list_quality_profiles."),
      },
    },
    async ({ uid }) => {
      const result = await runtime.client.get(`/v1/qualityProfiles/${encodeURIComponent(uid)}`);
      return asTextContent(result);
    },
  );
}
