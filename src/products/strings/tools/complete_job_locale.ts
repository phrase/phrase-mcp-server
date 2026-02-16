import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { StringsClient } from "../client.js";

export function registerCompleteJobLocaleTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_complete_job_locale",
    {
      description: "Complete a job locale in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        job_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, job_id, id, branch }) => {
      const locale = await (runtime.client as StringsClient).jobLocalesApi.jobLocaleComplete({
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
