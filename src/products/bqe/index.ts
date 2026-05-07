import type { ProductModule } from "#products/types";
import { BqeClient } from "#products/bqe/client";
import { registerCreateAiCheckTool } from "#products/bqe/tools/create-ai-check";
import { registerCreateQualityProfileTool } from "#products/bqe/tools/create-quality-profile";
import { registerDeleteAiCheckTool } from "#products/bqe/tools/delete-ai-check";
import { registerDeleteQualityProfileTool } from "#products/bqe/tools/delete-quality-profile";
import { registerEvaluateSegmentsTool } from "#products/bqe/tools/evaluate-segments";
import { registerGetAiCheckTool } from "#products/bqe/tools/get-ai-check";
import { registerGetAnalyticsTool } from "#products/bqe/tools/get-analytics";
import { registerGetQualityProfileTool } from "#products/bqe/tools/get-quality-profile";
import { registerListAiChecksTool } from "#products/bqe/tools/list-ai-checks";
import { registerListQualityProfilesTool } from "#products/bqe/tools/list-quality-profiles";
import { registerUpdateAiCheckTool } from "#products/bqe/tools/update-ai-check";
import { registerUpdateQualityProfileTool } from "#products/bqe/tools/update-quality-profile";

export const bqeModule: ProductModule<"bqe"> = {
  key: "bqe",
  client: {
    defaultBaseUrl: "https://eu.phrase.com/quality-evaluator",
    defaultBaseUrlsByRegion: {
      eu: "https://eu.phrase.com/quality-evaluator",
      us: "https://us.phrase.com/quality-evaluator",
    },
    defaultAuthPrefix: "Bearer",
    createClient: (options) => new BqeClient(options),
  },
  register(server, runtime) {
    registerListAiChecksTool(server, runtime);
    registerGetAiCheckTool(server, runtime);
    registerCreateAiCheckTool(server, runtime);
    registerUpdateAiCheckTool(server, runtime);
    registerDeleteAiCheckTool(server, runtime);
    registerListQualityProfilesTool(server, runtime);
    registerGetQualityProfileTool(server, runtime);
    registerCreateQualityProfileTool(server, runtime);
    registerUpdateQualityProfileTool(server, runtime);
    registerDeleteQualityProfileTool(server, runtime);
    registerEvaluateSegmentsTool(server, runtime);
    registerGetAnalyticsTool(server, runtime);
  },
};
