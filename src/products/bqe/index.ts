import type { ProductModule } from "#products/types";
import { BqeClient } from "#products/bqe/client";
import { registerCreateAiCheckTool } from "#products/bqe/tools/create-ai-check";
import { registerCreateQualityProfileTool } from "#products/bqe/tools/create-quality-profile";
import { registerDeleteAiCheckTool } from "#products/bqe/tools/delete-ai-check";
import { registerDeleteQualityProfileTool } from "#products/bqe/tools/delete-quality-profile";
import { registerEvaluateSegmentsTool } from "#products/bqe/tools/evaluate-segments";
import { registerEvaluateSegmentsV3Tool } from "#products/bqe/tools/evaluate-segments-v3";
import { registerGetAiCheckTool } from "#products/bqe/tools/get-ai-check";
import { registerGetAnalyticsTool } from "#products/bqe/tools/get-analytics";
import { registerGetQualityProfileTool } from "#products/bqe/tools/get-quality-profile";
import { registerGetQualityProfileV3Tool } from "#products/bqe/tools/get-quality-profile-v3";
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
    tokenEnvAliases: ["PHRASE_TOKEN"],
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
    registerEvaluateSegmentsV3Tool(server, runtime);
    registerGetQualityProfileV3Tool(server, runtime);
    registerGetAnalyticsTool(server, runtime);
  },
};
