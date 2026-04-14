import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerStartJobTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_start_job",
    {
      description: "Start a draft job in a Phrase Strings project.",
      annotations: { title: "[Strings] Start Job", destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, id, branch }) => {
      const job = await runtime.client.jobsApi.jobStart({
        projectId: project_id,
        id,
        jobStartParameters: {
          branch,
        },
      });
      return asTextContent(job);
    },
  );
}
