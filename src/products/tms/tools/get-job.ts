import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetJobTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_job",
    {
      description:
        "Fetch full details of a single TMS job: status, target language, filename, word count, assigned providers, due date, and workflow step. Note: in workflow projects, each step has a distinct job UID, tms_list_jobs returns one entry per step. (GET /api2/v1/projects/{projectUid}/jobs/{jobUid})",
      annotations: { title: "[TMS] Get Job", readOnlyHint: true },
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID."),
        job_uid: z.string().min(1).describe("TMS job UID."),
      },
    },
    async ({ project_uid, job_uid }) => {
      const job = await runtime.client.get(
        `/v1/projects/${encodeURIComponent(project_uid)}/jobs/${encodeURIComponent(job_uid)}`,
      );
      return asTextContent(job);
    },
  );
}
