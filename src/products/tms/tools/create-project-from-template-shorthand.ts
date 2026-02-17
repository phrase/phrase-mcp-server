import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";
import { querySchema } from "#products/tms/tools/query.js";
import { resolveTemplateUidByShorthand } from "#products/tms/tools/template-shorthand.js";

export function registerCreateProjectFromTemplateShorthandTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_create_project_from_template_shorthand",
    {
      description:
        "Create a Phrase TMS project by resolving template shorthand (UID, numeric ID, exact name, prefix, partial name) and applying it via /api2/v2/projects/applyTemplate/{projectTemplateUid}. This operation mutates data.",
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
