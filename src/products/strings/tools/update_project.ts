import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerUpdateProjectTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_update_project",
    {
      description: "Update an existing project in Phrase Strings.",
      inputSchema: {
        id: z.string().min(1),
        name: z.string().optional(),
        main_format: z.string().optional(),
        media: z.string().optional(),
        shares_translation_memory: z.boolean().optional(),
        workflow: z.enum(["simple", "review"]).optional(),
        machine_translation_enabled: z.boolean().optional(),
        point_of_contact: z.string().optional(),
      },
    },
    async ({
      id,
      name,
      main_format,
      media,
      shares_translation_memory,
      workflow,
      machine_translation_enabled,
      point_of_contact,
    }) => {
      const project = await runtime.client.projectsApi.projectUpdate({
        id,
        projectUpdateParameters: {
          name,
          mainFormat: main_format,
          media,
          sharesTranslationMemory: shares_translation_memory,
          workflow,
          machineTranslationEnabled: machine_translation_enabled,
          pointOfContact: point_of_contact,
        },
      });
      return asTextContent(project);
    },
  );
}
