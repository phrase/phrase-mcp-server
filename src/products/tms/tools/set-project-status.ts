import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";
import { projectStatusSchema } from "#products/tms/tools/constants";

export function registerSetProjectStatusTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_set_project_status",
    {
      description:
        "Change the status of a Phrase TMS project. Check current status with tms_get_project first. CANCELLED is irreversible. (POST /api2/v1/projects/{projectUid}/setStatus)",
      annotations: { destructiveHint: true },
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID."),
        status: projectStatusSchema.describe(
          `Target project status. Allowed values: ${projectStatusSchema.options.join(", ")}. CANCELLED is irreversible.`,
        ),
      },
    },
    async ({ project_uid, status }) => {
      const response = await runtime.client.postJson(
        `/v1/projects/${encodeURIComponent(project_uid)}/setStatus`,
        {
          status,
        },
      );
      return asTextContent(response);
    },
  );
}
