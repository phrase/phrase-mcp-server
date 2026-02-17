import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

export function registerRemoveJobKeysTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_remove_job_keys",
    {
      description: "Remove translation keys from a job in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        translation_key_ids: z.array(z.string()).min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, id, translation_key_ids, branch }) => {
      const result = await runtime.client.jobsApi.jobKeysDelete({
        projectId: project_id,
        id,
        jobKeysDeleteParameters: {
          translationKeyIds: translation_key_ids,
          branch,
        },
      });
      return asTextContent(result);
    },
  );
}
