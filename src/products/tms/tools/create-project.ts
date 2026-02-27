import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateProjectTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_create_project",
    {
      description:
        "Create a new Phrase TMS project from scratch. Requires Project Manager permissions. For most use cases, prefer tms_create_project_from_template_shorthand instead, which applies pre-configured settings. Use this only when no suitable template exists. (POST /api2/v3/projects)",
      inputSchema: {
        project: z
          .record(z.unknown())
          .describe(
            'ProjectCreateV3 request body. Required: name (string), sourceLang (array, e.g. "en"), targetLangs (array, e.g. ["de", "fr"]). Optional: client.uid, businessUnit.uid, dateDue (ISO 8601), note, workflowSteps (array of step UIDs).',
          ),
      },
    },
    async ({ project }) => {
      const created = await runtime.client.postJson("/v3/projects", project);
      return asTextContent(created);
    },
  );
}
