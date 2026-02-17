import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadProductRuntimes } from "./config.js";
import { StringsClient } from "#products/strings/client.js";
import type {
  ProductClientFactoryOptions,
  ProductModule,
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

    const client = new StringsClient({
      key: "strings",
      baseUrl: "https://example.com",
      authHeader: "Authorization",
      authToken: "token",
      authPrefix: "Bearer",
    });
    const createClient = vi.fn(
      async (_options: ProductClientFactoryOptions): Promise<StringsClient> => client,
    );

    const modules: ProductModule<"strings">[] = [
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
      async (): Promise<StringsClient> =>
        new StringsClient({
          key: "strings",
          baseUrl: "https://example.com",
          authHeader: "Authorization",
          authToken: "token",
          authPrefix: "Bearer",
        }),
    );

    const modules: ProductModule<"strings">[] = [
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
