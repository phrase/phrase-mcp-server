import type { AnyProductModule } from "#products/types";
import { stringsModule } from "#products/strings/index";
import { tmsModule } from "#products/tms/index";

export const productModules: AnyProductModule[] = [stringsModule, tmsModule];
