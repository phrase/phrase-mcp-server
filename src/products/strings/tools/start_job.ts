import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { StringsClient } from "../client.js";

export function registerStartJobTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_start_job",
    {
      description: "Start a draft job in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, id, branch }) => {
      const job = await (runtime.client as StringsClient).jobsApi.jobStart({
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
