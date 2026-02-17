import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import type { ProductRuntime } from "../../types.js";
import type { StringsClient } from "../client.js";

export function registerCompleteJobTool(server: McpServer, runtime: ProductRuntime) {
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
      const job = await (runtime.client as StringsClient).jobsApi.jobComplete({
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
