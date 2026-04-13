import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";
import { querySchema } from "#products/tms/tools/query";
import { resolveTemplateUidByShorthand } from "#products/tms/tools/template-shorthand";

export function registerCreateProjectFromTemplateShorthandTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_create_project_from_template_shorthand",
    {
      description:
        "PREFERRED tool for creating a TMS project from a template in conversational/interactive contexts. Accepts a template name, partial name, UID, or numeric ID, no lookup step needed. Returns an error if the identifier is ambiguous (multiple matches) or not found. (POST /api2/v2/projects/applyTemplate/{templateUid})",
      annotations: { title: "[TMS] Create Project from Template", destructiveHint: true },
      inputSchema: {
        template: z
          .string()
          .min(1)
          .describe("Template shorthand: UID, numeric ID, exact name, or name fragment."),
        payload: z
          .record(z.unknown())
          .optional()
          .describe("Optional apply-template payload (name override, dates, languages, etc.)."),
        query: querySchema,
      },
    },
    async ({ template, payload, query }) => {
      const client = runtime.client;
      const templateUid = await resolveTemplateUidByShorthand(client, template, query);
      const created = await client.postJson(
        `/v2/projects/applyTemplate/${encodeURIComponent(templateUid)}`,
        payload ?? {},
      );
      return asTextContent({
        template_uid: templateUid,
        project: created,
      });
    },
  );
}
