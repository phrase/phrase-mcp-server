import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { TmsClient } from "../client.js";

export function registerSearchJobsTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "tms_search_jobs",
    {
      description:
        "Search Phrase TMS jobs in a project (POST /api2/v1/projects/{projectUid}/jobs/search). Read-only query operation.",
      inputSchema: {
        project_uid: z
          .string()
          .min(1)
          .describe("TMS project UID."),
        query: z
          .record(z.unknown())
          .optional()
          .describe("JobSearchRequest payload as defined by Phrase TMS API."),
      },
    },
    async ({ project_uid, query }) => {
      const jobs = await (runtime.client as TmsClient).postJson(
        `/v1/projects/${encodeURIComponent(project_uid)}/jobs/search`,
        query ?? {},
      );
      return asTextContent(jobs);
    },
  );
}
