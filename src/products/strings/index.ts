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

export const stringsModule: ProductModule<"strings"> = {
  key: "strings",
  client: {
    defaultBaseUrl: "https://api.phrase.com/v2",
    defaultAuthPrefix: "token",
    baseUrlEnvAliases: ["PHRASE_BASE_URL"],
    createClient: (options) => new StringsClient(options),
  },
  register(server, runtime) {
    registerListProjectsTool(server, runtime);
    registerGetProjectTool(server, runtime);
    registerCreateProjectTool(server, runtime);
    registerGlossariesListTool(server, runtime);
    registerGlossaryShowTool(server, runtime);
    registerGlossaryCreateTool(server, runtime);
    registerGlossaryUpdateTool(server, runtime);
    registerGlossaryTermCreateTool(server, runtime);
    registerGlossaryTermShowTool(server, runtime);
    registerGlossaryTermsListTool(server, runtime);
    registerGlossaryTermTranslationCreateTool(server, runtime);
    registerGlossaryTermTranslationUpdateTool(server, runtime);
    registerListFormatsTool(server, runtime);
    registerListLocalesTool(server, runtime);
    registerListKeysTool(server, runtime);
    registerListTranslationsTool(server, runtime);
    registerListJobsTool(server, runtime);
    registerListAccountJobsTool(server, runtime);
    registerListJobTemplatesTool(server, runtime);
    registerGetJobTemplateTool(server, runtime);
    registerCreateJobTemplateTool(server, runtime);
    registerListJobTemplateLocalesTool(server, runtime);
    registerGetJobTemplateLocaleTool(server, runtime);
    registerCreateJobTemplateLocaleTool(server, runtime);
    registerGetJobTool(server, runtime);
    registerCreateJobTool(server, runtime);
    registerUpdateJobTool(server, runtime);
    registerStartJobTool(server, runtime);
    registerCompleteJobTool(server, runtime);
    registerReopenJobTool(server, runtime);
    registerLockJobTool(server, runtime);
    registerUnlockJobTool(server, runtime);
    registerAddJobKeysTool(server, runtime);
    registerRemoveJobKeysTool(server, runtime);
    registerListJobLocalesTool(server, runtime);
    registerAddJobLocaleTool(server, runtime);
    registerGetJobLocaleTool(server, runtime);
    registerUpdateJobLocaleTool(server, runtime);
    registerRemoveJobLocaleTool(server, runtime);
    registerCompleteJobLocaleTool(server, runtime);
    registerReviewJobLocaleTool(server, runtime);
    registerReopenJobLocaleTool(server, runtime);
    registerListJobCommentsTool(server, runtime);
    registerCreateJobCommentTool(server, runtime);
    registerGetJobCommentTool(server, runtime);
  },
};
