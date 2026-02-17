import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { TmsClient } from "../client.js";

export function registerGetJobTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "tms_get_job",
    {
      description:
        "Get a Phrase TMS job by project UID and job UID (GET /api2/v1/projects/{projectUid}/jobs/{jobUid}). Read-only operation.",
      inputSchema: {
        project_uid: z
          .string()
          .min(1)
          .describe("TMS project UID."),
        job_uid: z
          .string()
          .min(1)
          .describe("TMS job UID."),
      },
    },
    async ({ project_uid, job_uid }) => {
      const job = await (runtime.client as TmsClient).get(
        `/v1/projects/${encodeURIComponent(project_uid)}/jobs/${encodeURIComponent(job_uid)}`,
      );
      return asTextContent(job);
    },
  );
}
