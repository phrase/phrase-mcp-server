import type { ProductModule } from "#products/types";
import { TmsClient } from "#products/tms/client";
import { registerGetAsyncLimitsTool } from "#products/tms/tools/get-async-limits";
import { registerGetAsyncRequestTool } from "#products/tms/tools/get-async-request";
import { registerCreateJobFromFileTool } from "#products/tms/tools/create-job-from-file";
import { registerCreateProjectTool } from "#products/tms/tools/create-project";
import { registerDownloadTargetFileAsyncTool } from "#products/tms/tools/download-target-file-async";
import { registerDownloadTargetFileByAsyncRequestTool } from "#products/tms/tools/download-target-file-by-async-request";
import { registerCreateProjectFromTemplateShorthandTool } from "#products/tms/tools/create-project-from-template-shorthand";
import { registerCreateProjectFromTemplateTool } from "#products/tms/tools/create-project-from-template";
import { registerGetJobTool } from "#products/tms/tools/get-job";
import { registerGetProjectTool } from "#products/tms/tools/get-project";
import { registerGetProjectTemplateTool } from "#products/tms/tools/get-project-template";
import { registerListJobsTool } from "#products/tms/tools/list-jobs";
import { registerListPendingRequestsTool } from "#products/tms/tools/list-pending-requests";
import { registerListProjectsTool } from "#products/tms/tools/list-projects";
import { registerListProjectTemplatesTool } from "#products/tms/tools/list-project-templates";
import { registerSearchJobsTool } from "#products/tms/tools/search-jobs";
import { registerSetProjectStatusTool } from "#products/tms/tools/set-project-status";
import { registerUpdateProjectTool } from "#products/tms/tools/update-project";

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
    registerSearchJobsTool(server, runtime);
    registerCreateJobFromFileTool(server, runtime);
    registerDownloadTargetFileAsyncTool(server, runtime);
    registerDownloadTargetFileByAsyncRequestTool(server, runtime);
    registerListPendingRequestsTool(server, runtime);
    registerGetAsyncRequestTool(server, runtime);
    registerGetAsyncLimitsTool(server, runtime);
  },
};
