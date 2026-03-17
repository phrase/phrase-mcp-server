import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateLocaleDownloadTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_create_locale_download",
    {
      description: "Initiate async download of a locale in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        locale_id: z.string().min(1),
        file_format: z.string().min(1),
        branch: z.string().optional(),
        tags: z.string().optional(),
        include_empty_translations: z.boolean().optional(),
        exclude_empty_zero_forms: z.boolean().optional(),
        include_translated_keys: z.boolean().optional(),
        keep_notranslate_tags: z.boolean().optional(),
        format_options: z.record(z.unknown()).optional(),
        encoding: z.enum(["UTF-8", "UTF-16", "ISO-8859-1"]).optional(),
        include_unverified_translations: z.boolean().optional(),
        use_last_reviewed_version: z.boolean().optional(),
        locale_ids: z.array(z.string()).optional(),
        fallback_locale_id: z.string().optional(),
        source_locale_id: z.string().optional(),
        custom_metadata_filters: z.record(z.unknown()).optional(),
        updated_since: z.string().optional(),
      },
    },
    async ({
      project_id,
      locale_id,
      file_format,
      branch,
      tags,
      include_empty_translations,
      exclude_empty_zero_forms,
      include_translated_keys,
      keep_notranslate_tags,
      format_options,
      encoding,
      include_unverified_translations,
      use_last_reviewed_version,
      locale_ids,
      fallback_locale_id,
      source_locale_id,
      custom_metadata_filters,
      updated_since,
    }) => {
      const localeDownload = await runtime.client.localeDownloadsApi.localeDownloadCreate({
        projectId: project_id,
        localeId: locale_id,
        localeDownloadCreateParameters: {
          fileFormat: file_format,
          branch,
          tags,
          includeEmptyTranslations: include_empty_translations,
          excludeEmptyZeroForms: exclude_empty_zero_forms,
          includeTranslatedKeys: include_translated_keys,
          keepNotranslateTags: keep_notranslate_tags,
          formatOptions: format_options,
          encoding,
          includeUnverifiedTranslations: include_unverified_translations,
          useLastReviewedVersion: use_last_reviewed_version,
          localeIds: locale_ids,
          fallbackLocaleId: fallback_locale_id,
          sourceLocaleId: source_locale_id,
          customMetadataFilters: custom_metadata_filters,
          updatedSince: updated_since,
        },
      });
      return asTextContent(localeDownload);
    },
  );
}
