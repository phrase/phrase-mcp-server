import { ProductModule } from "./types.js";
import { analyticsModule } from "./analytics/index.js";
import { orchestratorModule } from "./orchestrator/index.js";
import { stringsModule } from "./strings/index.js";
import { tmsModule } from "./tms/index.js";

export const productModules: ProductModule[] = [
  stringsModule,
  tmsModule,
  orchestratorModule,
  analyticsModule,
];
