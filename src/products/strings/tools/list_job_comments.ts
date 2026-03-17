import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListJobCommentsTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_list_job_comments",
    {
      description: "List comments for a job in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        job_id: z.string().min(1),
        branch: z.string().optional(),
        order: z.enum(["asc", "desc"]).optional(),
      },
    },
    async ({ project_id, job_id, branch, order }) => {
      const comments = await runtime.client.jobCommentsApi.jobCommentsList({
        projectId: project_id,
        jobId: job_id,
        branch,
        order,
      });
      return asTextContent(comments);
    },
  );
}
