import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerUpdateTranslationTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_update_translation",
    {
      description: "Update an existing translation in a Phrase Strings project.",
      annotations: { destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
        content: z.string().optional(),
        plural_suffix: z.enum(["zero", "one", "two", "few", "many", "other"]).optional(),
        unverified: z.boolean().optional(),
        excluded: z.boolean().optional(),
        autotranslate: z.boolean().optional(),
        reviewed: z.boolean().optional(),
      },
    },
    async ({
      project_id,
      id,
      branch,
      content,
      plural_suffix,
      unverified,
      excluded,
      autotranslate,
      reviewed,
    }) => {
      const translation = await runtime.client.translationsApi.translationUpdate({
        projectId: project_id,
        id,
        translationUpdateParameters: {
          branch,
          content,
          pluralSuffix: plural_suffix,
          unverified,
          excluded,
          autotranslate,
          reviewed,
        },
      });
      return asTextContent(translation);
    },
  );
}
