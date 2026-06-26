import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerUpdateQualityProfileTool(
  server: McpServer,
  runtime: ProductRuntime<"bqe">,
) {
  server.registerTool(
    "bqe_update_quality_profile",
    {
      description:
        "[LEGACY] Update an existing Quality Profile in Phrase Quality Evaluator. Replaces both name and the list of AI Check UIDs. Only available for early-access program users — in V3, quality configuration is managed via Content Groups in the Phrase platform UI and there is no API write path for profiles. (PUT /v1/qualityProfiles/{uid})",
      annotations: { title: "[BQE] Update Quality Profile (Legacy)", destructiveHint: true },
      inputSchema: {
        uid: z.string().min(1).describe("Quality Profile UID."),
        name: z.string().min(1).describe("Display name for the Quality Profile."),
        aiCheckUids: z
          .array(z.string().min(1))
          .max(3)
          .describe("UIDs of AI Checks to include in this profile. Maximum 3 items."),
      },
    },
    async ({ uid, name, aiCheckUids }) => {
      const result = await runtime.client.putJson(
        `/v1/qualityProfiles/${encodeURIComponent(uid)}`,
        { name, aiCheckUids },
      );
      return asTextContent(result);
    },
  );
}
