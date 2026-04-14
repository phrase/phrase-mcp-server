import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateProjectFromTemplateTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_create_project_from_template",
    {
      description:
        "Create a Phrase TMS project by applying a template. The template pre-configures language pairs, TM, MT, and workflow. You must know the exact template UID, use tms_list_project_templates to find it, or use tms_create_project_from_template_shorthand to match by name automatically. (POST /api2/v2/projects/applyTemplate/{templateUid})",
      annotations: {
        title: "[TMS] Create Project from Template (Exact UID)",
        destructiveHint: true,
      },
      inputSchema: {
        template_uid: z.string().min(1).describe("Project template UID."),
        payload: z
          .record(z.unknown())
          .optional()
          .describe(
            "Optional overrides applied on top of template defaults. Common fields: name (string, project name), dateDue (ISO 8601 datetime), targetLangs (string[], overrides template target langs). Leave empty to use all template defaults.",
          ),
      },
    },
    async ({ template_uid, payload }) => {
      const created = await runtime.client.postJson(
        `/v2/projects/applyTemplate/${encodeURIComponent(template_uid)}`,
        payload ?? {},
      );
      return asTextContent(created);
    },
  );
}
