import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerUpdateProjectTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_update_project",
    {
      description:
        "Update an existing Phrase TMS project settings such as name, due date, or note. To change project status (e.g. mark Completed), use tms_set_project_status instead. (PUT /api2/v2/projects/{projectUid})",
      annotations: { destructiveHint: true },
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID."),
        project: z
          .record(z.unknown())
          .describe(
            "ProjectEditV2 request body. Common editable fields: name (string), dateDue (ISO 8601 datetime), note (string).",
          ),
      },
    },
    async ({ project_uid, project }) => {
      const updated = await runtime.client.putJson(
        `/v2/projects/${encodeURIComponent(project_uid)}`,
        project,
      );
      return asTextContent(updated);
    },
  );
}
