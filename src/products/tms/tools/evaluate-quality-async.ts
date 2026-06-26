import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerEvaluateQualityAsyncTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_evaluate_quality_async",
    {
      description:
        "Trigger an asynchronous quality evaluation for selected TMS job parts. Automatically selects the evaluation flow based on project configuration: uses the legacy Quality Profile flow if one is set, otherwise uses the Content Group flow. Returns 422 if the project has no evaluation configuration. Job parts must belong to the same project and workflow step and be in a ready state. Returns an async action descriptor; poll its status with tms_get_async_request. (POST /api2/v1/projects/{projectUid}/jobs/evaluateQuality)",
      annotations: { title: "[TMS] Evaluate Quality", destructiveHint: true },
      inputSchema: {
        projectUid: z.string().min(1).describe("UID of the project the job parts belong to."),
        jobs: z
          .array(z.object({ uid: z.string().min(1).describe("Job part UID.") }))
          .min(1)
          .max(50)
          .describe("Job parts to evaluate. Between 1 and 50 items."),
        lockSegments: z
          .boolean()
          .optional()
          .describe(
            "Lock segments that pass all AI checks after evaluation. Defaults to true.",
          ),
        confirmSegments: z
          .boolean()
          .optional()
          .describe("Confirm segments after evaluation. Defaults to false."),
      },
    },
    async ({ projectUid, jobs, lockSegments, confirmSegments }) => {
      const result = await runtime.client.postJson(
        `/v1/projects/${encodeURIComponent(projectUid)}/jobs/evaluateQuality`,
        { jobs, lockSegments, confirmSegments },
      );
      return asTextContent(result);
    },
  );
}
