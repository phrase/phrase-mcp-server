import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

export function registerGetProjectTemplateTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_project_template",
    {
      description:
        "Get a Phrase TMS project template by UID (GET /api2/v1/projectTemplates/{projectTemplateUid}). Read-only operation.",
      inputSchema: {
        template_uid: z.string().min(1).describe("Project template UID."),
      },
    },
    async ({ template_uid }) => {
      const template = await runtime.client.get(
        `/v1/projectTemplates/${encodeURIComponent(template_uid)}`,
      );
      return asTextContent(template);
    },
  );
}
