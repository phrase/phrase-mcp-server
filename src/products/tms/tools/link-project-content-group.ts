import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerLinkProjectContentGroupTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_link_project_content_group",
    {
      description:
        "Link a TMS project to a Content Group. Returns the linked Content Group. Returns 422 Unprocessable Entity if the project already has style guides assigned. (POST /api2/v1/projects/{projectUid}/contentGroup)",
      annotations: { title: "[TMS] Link Project Content Group", destructiveHint: true },
      inputSchema: {
        projectUid: z.string().min(1).describe("UID of the project to link."),
        contentGroupId: z.string().min(1).describe("ID of the Content Group to link to the project."),
      },
    },
    async ({ projectUid, contentGroupId }) => {
      const result = await runtime.client.postJson(
        `/v1/projects/${encodeURIComponent(projectUid)}/contentGroup`,
        { contentGroupId },
      );
      return asTextContent(result);
    },
  );
}
