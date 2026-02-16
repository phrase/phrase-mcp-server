import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { TmsClient } from "../client.js";

export function registerCreateProjectTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "tms_create_project",
    {
      description:
        "Create a Phrase TMS project (POST /api2/v3/projects). This operation mutates data and typically requires Project Manager permissions.",
      inputSchema: {
        project: z
          .record(z.unknown())
          .describe("ProjectCreateV3 request payload as defined by Phrase TMS API."),
      },
    },
    async ({ project }) => {
      const created = await (runtime.client as TmsClient).postJson("/v3/projects", project);
      return asTextContent(created);
    },
  );
}
