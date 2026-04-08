import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetJobLocaleTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_get_job_locale",
    {
      description: "Get a single target locale for a job in a Phrase Strings project.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        job_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
        include_annotations: z.boolean().optional(),
      },
    },
    async ({ project_id, job_id, id, branch, include_annotations }) => {
      const locale = await runtime.client.jobLocalesApi.jobLocaleShow({
        projectId: project_id,
        jobId: job_id,
        id,
        branch,
        includeAnnotations: include_annotations,
      });
      return asTextContent(locale);
    },
  );
}
