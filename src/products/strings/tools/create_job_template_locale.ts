import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateJobTemplateLocaleTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_create_job_template_locale",
    {
      description: "Create a job template locale for a job template in a Phrase Strings project.",
      annotations: { title: "[Strings] Create Job Template Locale", destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        job_template_id: z.string().min(1),
        locale_id: z.string().min(1),
        branch: z.string().optional(),
        user_ids: z.array(z.string()).optional(),
        reviewer_ids: z.array(z.string()).optional(),
        translator_team_ids: z.array(z.string()).optional(),
        reviewer_team_ids: z.array(z.string()).optional(),
      },
    },
    async ({
      project_id,
      job_template_id,
      locale_id,
      branch,
      user_ids,
      reviewer_ids,
      translator_team_ids,
      reviewer_team_ids,
    }) => {
      const jobTemplateLocale = await runtime.client.jobTemplateLocalesApi.jobTemplateLocalesCreate(
        {
          projectId: project_id,
          jobTemplateId: job_template_id,
          jobTemplateLocalesCreateParameters: {
            localeId: locale_id,
            branch,
            userIds: user_ids,
            reviewerIds: reviewer_ids,
            translatorTeamIds: translator_team_ids,
            reviewerTeamIds: reviewer_team_ids,
          },
        },
      );
      return asTextContent(jobTemplateLocale);
    },
  );
}
