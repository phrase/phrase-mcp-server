import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetProjectTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_project",
    {
      description:
        "Get a Phrase TMS project by UID (GET /api2/v1/projects/{projectUid}). Read-only operation.",
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID (not numeric internal ID)."),
      },
    },
    async ({ project_uid }) => {
      const project = await runtime.client.get(`/v1/projects/${encodeURIComponent(project_uid)}`);
      return asTextContent(project);
    },
  );
}
