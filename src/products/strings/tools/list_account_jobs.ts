import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListAccountJobsTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_list_account_jobs",
    {
      description: "List jobs for a Phrase Strings account.",
      inputSchema: {
        account_id: z.string().min(1),
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
        owned_by: z.string().optional(),
        assigned_to: z.string().optional(),
        state: z.string().optional(),
        updated_since: z.string().optional(),
      },
    },
    async ({ account_id, page, per_page, owned_by, assigned_to, state, updated_since }) => {
      const jobs = await runtime.client.jobsApi.jobsByAccount({
        accountId: account_id,
        page,
        perPage: per_page,
        ownedBy: owned_by,
        assignedTo: assigned_to,
        state,
        updatedSince: updated_since,
      });
      return asTextContent(jobs);
    },
  );
}
