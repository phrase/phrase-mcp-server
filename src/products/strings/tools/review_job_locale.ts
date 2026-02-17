import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import type { ProductRuntime } from "../../types.js";
import type { StringsClient } from "../client.js";

export function registerReviewJobLocaleTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_review_job_locale",
    {
      description: "Mark a job locale as reviewed in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        job_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, job_id, id, branch }) => {
      const locale = await (runtime.client as StringsClient).jobLocalesApi.jobLocaleCompleteReview({
        projectId: project_id,
        jobId: job_id,
        id,
        jobLocaleCompleteReviewParameters: {
          branch,
        },
      });
      return asTextContent(locale);
    },
  );
}
