import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { StringsClient } from "../client.js";

export function registerUpdateJobTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_update_job",
    {
      description: "Update a job in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
        name: z.string().optional(),
        briefing: z.string().optional(),
        due_date: z.string().datetime({ offset: true }).nullable().optional(),
        ticket_url: z.string().url().optional(),
      },
    },
    async ({ project_id, id, branch, name, briefing, due_date, ticket_url }) => {
      const job = await (runtime.client as StringsClient).jobsApi.jobUpdate({
        projectId: project_id,
        id,
        jobUpdateParameters: {
          branch,
          name,
          briefing,
          dueDate: due_date === undefined || due_date === null ? due_date : new Date(due_date),
          ticketUrl: ticket_url,
        },
      });
      return asTextContent(job);
    },
  );
}
