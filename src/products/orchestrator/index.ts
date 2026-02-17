import type { ProductModule } from "#products/types.js";

export const orchestratorModule: ProductModule<"orchestrator"> = {
  key: "orchestrator",
  register(_server, _runtime) {},
};
