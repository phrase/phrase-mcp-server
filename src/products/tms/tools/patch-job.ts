import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

export function registerPatchJobTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_patch_job",
    {
      description:
        "Patch a Phrase TMS job (PATCH /api2/v1/projects/{projectUid}/jobs/{jobUid}). This operation mutates data.",
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID."),
        job_uid: z.string().min(1).describe("TMS job UID."),
        job: z
          .record(z.unknown())
          .describe("JobPatchRequest payload as defined by Phrase TMS API."),
      },
    },
    async ({ project_uid, job_uid, job }) => {
      const patched = await runtime.client.patchJson(
        `/v1/projects/${encodeURIComponent(project_uid)}/jobs/${encodeURIComponent(job_uid)}`,
        job,
      );
      return asTextContent(patched);
    },
  );
}
