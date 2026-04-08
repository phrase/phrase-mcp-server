import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateKeyTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_create_key",
    {
      description: "Create a new translation key in a Phrase Strings project.",
      annotations: { destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        name: z.string().min(1),
        branch: z.string().optional(),
        description: z.string().optional(),
        plural: z.boolean().optional(),
        name_plural: z.string().optional(),
        data_type: z.enum(["string", "number", "boolean", "array", "markdown"]).optional(),
        tags: z.string().optional(),
        max_characters_allowed: z.number().int().min(0).optional(),
        unformatted: z.boolean().optional(),
        xml_space_preserve: z.boolean().optional(),
        default_translation_content: z.string().optional(),
        autotranslate: z.boolean().optional(),
        custom_metadata: z.record(z.unknown()).optional(),
      },
    },
    async ({
      project_id,
      name,
      branch,
      description,
      plural,
      name_plural,
      data_type,
      tags,
      max_characters_allowed,
      unformatted,
      xml_space_preserve,
      default_translation_content,
      autotranslate,
      custom_metadata,
    }) => {
      const key = await runtime.client.keysApi.keyCreate({
        projectId: project_id,
        keyCreateParameters: {
          branch,
          name,
          description,
          plural,
          namePlural: name_plural,
          dataType: data_type,
          tags,
          maxCharactersAllowed: max_characters_allowed,
          unformatted,
          xmlSpacePreserve: xml_space_preserve,
          defaultTranslationContent: default_translation_content,
          autotranslate,
          customMetadata: custom_metadata,
        },
      });
      return asTextContent(key);
    },
  );
}
