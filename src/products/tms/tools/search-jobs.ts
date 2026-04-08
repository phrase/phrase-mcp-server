import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";
import { jobStatusSchema } from "#products/tms/tools/constants";

export function registerSearchJobsTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_search_jobs",
    {
      description:
        "Search for jobs in a Phrase TMS project using structured filters. Prefer this over tms_list_jobs when filtering by multiple fields at once (e.g. status + target language + filename). Returns matching jobs with full metadata. (POST /api2/v1/projects/{projectUid}/jobs/search)",
      annotations: { readOnlyHint: true },
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID."),
        query: z
          .record(z.unknown())
          .optional()
          .describe(
            `JobSearchRequest body. Useful fields: status: string[] — valid values: ${jobStatusSchema.options.map((s) => `"${s}"`).join(", ")} (e.g. ["NEW", "ASSIGNED"]); targetLang: string[] locale codes (e.g. ["de", "fr"]); filename: string[] partial filename match; dueInHours: number jobs due within N hours; assignedTo: string[] provider user UIDs. All fields are optional and combined with AND logic.`,
          ),
      },
    },
    async ({ project_uid, query }) => {
      const jobs = await runtime.client.postJson(
        `/v1/projects/${encodeURIComponent(project_uid)}/jobs/search`,
        query ?? {},
      );
      return asTextContent(jobs);
    },
  );
}
