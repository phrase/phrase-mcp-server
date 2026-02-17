import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

export function registerGetJobTemplateTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_get_job_template",
    {
      description: "Get a single job template in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, id, branch }) => {
      const jobTemplate = await runtime.client.jobTemplatesApi.jobTemplatesShow({
        projectId: project_id,
        id,
        branch,
      });
      return asTextContent(jobTemplate);
    },
  );
}
