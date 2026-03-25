import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProductModule } from "#products/types";
import { StringsClient } from "#products/strings/client";
import { registerAddJobLocaleTool } from "#products/strings/tools/add_job_locale";
import { registerAddJobKeysTool } from "#products/strings/tools/add_job_keys";
import { registerCompleteJobLocaleTool } from "#products/strings/tools/complete_job_locale";
import { registerCompleteJobTool } from "#products/strings/tools/complete_job";
import { registerCreateJobCommentTool } from "#products/strings/tools/create_job_comment";
import { registerCreateJobTemplateLocaleTool } from "#products/strings/tools/create_job_template_locale";
import { registerCreateJobTemplateTool } from "#products/strings/tools/create_job_template";
import { registerCreateJobTool } from "#products/strings/tools/create_job";
import { registerCreateLocaleTool } from "#products/strings/tools/create_locale";
import { registerGetLocaleTool } from "#products/strings/tools/get_locale";
import { registerUpdateLocaleTool } from "#products/strings/tools/update_locale";
import { registerDeleteLocaleTool } from "#products/strings/tools/delete_locale";
import { registerCreateProjectTool } from "#products/strings/tools/create_project";
import { registerUpdateProjectTool } from "#products/strings/tools/update_project";
import { registerDeleteProjectTool } from "#products/strings/tools/delete_project";
import { registerGetJobTemplateLocaleTool } from "#products/strings/tools/get_job_template_locale";
import { registerGetJobTemplateTool } from "#products/strings/tools/get_job_template";
import { registerGlossariesListTool } from "#products/strings/tools/list_glossaries";
import { registerGlossaryCreateTool } from "#products/strings/tools/create_glossary";
import { registerGlossaryShowTool } from "#products/strings/tools/get_glossary";
import { registerGlossaryTermCreateTool } from "#products/strings/tools/create_glossary_term";
import { registerGlossaryTermShowTool } from "#products/strings/tools/get_glossary_term";
import { registerGlossaryTermsListTool } from "#products/strings/tools/list_glossary_terms";
import { registerGlossaryTermTranslationCreateTool } from "#products/strings/tools/create_glossary_term_translation";
import { registerGlossaryTermTranslationUpdateTool } from "#products/strings/tools/update_glossary_term_translation";
import { registerGlossaryTermUpdateTool } from "#products/strings/tools/update_glossary_term";
import { registerGlossaryTermDeleteTool } from "#products/strings/tools/delete_glossary_term";
import { registerGlossaryUpdateTool } from "#products/strings/tools/update_glossary";
import { registerGetJobCommentTool } from "#products/strings/tools/get_job_comment";
import { registerGetJobLocaleTool } from "#products/strings/tools/get_job_locale";
import { registerGetJobTool } from "#products/strings/tools/get_job";
import { registerGetProjectTool } from "#products/strings/tools/get_project";
import { registerListAccountJobsTool } from "#products/strings/tools/list_account_jobs";
import { registerListFormatsTool } from "#products/strings/tools/list_formats";
import { registerListJobCommentsTool } from "#products/strings/tools/list_job_comments";
import { registerListJobLocalesTool } from "#products/strings/tools/list_job_locales";
import { registerListJobTemplateLocalesTool } from "#products/strings/tools/list_job_template_locales";
import { registerListJobTemplatesTool } from "#products/strings/tools/list_job_templates";
import { registerCreateKeyTool } from "#products/strings/tools/create_key";
import { registerGetKeyTool } from "#products/strings/tools/get_key";
import { registerUpdateKeyTool } from "#products/strings/tools/update_key";
import { registerDeleteKeyTool } from "#products/strings/tools/delete_key";
import { registerListKeysTool } from "#products/strings/tools/list_keys";
import { registerListJobsTool } from "#products/strings/tools/list_jobs";
import { registerListLocalesTool } from "#products/strings/tools/list_locales";
import { registerCreateLocaleDownloadTool } from "#products/strings/tools/create_locale_download";
import { registerGetLocaleDownloadTool } from "#products/strings/tools/get_locale_download";
import { registerCreateUploadTool } from "#products/strings/tools/create_upload";
import { registerGetUploadTool } from "#products/strings/tools/get_upload";
import { registerListUploadsTool } from "#products/strings/tools/list_uploads";
import { registerListProjectsTool } from "#products/strings/tools/list_projects";
import { registerCreateTranslationTool } from "#products/strings/tools/create_translation";
import { registerGetTranslationTool } from "#products/strings/tools/get_translation";
import { registerUpdateTranslationTool } from "#products/strings/tools/update_translation";
import { registerListTranslationsTool } from "#products/strings/tools/list_translations";
import { registerListBranchesTool } from "#products/strings/tools/list_branches";
import { registerGetBranchTool } from "#products/strings/tools/get_branch";
import { registerCreateBranchTool } from "#products/strings/tools/create_branch";
import { registerUpdateBranchTool } from "#products/strings/tools/update_branch";
import { registerDeleteBranchTool } from "#products/strings/tools/delete_branch";
import { registerMergeBranchTool } from "#products/strings/tools/merge_branch";
import { registerCompareBranchTool } from "#products/strings/tools/compare_branch";
import { registerGetBranchComparisonTool } from "#products/strings/tools/get_branch_comparison";
import { registerSyncBranchTool } from "#products/strings/tools/sync_branch";
import { registerLockJobTool } from "#products/strings/tools/lock_job";
import { registerRemoveJobLocaleTool } from "#products/strings/tools/remove_job_locale";
import { registerRemoveJobKeysTool } from "#products/strings/tools/remove_job_keys";
import { registerReopenJobLocaleTool } from "#products/strings/tools/reopen_job_locale";
import { registerReopenJobTool } from "#products/strings/tools/reopen_job";
import { registerReviewJobLocaleTool } from "#products/strings/tools/review_job_locale";
import { registerStartJobTool } from "#products/strings/tools/start_job";
import { registerUpdateJobLocaleTool } from "#products/strings/tools/update_job_locale";
import { registerUnlockJobTool } from "#products/strings/tools/unlock_job";
import { registerUpdateJobTool } from "#products/strings/tools/update_job";
import { toStringsApiError } from "#products/strings/tools/error";

function withStringsErrorHandling(server: McpServer): McpServer {
  const registerTool = ((...args: unknown[]) => {
    const [name, options, handler] = args as [
      string,
      unknown,
      (...handlerArgs: unknown[]) => Promise<unknown> | unknown,
    ];
    (server.registerTool as (...toolArgs: unknown[]) => unknown)(
      name,
      options,
      async (...handlerArgs: unknown[]) => {
        try {
          return await handler(...handlerArgs);
        } catch (error) {
          throw await toStringsApiError(error, "request");
        }
      },
    );
  }) as McpServer["registerTool"];

  return { registerTool } as unknown as McpServer;
}

export const stringsModule: ProductModule<"strings"> = {
  key: "strings",
  client: {
    defaultBaseUrl: "https://api.phrase.com/v2",
    defaultBaseUrlsByRegion: {
      eu: "https://api.phrase.com/v2",
      us: "https://api.us.app.phrase.com/v2",
    },
    defaultAuthPrefix: "Bearer",
    baseUrlEnvAliases: ["PHRASE_BASE_URL"],
    createClient: (options) => new StringsClient(options),
  },
  register(server, runtime) {
    const wrappedServer = withStringsErrorHandling(server);
    registerListProjectsTool(wrappedServer, runtime);
    registerGetProjectTool(wrappedServer, runtime);
    registerCreateProjectTool(wrappedServer, runtime);
    registerUpdateProjectTool(wrappedServer, runtime);
    registerDeleteProjectTool(wrappedServer, runtime);
    registerGlossariesListTool(wrappedServer, runtime);
    registerGlossaryShowTool(wrappedServer, runtime);
    registerGlossaryCreateTool(wrappedServer, runtime);
    registerGlossaryUpdateTool(wrappedServer, runtime);
    registerGlossaryTermCreateTool(wrappedServer, runtime);
    registerGlossaryTermShowTool(wrappedServer, runtime);
    registerGlossaryTermsListTool(wrappedServer, runtime);
    registerGlossaryTermTranslationCreateTool(wrappedServer, runtime);
    registerGlossaryTermTranslationUpdateTool(wrappedServer, runtime);
    registerGlossaryTermUpdateTool(wrappedServer, runtime);
    registerGlossaryTermDeleteTool(wrappedServer, runtime);
    registerListFormatsTool(wrappedServer, runtime);
    registerCreateLocaleTool(wrappedServer, runtime);
    registerGetLocaleTool(wrappedServer, runtime);
    registerUpdateLocaleTool(wrappedServer, runtime);
    registerDeleteLocaleTool(wrappedServer, runtime);
    registerListLocalesTool(wrappedServer, runtime);
    registerCreateLocaleDownloadTool(wrappedServer, runtime);
    registerGetLocaleDownloadTool(wrappedServer, runtime);
    registerCreateUploadTool(wrappedServer, runtime);
    registerGetUploadTool(wrappedServer, runtime);
    registerListUploadsTool(wrappedServer, runtime);
    registerCreateKeyTool(wrappedServer, runtime);
    registerGetKeyTool(wrappedServer, runtime);
    registerUpdateKeyTool(wrappedServer, runtime);
    registerDeleteKeyTool(wrappedServer, runtime);
    registerListKeysTool(wrappedServer, runtime);
    registerCreateTranslationTool(wrappedServer, runtime);
    registerGetTranslationTool(wrappedServer, runtime);
    registerUpdateTranslationTool(wrappedServer, runtime);
    registerListTranslationsTool(wrappedServer, runtime);
    registerListBranchesTool(wrappedServer, runtime);
    registerGetBranchTool(wrappedServer, runtime);
    registerCreateBranchTool(wrappedServer, runtime);
    registerUpdateBranchTool(wrappedServer, runtime);
    registerDeleteBranchTool(wrappedServer, runtime);
    registerMergeBranchTool(wrappedServer, runtime);
    registerCompareBranchTool(wrappedServer, runtime);
    registerGetBranchComparisonTool(wrappedServer, runtime);
    registerSyncBranchTool(wrappedServer, runtime);
    registerListJobsTool(wrappedServer, runtime);
    registerListAccountJobsTool(wrappedServer, runtime);
    registerListJobTemplatesTool(wrappedServer, runtime);
    registerGetJobTemplateTool(wrappedServer, runtime);
    registerCreateJobTemplateTool(wrappedServer, runtime);
    registerListJobTemplateLocalesTool(wrappedServer, runtime);
    registerGetJobTemplateLocaleTool(wrappedServer, runtime);
    registerCreateJobTemplateLocaleTool(wrappedServer, runtime);
    registerGetJobTool(wrappedServer, runtime);
    registerCreateJobTool(wrappedServer, runtime);
    registerUpdateJobTool(wrappedServer, runtime);
    registerStartJobTool(wrappedServer, runtime);
    registerCompleteJobTool(wrappedServer, runtime);
    registerReopenJobTool(wrappedServer, runtime);
    registerLockJobTool(wrappedServer, runtime);
    registerUnlockJobTool(wrappedServer, runtime);
    registerAddJobKeysTool(wrappedServer, runtime);
    registerRemoveJobKeysTool(wrappedServer, runtime);
    registerListJobLocalesTool(wrappedServer, runtime);
    registerAddJobLocaleTool(wrappedServer, runtime);
    registerGetJobLocaleTool(wrappedServer, runtime);
    registerUpdateJobLocaleTool(wrappedServer, runtime);
    registerRemoveJobLocaleTool(wrappedServer, runtime);
    registerCompleteJobLocaleTool(wrappedServer, runtime);
    registerReviewJobLocaleTool(wrappedServer, runtime);
    registerReopenJobLocaleTool(wrappedServer, runtime);
    registerListJobCommentsTool(wrappedServer, runtime);
    registerCreateJobCommentTool(wrappedServer, runtime);
    registerGetJobCommentTool(wrappedServer, runtime);
  },
};
