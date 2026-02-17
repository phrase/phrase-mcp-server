import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import type { ProductRuntime } from "../../types.js";
import type { StringsClient } from "../client.js";

export function registerCreateJobCommentTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_create_job_comment",
    {
      description: "Create a comment for a job in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        job_id: z.string().min(1),
        message: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, job_id, message, branch }) => {
      const comment = await (runtime.client as StringsClient).jobCommentsApi.jobCommentCreate({
        projectId: project_id,
        jobId: job_id,
        jobCommentCreateParameters: {
          message,
          branch,
        },
      });
      return asTextContent(comment);
    },
  );
}
