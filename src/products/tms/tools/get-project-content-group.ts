import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetProjectContentGroupTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_get_project_content_group",
    {
      description:
        "Get the Content Group linked to a TMS project. Returns the Content Group's id and name, or 404 if none is linked. (GET /api2/v1/projects/{projectUid}/contentGroup)",
      annotations: { title: "[TMS] Get Project Content Group", readOnlyHint: true },
      inputSchema: {
        projectUid: z.string().min(1).describe("UID of the project."),
      },
    },
    async ({ projectUid }) => {
      const result = await runtime.client.get(
        `/v1/projects/${encodeURIComponent(projectUid)}/contentGroup`,
      );
      return asTextContent(result);
    },
  );
}
