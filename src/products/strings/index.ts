import { ProductModule } from "../types.js";
import { StringsClient } from "./client.js";
import { registerAddJobLocaleTool } from "./tools/add_job_locale.js";
import { registerAddJobKeysTool } from "./tools/add_job_keys.js";
import { registerCompleteJobLocaleTool } from "./tools/complete_job_locale.js";
import { registerCompleteJobTool } from "./tools/complete_job.js";
import { registerCreateJobCommentTool } from "./tools/create_job_comment.js";
import { registerCreateJobTemplateLocaleTool } from "./tools/create_job_template_locale.js";
import { registerCreateJobTemplateTool } from "./tools/create_job_template.js";
import { registerCreateJobTool } from "./tools/create_job.js";
import { registerCreateProjectTool } from "./tools/create_project.js";
import { registerGetJobTemplateLocaleTool } from "./tools/get_job_template_locale.js";
import { registerGetJobTemplateTool } from "./tools/get_job_template.js";
import { registerGlossariesListTool } from "./tools/list_glossaries.js";
import { registerGlossaryCreateTool } from "./tools/create_glossary.js";
import { registerGlossaryShowTool } from "./tools/get_glossary.js";
import { registerGlossaryTermCreateTool } from "./tools/create_glossary_term.js";
import { registerGlossaryTermShowTool } from "./tools/get_glossary_term.js";
import { registerGlossaryTermsListTool } from "./tools/list_glossary_terms.js";
import { registerGlossaryTermTranslationCreateTool } from "./tools/create_glossary_term_translation.js";
import { registerGlossaryTermTranslationUpdateTool } from "./tools/update_glossary_term_translation.js";
import { registerGlossaryUpdateTool } from "./tools/update_glossary.js";
import { registerGetJobCommentTool } from "./tools/get_job_comment.js";
import { registerGetJobLocaleTool } from "./tools/get_job_locale.js";
import { registerGetJobTool } from "./tools/get_job.js";
import { registerGetProjectTool } from "./tools/get_project.js";
import { registerListAccountJobsTool } from "./tools/list_account_jobs.js";
import { registerListFormatsTool } from "./tools/list_formats.js";
import { registerListJobCommentsTool } from "./tools/list_job_comments.js";
import { registerListJobLocalesTool } from "./tools/list_job_locales.js";
import { registerListJobTemplateLocalesTool } from "./tools/list_job_template_locales.js";
import { registerListJobTemplatesTool } from "./tools/list_job_templates.js";
import { registerListKeysTool } from "./tools/list_keys.js";
import { registerListJobsTool } from "./tools/list_jobs.js";
import { registerListLocalesTool } from "./tools/list_locales.js";
import { registerListProjectsTool } from "./tools/list_projects.js";
import { registerListTranslationsTool } from "./tools/list_translations.js";
import { registerLockJobTool } from "./tools/lock_job.js";
import { registerRemoveJobLocaleTool } from "./tools/remove_job_locale.js";
import { registerRemoveJobKeysTool } from "./tools/remove_job_keys.js";
import { registerReopenJobLocaleTool } from "./tools/reopen_job_locale.js";
import { registerReopenJobTool } from "./tools/reopen_job.js";
import { registerReviewJobLocaleTool } from "./tools/review_job_locale.js";
import { registerStartJobTool } from "./tools/start_job.js";
import { registerUpdateJobCommentTool } from "./tools/update_job_comment.js";
import { registerUpdateJobLocaleTool } from "./tools/update_job_locale.js";
import { registerUnlockJobTool } from "./tools/unlock_job.js";
import { registerUpdateJobTool } from "./tools/update_job.js";

export const stringsModule: ProductModule = {
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
    registerUpdateJobCommentTool(server, runtime);
  },
};
