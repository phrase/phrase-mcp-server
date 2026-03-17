import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateJobTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_create_job",
    {
      description: "Create a job in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        name: z.string().min(1),
        branch: z.string().optional(),
        source_locale_id: z.string().optional(),
        briefing: z.string().optional(),
        due_date: z.string().datetime({ offset: true }).nullable().optional(),
        ticket_url: z.string().url().optional(),
        tags: z.array(z.string()).optional(),
        translation_key_ids: z.array(z.string()).optional(),
        job_template_id: z.string().optional(),
      },
    },
    async ({
      project_id,
      name,
      branch,
      source_locale_id,
      briefing,
      due_date,
      ticket_url,
      tags,
      translation_key_ids,
      job_template_id,
    }) => {
      const job = await runtime.client.jobsApi.jobCreate({
        projectId: project_id,
        jobCreateParameters: {
          name,
          branch,
          sourceLocaleId: source_locale_id,
          briefing,
          dueDate: due_date === undefined || due_date === null ? due_date : new Date(due_date),
          ticketUrl: ticket_url,
          tags,
          translationKeyIds: translation_key_ids,
          jobTemplateId: job_template_id,
        },
      });
      return asTextContent(job);
    },
  );
}
