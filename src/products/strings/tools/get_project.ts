import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import type { ProductRuntime } from "../../types.js";
import type { StringsClient } from "../client.js";

export function registerGetProjectTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_get_project",
    {
      description: "Get a single project in a Phrase Strings account.",
      inputSchema: {
        id: z.string().min(1),
      },
    },
    async ({ id }) => {
      const project = await (runtime.client as StringsClient).projectsApi.projectShow({ id });
      return asTextContent(project);
    },
  );
}
