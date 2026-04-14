import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListJobTemplateLocalesTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_list_job_template_locales",
    {
      description: "List job template locales for a job template in a Phrase Strings project.",
      annotations: { title: "[Strings] List Job Template Locales", readOnlyHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        job_template_id: z.string().min(1),
        branch: z.string().optional(),
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ project_id, job_template_id, branch, page, per_page }) => {
      const jobTemplateLocales = await runtime.client.jobTemplateLocalesApi.jobTemplateLocalesList({
        projectId: project_id,
        jobTemplateId: job_template_id,
        branch,
        page,
        perPage: per_page,
      });
      return asTextContent(jobTemplateLocales);
    },
  );
}
