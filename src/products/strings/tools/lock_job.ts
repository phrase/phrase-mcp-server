import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerLockJobTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_lock_job",
    {
      description: "Lock a job in a Phrase Strings project.",
      annotations: { destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, id, branch }) => {
      const result = await runtime.client.jobsApi.jobLock({
        projectId: project_id,
        id,
        branch,
      });
      return asTextContent(result);
    },
  );
}
