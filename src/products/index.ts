import type { AnyProductModule } from "#products/types.js";
import { analyticsModule } from "#products/analytics/index.js";
import { orchestratorModule } from "#products/orchestrator/index.js";
import { stringsModule } from "#products/strings/index.js";
import { tmsModule } from "#products/tms/index.js";

export const productModules: AnyProductModule[] = [
  stringsModule,
  tmsModule,
  orchestratorModule,
  analyticsModule,
];
