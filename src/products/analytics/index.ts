import type { ProductModule } from "#products/types.js";

export const analyticsModule: ProductModule<"analytics"> = {
  key: "analytics",
  register(server, runtime) {},
};
