import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetJobAnalysisTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_job_analysis",
    {
      description:
        "Fetch the analysis data for a specific job within an analysis in Phrase TMS. Returns word counts and match rates for that job. (GET /api2/v1/analyses/{analyseUid}/jobs/{jobUid})",
      annotations: { title: "[TMS] Get Job Analysis", readOnlyHint: true },
      inputSchema: {
        analyse_uid: z.string().min(1).describe("Analysis UID."),
        job_uid: z.string().min(1).describe("Job UID."),
      },
    },
    async ({ analyse_uid, job_uid }) => {
      const result = await runtime.client.get(
        `/v1/analyses/${encodeURIComponent(analyse_uid)}/jobs/${encodeURIComponent(job_uid)}`,
      );
      return asTextContent(result);
    },
  );
}
