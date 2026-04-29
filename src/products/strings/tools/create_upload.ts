import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

function createUploadFile(data: Buffer, filename: string): Blob {
  const bytes = new Uint8Array(data);
  if (typeof File !== "undefined") {
    return new File([bytes], filename);
  }
  return Object.assign(new Blob([bytes]), { name: filename }) as Blob;
}

export function registerCreateUploadTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_create_upload",
    {
      description:
        "Upload a new language file in a Phrase Strings project. Provide either file_path (host filesystem path, for local MCP server use) or file_content + file_name (base64-encoded file bytes, for Claude Desktop uploaded files).",
      annotations: { title: "[Strings] Upload Language File", destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        file_path: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Absolute or relative filesystem path to the source file on the MCP server host. Mutually exclusive with file_content.",
          ),
        file_content: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Base64-encoded file content. Use when the user uploaded a file in the conversation. Requires file_name. Mutually exclusive with file_path.",
          ),
        file_name: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Filename for the upload. Required when using file_content. Optional override when using file_path.",
          ),
        file_format: z.string().min(1),
        locale_id: z.string().min(1),
        branch: z.string().optional(),
        tags: z.string().optional(),
        update_translations: z.boolean().optional(),
        update_custom_metadata: z.boolean().optional(),
        update_translation_keys: z.boolean().optional(),
        update_translations_on_source_match: z.boolean().optional(),
        source_locale_id: z.string().optional(),
        update_descriptions: z.boolean().optional(),
        convert_emoji: z.boolean().optional(),
        skip_upload_tags: z.boolean().optional(),
        skip_unverification: z.boolean().optional(),
        file_encoding: z.string().optional(),
        locale_mapping: z.record(z.unknown()).optional(),
        format_options: z.record(z.unknown()).optional(),
        autotranslate: z.boolean().optional(),
        verify_mentioned_translations: z.boolean().optional(),
        mark_reviewed: z.boolean().optional(),
        tag_only_affected_keys: z.boolean().optional(),
        translation_key_prefix: z.string().optional(),
      },
    },
    async ({
      project_id,
      file_path,
      file_content,
      file_name,
      file_format,
      locale_id,
      branch,
      tags,
      update_translations,
      update_custom_metadata,
      update_translation_keys,
      update_translations_on_source_match,
      source_locale_id,
      update_descriptions,
      convert_emoji,
      skip_upload_tags,
      skip_unverification,
      file_encoding,
      locale_mapping,
      format_options,
      autotranslate,
      verify_mentioned_translations,
      mark_reviewed,
      tag_only_affected_keys,
      translation_key_prefix,
    }) => {
      if (!file_path && !file_content) {
        throw new Error("Either file_path or file_content must be provided.");
      }
      if (file_path && file_content) {
        throw new Error("file_path and file_content are mutually exclusive. Provide only one.");
      }

      let data: Buffer;
      let resolvedFilename: string;

      if (file_content) {
        if (!file_name) {
          throw new Error("file_name is required when using file_content.");
        }
        data = Buffer.from(file_content, "base64");
        resolvedFilename = file_name;
      } else {
        data = await readFile(file_path!);
        resolvedFilename = file_name ?? (basename(file_path!) || "upload");
      }

      const file = createUploadFile(data, resolvedFilename);
      const upload = await runtime.client.uploadsApi.uploadCreate({
        projectId: project_id,
        file,
        fileFormat: file_format,
        localeId: locale_id,
        branch,
        tags,
        updateTranslations: update_translations,
        updateCustomMetadata: update_custom_metadata,
        updateTranslationKeys: update_translation_keys,
        updateTranslationsOnSourceMatch: update_translations_on_source_match,
        sourceLocaleId: source_locale_id,
        updateDescriptions: update_descriptions,
        convertEmoji: convert_emoji,
        skipUploadTags: skip_upload_tags,
        skipUnverification: skip_unverification,
        fileEncoding: file_encoding,
        localeMapping: locale_mapping,
        formatOptions: format_options,
        autotranslate,
        verifyMentionedTranslations: verify_mentioned_translations,
        markReviewed: mark_reviewed,
        tagOnlyAffectedKeys: tag_only_affected_keys,
        translationKeyPrefix: translation_key_prefix,
      });
      return asTextContent(upload);
    },
  );
}
