import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

export function registerUpdateJobTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_update_job",
    {
      description:
        "Update a Phrase TMS job (PUT /api2/v1/projects/{projectUid}/jobs/{jobUid}). This operation mutates data.",
      annotations: { destructiveHint: true },
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID."),
        job_uid: z.string().min(1).describe("TMS job UID."),
        job: z.record(z.unknown()).describe("JobEditRequest payload as defined by Phrase TMS API."),
      },
    },
    async ({ project_uid, job_uid, job }) => {
      const updated = await runtime.client.putJson(
        `/v1/projects/${encodeURIComponent(project_uid)}/jobs/${encodeURIComponent(job_uid)}`,
        job,
      );
      return asTextContent(updated);
    },
  );
}
