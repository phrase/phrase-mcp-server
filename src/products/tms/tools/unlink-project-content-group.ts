import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerUnlinkProjectContentGroupTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_unlink_project_content_group",
    {
      description:
        "Unlink a TMS project from its Content Group. Idempotent — returns 204 No Content even if no Content Group is currently linked. (DELETE /api2/v1/projects/{projectUid}/contentGroup)",
      annotations: { title: "[TMS] Unlink Project Content Group", destructiveHint: true },
      inputSchema: {
        projectUid: z.string().min(1).describe("UID of the project to unlink."),
      },
    },
    async ({ projectUid }) => {
      const result = await runtime.client.del(
        `/v1/projects/${encodeURIComponent(projectUid)}/contentGroup`,
      );
      return asTextContent(result);
    },
  );
}
