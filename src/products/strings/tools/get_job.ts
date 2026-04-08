import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetJobTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_get_job",
    {
      description: "Get a single job in a Phrase Strings project.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
        include_annotations: z.boolean().optional(),
        omit_translation_keys: z.boolean().optional(),
      },
    },
    async ({ project_id, id, branch, include_annotations, omit_translation_keys }) => {
      const job = await runtime.client.jobsApi.jobShow({
        projectId: project_id,
        id,
        branch,
        includeAnnotations: include_annotations,
        omitTranslationKeys: omit_translation_keys,
      });
      return asTextContent(job);
    },
  );
}
