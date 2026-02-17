import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

export function registerGlossaryUpdateTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_update_glossary",
    {
      description: "Update a term base (previously: glossary) in Phrase Strings.",
      inputSchema: {
        account_id: z.string().min(1),
        id: z.string().min(1),
        name: z.string().optional(),
        project_ids: z.union([z.string(), z.array(z.string().min(1))]).optional(),
        space_ids: z.array(z.string().min(1)).optional(),
      },
    },
    async ({ account_id, id, name, project_ids, space_ids }) => {
      const glossary = await runtime.client.glossariesApi.glossaryUpdate({
        accountId: account_id,
        id,
        glossaryUpdateParameters: {
          name,
          projectIds: Array.isArray(project_ids) ? project_ids.join(",") : project_ids,
          spaceIds: space_ids,
        },
      });
      return asTextContent(glossary);
    },
  );
}
