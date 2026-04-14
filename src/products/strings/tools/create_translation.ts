import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateTranslationTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_create_translation",
    {
      description: "Create a translation for a key and locale in a Phrase Strings project.",
      annotations: { title: "[Strings] Create Translation", destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        locale_id: z.string().min(1),
        key_id: z.string().min(1),
        content: z.string(),
        branch: z.string().optional(),
        plural_suffix: z.enum(["zero", "one", "two", "few", "many", "other"]).optional(),
        unverified: z.boolean().optional(),
        excluded: z.boolean().optional(),
        autotranslate: z.boolean().optional(),
      },
    },
    async ({
      project_id,
      locale_id,
      key_id,
      content,
      branch,
      plural_suffix,
      unverified,
      excluded,
      autotranslate,
    }) => {
      const translation = await runtime.client.translationsApi.translationCreate({
        projectId: project_id,
        translationCreateParameters: {
          branch,
          localeId: locale_id,
          keyId: key_id,
          content,
          pluralSuffix: plural_suffix,
          unverified,
          excluded,
          autotranslate,
        },
      });
      return asTextContent(translation);
    },
  );
}
