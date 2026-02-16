import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { TmsClient } from "../client.js";

export function registerCreateProjectFromTemplateTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "tms_create_project_from_template",
    {
      description:
        "Create a Phrase TMS project from a template UID (POST /api2/v2/projects/applyTemplate/{projectTemplateUid}). This operation mutates data.",
      inputSchema: {
        template_uid: z
          .string()
          .min(1)
          .describe("Project template UID."),
        payload: z
          .record(z.unknown())
          .optional()
          .describe("Optional apply-template payload (name override, dates, languages, etc.)."),
      },
    },
    async ({ template_uid, payload }) => {
      const created = await (runtime.client as TmsClient).postJson(
        `/v2/projects/applyTemplate/${encodeURIComponent(template_uid)}`,
        payload ?? {},
      );
      return asTextContent(created);
    },
  );
}
