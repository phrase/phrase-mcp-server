import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetJobTemplateLocaleTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_get_job_template_locale",
    {
      description:
        "Get a single job template locale for a job template in a Phrase Strings project.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        job_template_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, job_template_id, id, branch }) => {
      const jobTemplateLocale = await runtime.client.jobTemplateLocalesApi.jobTemplateLocaleShow({
        projectId: project_id,
        jobTemplateId: job_template_id,
        jobTemplateLocaleId: id,
        branch,
      });
      return asTextContent(jobTemplateLocale);
    },
  );
}
