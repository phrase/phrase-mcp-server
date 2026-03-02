import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCompleteJobTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_complete_job",
    {
      description: "Complete a job in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, id, branch }) => {
      const job = await runtime.client.jobsApi.jobComplete({
        projectId: project_id,
        id,
        jobCompleteParameters: {
          branch,
        },
      });
      return asTextContent(job);
    },
  );
}
