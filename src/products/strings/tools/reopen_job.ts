import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { StringsClient } from "../client.js";

export function registerReopenJobTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_reopen_job",
    {
      description: "Reopen a completed job in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, id, branch }) => {
      const job = await (runtime.client as StringsClient).jobsApi.jobReopen({
        projectId: project_id,
        id,
        jobReopenParameters: {
          branch,
        },
      });
      return asTextContent(job);
    },
  );
}
