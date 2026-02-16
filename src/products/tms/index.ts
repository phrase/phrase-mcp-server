import { ProductModule } from "../types.js";
import { TmsClient } from "./client.js";
import { registerGetAsyncLimitsTool } from "./tools/get-async-limits.js";
import { registerGetAsyncRequestTool } from "./tools/get-async-request.js";
import { registerCreateJobFromFileTool } from "./tools/create-job-from-file.js";
import { registerCreateProjectTool } from "./tools/create-project.js";
import { registerDownloadTargetFileAsyncTool } from "./tools/download-target-file-async.js";
import { registerDownloadTargetFileByAsyncRequestTool } from "./tools/download-target-file-by-async-request.js";
import { registerCreateProjectFromTemplateShorthandTool } from "./tools/create-project-from-template-shorthand.js";
import { registerCreateProjectFromTemplateTool } from "./tools/create-project-from-template.js";
import { registerGetJobTool } from "./tools/get-job.js";
import { registerGetProjectTool } from "./tools/get-project.js";
import { registerGetProjectTemplateTool } from "./tools/get-project-template.js";
import { registerListJobsTool } from "./tools/list-jobs.js";
import { registerListPendingRequestsTool } from "./tools/list-pending-requests.js";
import { registerListProjectsTool } from "./tools/list-projects.js";
import { registerListProjectTemplatesTool } from "./tools/list-project-templates.js";
import { registerSearchJobsTool } from "./tools/search-jobs.js";
import { registerSetProjectStatusTool } from "./tools/set-project-status.js";
import { registerUpdateProjectTool } from "./tools/update-project.js";

export const tmsModule: ProductModule = {
  key: "tms",
  client: {
    defaultBaseUrl: "https://cloud.memsource.com/web/api2",
    tokenEnvAliases: ["PHRASE_API_TOKEN"],
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
