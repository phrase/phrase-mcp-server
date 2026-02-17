import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadProductRuntimes } from "./config.js";
import type {
  AnyProductModule,
  ProductClientFactoryOptions,
  ProductClientMap,
} from "#products/types.js";

function clearPhraseEnv(): void {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("PHRASE_")) {
      delete process.env[key];
    }
  }
}

describe("loadProductRuntimes", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearPhraseEnv();
  });

  afterEach(() => {
    clearPhraseEnv();
    Object.assign(process.env, originalEnv);
    vi.restoreAllMocks();
  });

  it("creates a runtime when required product env vars are present", async () => {
    process.env.PHRASE_STRINGS_TOKEN = "token";
    process.env.PHRASE_STRINGS_BASE_URL = "https://example.com";
    process.env.PHRASE_ENABLED_PRODUCTS = "strings";

    const client = { id: "strings-client" } as unknown as ProductClientMap["strings"];
    const createClient = vi.fn(
      async (_options: ProductClientFactoryOptions): Promise<ProductClientMap["strings"]> =>
        client,
    );

    const modules: AnyProductModule[] = [
      {
        key: "strings",
        client: { createClient },
        register: vi.fn(),
      },
    ];

    const runtimes = await loadProductRuntimes(modules);

    expect(runtimes).toEqual([{ key: "strings", client }]);
    expect(createClient).toHaveBeenCalledOnce();
  });

  it("does not create runtimes for disabled products", async () => {
    process.env.PHRASE_STRINGS_TOKEN = "token";
    process.env.PHRASE_STRINGS_BASE_URL = "https://example.com";
    process.env.PHRASE_DISABLED_PRODUCTS = "strings";

    const createClient = vi.fn(
      async (): Promise<ProductClientMap["strings"]> =>
        ({ id: "strings-client" }) as unknown as ProductClientMap["strings"],
    );

    const modules: AnyProductModule[] = [
      {
        key: "strings",
        client: { createClient },
        register: vi.fn(),
      },
    ];

    const runtimes = await loadProductRuntimes(modules);

    expect(runtimes).toEqual([]);
    expect(createClient).not.toHaveBeenCalled();
  });
});
