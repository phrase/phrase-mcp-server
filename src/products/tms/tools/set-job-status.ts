import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

export function registerSetJobStatusTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_set_job_status",
    {
      description:
        "Set Phrase TMS job status (POST /api2/v1/projects/{projectUid}/jobs/{jobUid}/setStatus). This operation mutates data.",
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID."),
        job_uid: z.string().min(1).describe("TMS job UID."),
        status: z
          .string()
          .min(1)
          .describe("Target job status value accepted by TMS (for example NEW, COMPLETED)."),
      },
    },
    async ({ project_uid, job_uid, status }) => {
      const response = await runtime.client.postJson(
        `/v1/projects/${encodeURIComponent(project_uid)}/jobs/${encodeURIComponent(job_uid)}/setStatus`,
        {
          status,
        },
      );
      return asTextContent(response);
    },
  );
}
