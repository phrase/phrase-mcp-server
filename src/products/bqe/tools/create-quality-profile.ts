import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateQualityProfileTool(
  server: McpServer,
  runtime: ProductRuntime<"bqe">,
) {
  server.registerTool(
    "bqe_create_quality_profile",
    {
      description:
        "[LEGACY] Create a new Quality Profile in Phrase Quality Evaluator containing up to 3 AI Checks. Requires ADMIN or OWNER IDM role. Only available for early-access program users — in V3, quality configuration is managed via Content Groups in the Phrase platform UI and there is no API write path for profiles. (POST /v1/qualityProfiles)",
      annotations: { title: "[BQE] Create Quality Profile (Legacy)", destructiveHint: true },
      inputSchema: {
        name: z.string().min(1).describe("Display name for the Quality Profile."),
        aiCheckUids: z
          .array(z.string().min(1))
          .max(3)
          .describe("UIDs of AI Checks to include in this profile. Maximum 3 items."),
      },
    },
    async ({ name, aiCheckUids }) => {
      const result = await runtime.client.postJson("/v1/qualityProfiles", {
        name,
        aiCheckUids,
      });
      return asTextContent(result);
    },
  );
}
