import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

export function registerListUploadsTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_list_uploads",
    {
      description: "List uploads for a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, page, per_page, branch }) => {
      const uploads = await runtime.client.uploadsApi.uploadsList({
        projectId: project_id,
        page,
        perPage: per_page,
        branch,
      });
      return asTextContent(uploads);
    },
  );
}
