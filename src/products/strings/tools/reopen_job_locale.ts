import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

export function registerReopenJobLocaleTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_reopen_job_locale",
    {
      description: "Reopen a job locale in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        job_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, job_id, id, branch }) => {
      const locale = await runtime.client.jobLocalesApi.jobLocaleReopen({
        projectId: project_id,
        jobId: job_id,
        id,
        jobLocaleReopenParameters: {
          branch,
        },
      });
      return asTextContent(locale);
    },
  );
}
