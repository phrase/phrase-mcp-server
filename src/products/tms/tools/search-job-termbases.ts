import { z } from "zod";
import type { Runtime } from "#products/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export function registerSearchJobTermbasesTool(server: Server, runtime: Runtime) {
  server.registerTool(
    "tms_search_job_termbases",
    {
      description: "Search for terms within termbases assigned to a specific Phrase TMS job.",
      annotations: { title: "[TMS] Search Job Termbases", readOnlyHint: true },
      inputSchema: z.object({
        project_uid: z.string().describe("The UID of the project."),
        job_uid: z.string().describe("The UID of the job."),
        query: z.string().describe("The term to search for."),
        lang: z.string().optional().describe("Language code (e.g., en, de)."),
      }),
    },
    async (params) => {
      const client = runtime.createClient(params);
      const response = await client.request(
        "POST",
        `/v1/projects/${encodeURIComponent(params.project_uid)}/jobs/${encodeURIComponent(params.job_uid)}/termBases/search`,
        {
          body: {
            query: params.query,
            lang: params.lang,
          },
        },
      );
      return response.data;
    },
  );
}
