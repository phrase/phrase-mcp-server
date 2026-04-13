import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetProjectTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_get_project",
    {
      description: "Get a single project in a Phrase Strings account.",
      annotations: { title: "[Strings] Get Project", readOnlyHint: true },
      inputSchema: {
        id: z.string().min(1),
      },
    },
    async ({ id }) => {
      const project = await runtime.client.projectsApi.projectShow({ id });
      return asTextContent(project);
    },
  );
}
