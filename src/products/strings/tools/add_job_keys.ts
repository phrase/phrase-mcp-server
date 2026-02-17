import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { StringsClient } from "../client.js";

export function registerAddJobKeysTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_add_job_keys",
    {
      description: "Add translation keys to a job in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        translation_key_ids: z.array(z.string()).min(1),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, id, translation_key_ids, branch }) => {
      const job = await (runtime.client as StringsClient).jobsApi.jobKeysCreate({
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
