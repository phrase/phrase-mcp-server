import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListJobTemplatesTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_list_job_templates",
    {
      description: "List job templates for a Phrase Strings project.",
      annotations: { title: "[Strings] List Job Templates", readOnlyHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        branch: z.string().optional(),
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ project_id, branch, page, per_page }) => {
      const jobTemplates = await runtime.client.jobTemplatesApi.jobTemplatesList({
        projectId: project_id,
        branch,
        page,
        perPage: per_page,
      });
      return asTextContent(jobTemplates);
    },
  );
}
