import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetProjectTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_project",
    {
      description:
        "Fetch full details of a single Phrase TMS project, including status, source/target languages, due date, owner, and settings. Use tms_list_projects to find the project UID first if you only know the name. (GET /api2/v1/projects/{projectUid})",
      inputSchema: {
        project_uid: z
          .string()
          .min(1)
          .describe(
            "Unique TMS project identifier (alphanumeric string). Obtain from list_projects.",
          ),
      },
    },
    async ({ project_uid }) => {
      const project = await runtime.client.get(`/v1/projects/${encodeURIComponent(project_uid)}`);
      return asTextContent(project);
    },
  );
}
