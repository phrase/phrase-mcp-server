import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { TmsClient } from "../client.js";

export function registerUpdateProjectTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "tms_update_project",
    {
      description:
        "Update a Phrase TMS project (PUT /api2/v2/projects/{projectUid}). This operation mutates data.",
      inputSchema: {
        project_uid: z
          .string()
          .min(1)
          .describe("TMS project UID."),
        project: z
          .record(z.unknown())
          .describe("ProjectEditV2 request payload as defined by Phrase TMS API."),
      },
    },
    async ({ project_uid, project }) => {
      const updated = await (runtime.client as TmsClient).putJson(
        `/v2/projects/${encodeURIComponent(project_uid)}`,
        project,
      );
      return asTextContent(updated);
    },
  );
}
