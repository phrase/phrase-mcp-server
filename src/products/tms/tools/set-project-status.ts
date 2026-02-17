import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

export function registerSetProjectStatusTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_set_project_status",
    {
      description:
        "Set Phrase TMS project status (POST /api2/v1/projects/{projectUid}/setStatus). This operation mutates data.",
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID."),
        status: z
          .string()
          .min(1)
          .describe(
            "Target project status value accepted by TMS (for example NEW, COMPLETED, CANCELLED).",
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
