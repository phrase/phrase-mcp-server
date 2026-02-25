import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

function createUploadFile(data: Buffer, filePath: string): Blob {
  const filename = basename(filePath) || "upload";
  const bytes = new Uint8Array(data);
  if (typeof File !== "undefined") {
    return new File([bytes], filename);
  }
  return Object.assign(new Blob([bytes]), { name: filename }) as Blob;
}

async function toUploadError(response: Response): Promise<Error> {
  const prefix = `Phrase Strings upload failed (${response.status} ${response.statusText})`;
  const rawBody = await response.text().catch(() => "");
  if (!rawBody) {
    return new Error(prefix);
  }

  try {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>;
    if (Array.isArray(parsed.message)) {
      return new Error(`${prefix}: ${parsed.message.join("; ")}`);
    }
    if (typeof parsed.message === "string") {
      return new Error(`${prefix}: ${parsed.message}`);
    }
  } catch {
    // Fall back to a compact text response snippet.
  }

  const compact = rawBody.replace(/\s+/g, " ").trim();
  return new Error(`${prefix}: ${compact.slice(0, 600)}`);
}

export function registerCreateUploadTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_create_upload",
    {
      description:
        "Upload a new language file in a Phrase Strings project. This operation mutates data and reads a file from the MCP server filesystem.",
      inputSchema: {
        project_id: z.string().min(1),
        file_path: z
          .string()
          .min(1)
          .describe(
            "Absolute or relative filesystem path to the source file on the MCP server host.",
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
      const data = await readFile(file_path);
      const file = createUploadFile(data, file_path);
      try {
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
      } catch (error) {
        if (error instanceof Response) {
          throw await toUploadError(error);
        }
        throw error;
      }
    },
  );
}
