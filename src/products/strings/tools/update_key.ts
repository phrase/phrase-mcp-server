import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerUpdateKeyTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_update_key",
    {
      description: "Update an existing translation key in a Phrase Strings project.",
      annotations: { destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        id: z.string().min(1),
        branch: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        plural: z.boolean().optional(),
        name_plural: z.string().optional(),
        data_type: z.enum(["string", "number", "boolean", "array", "markdown"]).optional(),
        tags: z.string().optional(),
        max_characters_allowed: z.number().int().min(0).optional(),
        unformatted: z.boolean().optional(),
        xml_space_preserve: z.boolean().optional(),
        original_file: z.string().optional(),
        custom_metadata: z.record(z.unknown()).optional(),
      },
    },
    async ({
      project_id,
      id,
      branch,
      name,
      description,
      plural,
      name_plural,
      data_type,
      tags,
      max_characters_allowed,
      unformatted,
      xml_space_preserve,
      original_file,
      custom_metadata,
    }) => {
      const key = await runtime.client.keysApi.keyUpdate({
        projectId: project_id,
        id,
        keyUpdateParameters: {
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
          originalFile: original_file,
          customMetadata: custom_metadata,
        },
      });
      return asTextContent(key);
    },
  );
}
