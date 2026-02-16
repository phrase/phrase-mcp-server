import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { TmsClient } from "../client.js";

export function registerGetProjectTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "tms_get_project",
    {
      description: "Get a Phrase TMS project by UID (GET /api2/v1/projects/{projectUid}). Read-only operation.",
      inputSchema: {
        project_uid: z
          .string()
          .min(1)
          .describe("TMS project UID (not numeric internal ID)."),
      },
    },
    async ({ project_uid }) => {
      const project = await (runtime.client as TmsClient).get(
        `/v1/projects/${encodeURIComponent(project_uid)}`,
      );
      return asTextContent(project);
    },
  );
}
