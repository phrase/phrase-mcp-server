import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerSearchJobTermbasesTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_search_job_termbases",
    {
      description:
        "Search for terms within termbases assigned to a specific Phrase TMS job. (POST /api2/v1/projects/{projectUid}/jobs/{jobUid}/termBases/search)",
      annotations: { title: "[TMS] Search Job Termbases", readOnlyHint: true },
      inputSchema: z.object({
        project_uid: z.string().min(1).describe("The UID of the project."),
        job_uid: z.string().min(1).describe("The UID of the job."),
        query: z.string().min(1).describe("The term to search for."),
        lang: z.string().optional().describe("Language code (e.g., en, de)."),
      }),
    },
    async ({ project_uid, job_uid, query, lang }) => {
      const response = await runtime.client.postJson(
        `/v1/projects/${encodeURIComponent(project_uid)}/jobs/${encodeURIComponent(job_uid)}/termBases/search`,
        {
          query,
          lang,
        },
      );
      return asTextContent(response);
    },
  );
}
