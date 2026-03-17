import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateProjectTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_create_project",
    {
      description: "Create a project in Phrase Strings.",
      inputSchema: {
        name: z.string().min(1),
        main_format: z.string().optional(),
        media: z.string().optional(),
        shares_translation_memory: z.boolean().optional(),
        account_id: z.string().optional(),
        point_of_contact: z.string().optional(),
        source_project_id: z.string().optional(),
        workflow: z.string().optional(),
        machine_translation_enabled: z.boolean().optional(),
        enable_branching: z.boolean().optional(),
        protect_master_branch: z.boolean().optional(),
        enable_all_data_type_translation_keys_for_translators: z.boolean().optional(),
        enable_icu_message_format: z.boolean().optional(),
        zero_plural_form_enabled: z.boolean().optional(),
        autotranslate_enabled: z.boolean().optional(),
        autotranslate_check_new_translation_keys: z.boolean().optional(),
        autotranslate_check_new_uploads: z.boolean().optional(),
        autotranslate_check_new_locales: z.boolean().optional(),
        autotranslate_mark_as_unverified: z.boolean().optional(),
        autotranslate_use_machine_translation: z.boolean().optional(),
        autotranslate_use_translation_memory: z.boolean().optional(),
      },
    },
    async ({
      name,
      main_format,
      media,
      shares_translation_memory,
      account_id,
      point_of_contact,
      source_project_id,
      workflow,
      machine_translation_enabled,
      enable_branching,
      protect_master_branch,
      enable_all_data_type_translation_keys_for_translators,
      enable_icu_message_format,
      zero_plural_form_enabled,
      autotranslate_enabled,
      autotranslate_check_new_translation_keys,
      autotranslate_check_new_uploads,
      autotranslate_check_new_locales,
      autotranslate_mark_as_unverified,
      autotranslate_use_machine_translation,
      autotranslate_use_translation_memory,
    }) => {
      const project = await runtime.client.projectsApi.projectCreate({
        projectCreateParameters: {
          name,
          mainFormat: main_format,
          media,
          sharesTranslationMemory: shares_translation_memory,
          accountId: account_id,
          pointOfContact: point_of_contact,
          sourceProjectId: source_project_id,
          workflow,
          machineTranslationEnabled: machine_translation_enabled,
          enableBranching: enable_branching,
          protectMasterBranch: protect_master_branch,
          enableAllDataTypeTranslationKeysForTranslators:
            enable_all_data_type_translation_keys_for_translators,
          enableIcuMessageFormat: enable_icu_message_format,
          zeroPluralFormEnabled: zero_plural_form_enabled,
          autotranslateEnabled: autotranslate_enabled,
          autotranslateCheckNewTranslationKeys: autotranslate_check_new_translation_keys,
          autotranslateCheckNewUploads: autotranslate_check_new_uploads,
          autotranslateCheckNewLocales: autotranslate_check_new_locales,
          autotranslateMarkAsUnverified: autotranslate_mark_as_unverified,
          autotranslateUseMachineTranslation: autotranslate_use_machine_translation,
          autotranslateUseTranslationMemory: autotranslate_use_translation_memory,
        },
      });
      return asTextContent(project);
    },
  );
}
