import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { StringsClient } from "../client.js";

export function registerUpdateJobCommentTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_update_job_comment",
    {
      description: "Update a comment for a job in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        job_id: z.string().min(1),
        id: z.string().min(1),
        message: z.string().optional(),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, job_id, id, message, branch }) => {
      const comment = await (runtime.client as StringsClient).jobCommentsApi.jobCommentUpdate({
        projectId: project_id,
        keyId: job_id,
        id: id,
        jobCommentUpdateParameters: {
          message,
          branch,
        },
      });
      return asTextContent(comment);
    },
  );
}
