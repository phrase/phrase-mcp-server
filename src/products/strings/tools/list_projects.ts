import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { StringsClient } from "../client.js";

export function registerListProjectsTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_list_projects",
    {
      description: "List Phrase Strings projects available for the authenticated account.",
      inputSchema: {
        page: z.number().int().min(1).optional(),
        per_page: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ page, per_page }) => {
      const projects = await (runtime.client as StringsClient).projectsApi.projectsList({
        page,
        perPage: per_page,
      });
      return asTextContent(projects);
    },
  );
}
