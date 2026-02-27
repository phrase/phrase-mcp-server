import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetProjectTemplateTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_project_template",
    {
      description:
        "Fetch full details of a project template, including its configured source/target languages, translation memory, machine translation engine, and workflow steps. Use list_project_templates to find the template UID. (GET /api2/v1/projectTemplates/{projectTemplateUid})",
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
