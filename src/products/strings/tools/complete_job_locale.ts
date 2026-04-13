import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCompleteJobLocaleTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_complete_job_locale",
    {
      description: "Complete a job locale in a Phrase Strings project.",
      annotations: { title: "[Strings] Complete Job Locale", destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        job_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, job_id, id, branch }) => {
      const locale = await runtime.client.jobLocalesApi.jobLocaleComplete({
        projectId: project_id,
        jobId: job_id,
        id,
        jobLocaleCompleteParameters: {
          branch,
        },
      });
      return asTextContent(locale);
    },
  );
}
