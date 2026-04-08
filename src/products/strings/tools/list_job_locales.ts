import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListJobLocalesTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_list_job_locales",
    {
      description: "List target locales for a job in a Phrase Strings project.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        job_id: z.string().min(1),
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
        branch: z.string().optional(),
        include_annotations: z.boolean().optional(),
      },
    },
    async ({ project_id, job_id, page, per_page, branch, include_annotations }) => {
      const locales = await runtime.client.jobLocalesApi.jobLocalesList({
        projectId: project_id,
        jobId: job_id,
        page,
        perPage: per_page,
        branch,
        includeAnnotations: include_annotations,
      });
      return asTextContent(locales);
    },
  );
}
