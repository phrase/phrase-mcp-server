import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerUpdateJobLocaleTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_update_job_locale",
    {
      description: "Update a target locale for a job in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        job_id: z.string().min(1),
        id: z.string().min(1),
        locale_id: z.string().optional(),
        branch: z.string().optional(),
        user_ids: z.array(z.string()).optional(),
        reviewer_ids: z.array(z.string()).optional(),
        translator_team_ids: z.array(z.string()).optional(),
        reviewer_team_ids: z.array(z.string()).optional(),
      },
    },
    async ({
      project_id,
      job_id,
      id,
      locale_id,
      branch,
      user_ids,
      reviewer_ids,
      translator_team_ids,
      reviewer_team_ids,
    }) => {
      const locale = await runtime.client.jobLocalesApi.jobLocaleUpdate({
        projectId: project_id,
        jobId: job_id,
        id,
        jobLocaleUpdateParameters: {
          localeId: locale_id,
          branch,
          userIds: user_ids,
          reviewerIds: reviewer_ids,
          translatorTeamIds: translator_team_ids,
          reviewerTeamIds: reviewer_team_ids,
        },
      });
      return asTextContent(locale);
    },
  );
}
