import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerAddJobKeysTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_add_job_keys",
    {
      description: "Add translation keys to a job in a Phrase Strings project.",
      annotations: { destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        translation_key_ids: z.array(z.string()).min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, id, translation_key_ids, branch }) => {
      const job = await runtime.client.jobsApi.jobKeysCreate({
        projectId: project_id,
        id,
        jobKeysCreateParameters: {
          translationKeyIds: translation_key_ids,
          branch,
        },
      });
      return asTextContent(job);
    },
  );
}
