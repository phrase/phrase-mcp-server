import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { StringsClient } from "../client.js";

export function registerLockJobTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_lock_job",
    {
      description: "Lock a job in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, id, branch }) => {
      const result = await (runtime.client as StringsClient).jobsApi.jobLock({
        projectId: project_id,
        id,
        branch,
      });
      return asTextContent(result);
    },
  );
}
