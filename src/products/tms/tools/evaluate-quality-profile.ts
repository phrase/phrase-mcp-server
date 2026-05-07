import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerEvaluateQualityProfileTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_evaluate_quality_profile",
    {
      description:
        "Trigger an asynchronous quality evaluation against a Quality Profile for the selected TMS job parts. Job parts must be in the same project and the same workflow step. Returns an async action descriptor; poll its status with tms_get_async_request. (POST /api2/v1/qualityProfiles/evaluate)",
      annotations: { title: "[TMS] Evaluate Quality Profile", destructiveHint: true },
      inputSchema: {
        qualityProfileUid: z
          .string()
          .min(1)
          .describe("UID of the Quality Profile to evaluate against."),
        jobs: z
          .array(z.object({ uid: z.string().min(1).describe("Job part UID.") }))
          .min(1)
          .max(50)
          .describe("Job parts to evaluate. Between 1 and 50 items."),
      },
    },
    async ({ qualityProfileUid, jobs }) => {
      const result = await runtime.client.postJson("/v1/qualityProfiles/evaluate", {
        qualityProfileUid,
        jobs,
      });
      return asTextContent(result);
    },
  );
}
