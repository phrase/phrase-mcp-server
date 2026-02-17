import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import type { ProductRuntime } from "../../types.js";
import type { StringsClient } from "../client.js";

export function registerGlossaryCreateTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_create_glossary",
    {
      description: "Create a term base (previously: glossary) in Phrase Strings.",
      inputSchema: {
        account_id: z.string().min(1),
        name: z.string().min(1),
        project_ids: z.union([z.string(), z.array(z.string().min(1))]).optional(),
        space_ids: z.array(z.string().min(1)).optional(),
      },
    },
    async ({ account_id, name, project_ids, space_ids }) => {
      const glossary = await (runtime.client as StringsClient).glossariesApi.glossaryCreate({
        accountId: account_id,
        glossaryCreateParameters: {
          name,
          projectIds: Array.isArray(project_ids) ? project_ids.join(",") : project_ids,
          spaceIds: space_ids,
        },
      });
      return asTextContent(glossary);
    },
  );
}
