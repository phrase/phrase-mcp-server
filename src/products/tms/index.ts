import type { ProductModule } from "#products/types.js";
import { TmsClient } from "#products/tms/client.js";
import { registerListTermbasesTool } from "#products/tms/tools/list-termbases.js";
import { registerListTransMemoriesTool } from "#products/tms/tools/list-trans-memories.js";
import { registerGetTransMemoryTool } from "#products/tms/tools/get-trans-memory.js";
import { registerSearchTransMemoryTool } from "#products/tms/tools/search-trans-memory.js";
import { registerImportTransMemoryTool } from "#products/tms/tools/import-trans-memory.js";
import { registerExportTransMemoryTool } from "#products/tms/tools/export-trans-memory.js";
import { registerSearchTermbaseTermsTool } from "#products/tms/tools/search-termbase-terms.js";
import { registerSearchJobTermbasesTool } from "#products/tms/tools/search-job-termbases.js";
import { registerUploadTermbaseTool } from "#products/tms/tools/upload-termbase.js";
import { registerGetTermbaseTool } from "#products/tms/tools/get-termbase.js";
import { registerGetAsyncLimitsTool } from "#products/tms/tools/get-async-limits.js";
import { registerGetAsyncRequestTool } from "#products/tms/tools/get-async-request.js";
import { registerCreateJobFromFileTool } from "#products/tms/tools/create-job-from-file.js";
import { registerCreateProjectTool } from "#products/tms/tools/create-project.js";
import { registerEvaluateQualityProfileTool } from "#products/tms/tools/evaluate-quality-profile.js";
import { registerDownloadTargetFileAsyncTool } from "#products/tms/tools/download-target-file-async.js";
import { registerDownloadTargetFileByAsyncRequestTool } from "#products/tms/tools/download-target-file-by-async-request.js";
import { registerCreateProjectFromTemplateShorthandTool } from "#products/tms/tools/create-project-from-template-shorthand.js";
import { registerCreateProjectFromTemplateTool } from "#products/tms/tools/create-project-from-template.js";
import { registerGetJobTool } from "#products/tms/tools/get-job.js";
import { registerGetProjectTool } from "#products/tms/tools/get-project.js";
import { registerGetProjectTemplateTool } from "#products/tms/tools/get-project-template.js";
import { registerListJobsTool } from "#products/tms/tools/list-jobs.js";
import { registerListPendingRequestsTool } from "#products/tms/tools/list-pending-requests.js";
import { registerListProjectsTool } from "#products/tms/tools/list-projects.js";
import { registerListProjectTemplatesTool } from "#products/tms/tools/list-project-templates.js";
import { registerSearchJobsTool } from "#products/tms/tools/search-jobs.js";
import { registerSetJobStatusTool } from "#products/tms/tools/set-job-status.js";
import { registerSetProjectStatusTool } from "#products/tms/tools/set-project-status.js";
import { registerUpdateJobTool } from "#products/tms/tools/update-job.js";
import { registerUpdateProjectTool } from "#products/tms/tools/update-project.js";
import { registerCreateQuoteTool } from "#products/tms/tools/create-quote.js";
import { registerGetQuoteTool } from "#products/tms/tools/get-quote.js";
import { registerDeleteQuoteTool } from "#products/tms/tools/delete-quote.js";
import { registerEmailQuotesTool } from "#products/tms/tools/email-quotes.js";
import { registerGetAnalysisTool } from "#products/tms/tools/get-analysis.js";
import { registerDeleteAnalysisTool } from "#products/tms/tools/delete-analysis.js";
import { registerDeleteAnalysesBatchTool } from "#products/tms/tools/delete-analyses-batch.js";
import { registerCreateAnalysesByLanguagesTool } from "#products/tms/tools/create-analyses-by-languages.js";
import { registerCreateAnalysesByProvidersTool } from "#products/tms/tools/create-analyses-by-providers.js";
import { registerRecalculateAnalysisTool } from "#products/tms/tools/recalculate-analysis.js";
import { registerGetAnalysisLanguagePartTool } from "#products/tms/tools/get-analysis-language-part.js";
import { registerListAnalysisLanguagePartJobsTool } from "#products/tms/tools/list-analysis-language-part-jobs.js";
import { registerDownloadAnalysisTool } from "#products/tms/tools/download-analysis.js";
import { registerGetJobAnalysisTool } from "#products/tms/tools/get-job-analysis.js";
import { registerSetAnalysisNetRateSchemeTool } from "#products/tms/tools/set-analysis-net-rate-scheme.js";

export const tmsModule: ProductModule<"tms"> = {
  key: "tms",
  client: {
    defaultBaseUrl: "https://cloud.memsource.com/web/api2",
    defaultBaseUrlsByRegion: {
      eu: "https://cloud.memsource.com/web/api2",
      us: "https://us.cloud.memsource.com/web/api2",
    },
    createClient: (options) => new TmsClient(options),
  },
  register(server, runtime) {
    registerListProjectsTool(server, runtime);
    registerGetProjectTool(server, runtime);
    registerCreateProjectTool(server, runtime);
    registerUpdateProjectTool(server, runtime);
    registerSetProjectStatusTool(server, runtime);
    registerListProjectTemplatesTool(server, runtime);
    registerGetProjectTemplateTool(server, runtime);
    registerCreateProjectFromTemplateTool(server, runtime);
    registerCreateProjectFromTemplateShorthandTool(server, runtime);
    registerListJobsTool(server, runtime);
    registerGetJobTool(server, runtime);
    registerUpdateJobTool(server, runtime);
    registerSetJobStatusTool(server, runtime);
    registerSearchJobsTool(server, runtime);
    registerCreateJobFromFileTool(server, runtime);
    registerDownloadTargetFileAsyncTool(server, runtime);
    registerDownloadTargetFileByAsyncRequestTool(server, runtime);
    registerListPendingRequestsTool(server, runtime);
    registerGetAsyncRequestTool(server, runtime);
    registerListTermbasesTool(server, runtime);
    registerListTransMemoriesTool(server, runtime);
    registerGetTransMemoryTool(server, runtime);
    registerSearchTransMemoryTool(server, runtime);
    registerImportTransMemoryTool(server, runtime);
    registerExportTransMemoryTool(server, runtime);
    registerGetTermbaseTool(server, runtime);
    registerSearchTermbaseTermsTool(server, runtime);
    registerSearchJobTermbasesTool(server, runtime);
    registerUploadTermbaseTool(server, runtime);
    registerGetAsyncLimitsTool(server, runtime);
    registerEvaluateQualityProfileTool(server, runtime);
    registerCreateQuoteTool(server, runtime);
    registerGetQuoteTool(server, runtime);
    registerDeleteQuoteTool(server, runtime);
    registerEmailQuotesTool(server, runtime);
    registerGetAnalysisTool(server, runtime);
    registerDeleteAnalysisTool(server, runtime);
    registerDeleteAnalysesBatchTool(server, runtime);
    registerCreateAnalysesByLanguagesTool(server, runtime);
    registerCreateAnalysesByProvidersTool(server, runtime);
    registerRecalculateAnalysisTool(server, runtime);
    registerGetAnalysisLanguagePartTool(server, runtime);
    registerListAnalysisLanguagePartJobsTool(server, runtime);
    registerDownloadAnalysisTool(server, runtime);
    registerGetJobAnalysisTool(server, runtime);
    registerSetAnalysisNetRateSchemeTool(server, runtime);
  },
};
