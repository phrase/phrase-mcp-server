import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import type { ProductRuntime } from "../../types.js";
import type { StringsClient } from "../client.js";

export function registerListJobsTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_list_jobs",
    {
      description: "List jobs for a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
        branch: z.string().optional(),
        owned_by: z.string().optional(),
        assigned_to: z.string().optional(),
        state: z.string().optional(),
        updated_since: z.string().optional(),
      },
    },
    async ({ project_id, page, per_page, branch, owned_by, assigned_to, state, updated_since }) => {
      const jobs = await (runtime.client as StringsClient).jobsApi.jobsList({
        projectId: project_id,
        page,
        perPage: per_page,
        branch,
        ownedBy: owned_by,
        assignedTo: assigned_to,
        state,
        updatedSince: updated_since,
      });
      return asTextContent(jobs);
    },
  );
}
