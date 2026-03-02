import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateJobTemplateTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_create_job_template",
    {
      description: "Create a job template in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        name: z.string().min(1),
        branch: z.string().optional(),
        briefing: z.string().optional(),
      },
    },
    async ({ project_id, name, branch, briefing }) => {
      const jobTemplate = await runtime.client.jobTemplatesApi.jobTemplateCreate({
        projectId: project_id,
        jobTemplateCreateParameters: {
          name,
          branch,
          briefing,
        },
      });
      return asTextContent(jobTemplate);
    },
  );
}
