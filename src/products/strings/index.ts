import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProductModule } from "#products/types.js";
import { StringsClient } from "#products/strings/client.js";
import { registerAddJobLocaleTool } from "#products/strings/tools/add_job_locale.js";
import { registerAddJobKeysTool } from "#products/strings/tools/add_job_keys.js";
import { registerCompleteJobLocaleTool } from "#products/strings/tools/complete_job_locale.js";
import { registerCompleteJobTool } from "#products/strings/tools/complete_job.js";
import { registerCreateJobCommentTool } from "#products/strings/tools/create_job_comment.js";
import { registerCreateJobTemplateLocaleTool } from "#products/strings/tools/create_job_template_locale.js";
import { registerCreateJobTemplateTool } from "#products/strings/tools/create_job_template.js";
import { registerCreateJobTool } from "#products/strings/tools/create_job.js";
import { registerCreateLocaleTool } from "#products/strings/tools/create_locale.js";
import { registerCreateProjectTool } from "#products/strings/tools/create_project.js";
import { registerGetJobTemplateLocaleTool } from "#products/strings/tools/get_job_template_locale.js";
import { registerGetJobTemplateTool } from "#products/strings/tools/get_job_template.js";
import { registerGlossariesListTool } from "#products/strings/tools/list_glossaries.js";
import { registerGlossaryCreateTool } from "#products/strings/tools/create_glossary.js";
import { registerGlossaryShowTool } from "#products/strings/tools/get_glossary.js";
import { registerGlossaryTermCreateTool } from "#products/strings/tools/create_glossary_term.js";
import { registerGlossaryTermShowTool } from "#products/strings/tools/get_glossary_term.js";
import { registerGlossaryTermsListTool } from "#products/strings/tools/list_glossary_terms.js";
import { registerGlossaryTermTranslationCreateTool } from "#products/strings/tools/create_glossary_term_translation.js";
import { registerGlossaryTermTranslationUpdateTool } from "#products/strings/tools/update_glossary_term_translation.js";
import { registerGlossaryUpdateTool } from "#products/strings/tools/update_glossary.js";
import { registerGetJobCommentTool } from "#products/strings/tools/get_job_comment.js";
import { registerGetJobLocaleTool } from "#products/strings/tools/get_job_locale.js";
import { registerGetJobTool } from "#products/strings/tools/get_job.js";
import { registerGetProjectTool } from "#products/strings/tools/get_project.js";
import { registerListAccountJobsTool } from "#products/strings/tools/list_account_jobs.js";
import { registerListFormatsTool } from "#products/strings/tools/list_formats.js";
import { registerListJobCommentsTool } from "#products/strings/tools/list_job_comments.js";
import { registerListJobLocalesTool } from "#products/strings/tools/list_job_locales.js";
import { registerListJobTemplateLocalesTool } from "#products/strings/tools/list_job_template_locales.js";
import { registerListJobTemplatesTool } from "#products/strings/tools/list_job_templates.js";
import { registerListKeysTool } from "#products/strings/tools/list_keys.js";
import { registerListJobsTool } from "#products/strings/tools/list_jobs.js";
import { registerListLocalesTool } from "#products/strings/tools/list_locales.js";
import { registerCreateLocaleDownloadTool } from "#products/strings/tools/create_locale_download.js";
import { registerGetLocaleDownloadTool } from "#products/strings/tools/get_locale_download.js";
import { registerCreateUploadTool } from "#products/strings/tools/create_upload.js";
import { registerGetUploadTool } from "#products/strings/tools/get_upload.js";
import { registerListUploadsTool } from "#products/strings/tools/list_uploads.js";
import { registerListProjectsTool } from "#products/strings/tools/list_projects.js";
import { registerListTranslationsTool } from "#products/strings/tools/list_translations.js";
import { registerLockJobTool } from "#products/strings/tools/lock_job.js";
import { registerRemoveJobLocaleTool } from "#products/strings/tools/remove_job_locale.js";
import { registerRemoveJobKeysTool } from "#products/strings/tools/remove_job_keys.js";
import { registerReopenJobLocaleTool } from "#products/strings/tools/reopen_job_locale.js";
import { registerReopenJobTool } from "#products/strings/tools/reopen_job.js";
import { registerReviewJobLocaleTool } from "#products/strings/tools/review_job_locale.js";
import { registerStartJobTool } from "#products/strings/tools/start_job.js";
import { registerUpdateJobLocaleTool } from "#products/strings/tools/update_job_locale.js";
import { registerUnlockJobTool } from "#products/strings/tools/unlock_job.js";
import { registerUpdateJobTool } from "#products/strings/tools/update_job.js";
import { toStringsApiError } from "#products/strings/tools/error.js";

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
    registerGlossariesListTool(wrappedServer, runtime);
    registerGlossaryShowTool(wrappedServer, runtime);
    registerGlossaryCreateTool(wrappedServer, runtime);
    registerGlossaryUpdateTool(wrappedServer, runtime);
    registerGlossaryTermCreateTool(wrappedServer, runtime);
    registerGlossaryTermShowTool(wrappedServer, runtime);
    registerGlossaryTermsListTool(wrappedServer, runtime);
    registerGlossaryTermTranslationCreateTool(wrappedServer, runtime);
    registerGlossaryTermTranslationUpdateTool(wrappedServer, runtime);
    registerListFormatsTool(wrappedServer, runtime);
    registerCreateLocaleTool(wrappedServer, runtime);
    registerListLocalesTool(wrappedServer, runtime);
    registerCreateLocaleDownloadTool(wrappedServer, runtime);
    registerGetLocaleDownloadTool(wrappedServer, runtime);
    registerCreateUploadTool(wrappedServer, runtime);
    registerGetUploadTool(wrappedServer, runtime);
    registerListUploadsTool(wrappedServer, runtime);
    registerListKeysTool(wrappedServer, runtime);
    registerListTranslationsTool(wrappedServer, runtime);
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
