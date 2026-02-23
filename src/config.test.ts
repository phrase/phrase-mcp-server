import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadProductRuntimes } from "#config.js";
import { StringsClient } from "#products/strings/client.js";
import type { ProductClientFactoryOptions, ProductModule } from "#products/types.js";

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
      region: "eu",
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
          region: "eu",
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

  it("uses product region to select the default base URL", async () => {
    process.env.PHRASE_STRINGS_TOKEN = "token";
    process.env.PHRASE_STRINGS_REGION = "us";
    process.env.PHRASE_ENABLED_PRODUCTS = "strings";

    const client = {} as StringsClient;
    const createClient = vi.fn(
      async (_options: ProductClientFactoryOptions): Promise<StringsClient> => client,
    );

    const modules: ProductModule<"strings">[] = [
      {
        key: "strings",
        client: {
          defaultBaseUrlsByRegion: {
            eu: "https://eu.example.com",
            us: "https://us.example.com",
          },
          createClient,
        },
        register: vi.fn(),
      },
    ];

    const runtimes = await loadProductRuntimes(modules);

    expect(runtimes).toEqual([{ key: "strings", client }]);
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "strings",
        region: "us",
        baseUrl: "https://us.example.com",
      }),
    );
  });

  it("uses global PHRASE_REGION when product region is not set", async () => {
    process.env.PHRASE_STRINGS_TOKEN = "token";
    process.env.PHRASE_REGION = "us";
    process.env.PHRASE_ENABLED_PRODUCTS = "strings";

    const client = {} as StringsClient;
    const createClient = vi.fn(
      async (_options: ProductClientFactoryOptions): Promise<StringsClient> => client,
    );

    const modules: ProductModule<"strings">[] = [
      {
        key: "strings",
        client: {
          defaultBaseUrlsByRegion: {
            eu: "https://eu.example.com",
            us: "https://us.example.com",
          },
          createClient,
        },
        register: vi.fn(),
      },
    ];

    await loadProductRuntimes(modules);

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        region: "us",
        baseUrl: "https://us.example.com",
      }),
    );
  });

  it("prefers explicit BASE_URL over region defaults", async () => {
    process.env.PHRASE_STRINGS_TOKEN = "token";
    process.env.PHRASE_REGION = "us";
    process.env.PHRASE_STRINGS_BASE_URL = "https://override.example.com";
    process.env.PHRASE_ENABLED_PRODUCTS = "strings";

    const client = {} as StringsClient;
    const createClient = vi.fn(
      async (_options: ProductClientFactoryOptions): Promise<StringsClient> => client,
    );

    const modules: ProductModule<"strings">[] = [
      {
        key: "strings",
        client: {
          defaultBaseUrlsByRegion: {
            eu: "https://eu.example.com",
            us: "https://us.example.com",
          },
          createClient,
        },
        register: vi.fn(),
      },
    ];

    await loadProductRuntimes(modules);

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        region: "us",
        baseUrl: "https://override.example.com",
      }),
    );
  });

  it("uses configured default auth prefix when env override is not set", async () => {
    process.env.PHRASE_STRINGS_TOKEN = "platform-token";
    process.env.PHRASE_ENABLED_PRODUCTS = "strings";

    const client = {} as StringsClient;
    const createClient = vi.fn(
      async (_options: ProductClientFactoryOptions): Promise<StringsClient> => client,
    );

    const modules: ProductModule<"strings">[] = [
      {
        key: "strings",
        client: {
          defaultBaseUrl: "https://example.com",
          defaultAuthPrefix: "token",
          createClient,
        },
        register: vi.fn(),
      },
    ];

    const runtimes = await loadProductRuntimes(modules);

    expect(runtimes).toEqual([{ key: "strings", client }]);
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        authToken: "platform-token",
        authPrefix: "token",
      }),
    );
  });

  it("allows overriding auth prefix from env var", async () => {
    process.env.PHRASE_STRINGS_TOKEN = "platform-token";
    process.env.PHRASE_STRINGS_AUTH_PREFIX = "Bearer";
    process.env.PHRASE_ENABLED_PRODUCTS = "strings";

    const client = {} as StringsClient;
    const createClient = vi.fn(
      async (_options: ProductClientFactoryOptions): Promise<StringsClient> => client,
    );

    const modules: ProductModule<"strings">[] = [
      {
        key: "strings",
        client: {
          defaultBaseUrl: "https://example.com",
          defaultAuthPrefix: "token",
          createClient,
        },
        register: vi.fn(),
      },
    ];

    const runtimes = await loadProductRuntimes(modules);

    expect(runtimes).toEqual([{ key: "strings", client }]);
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        authToken: "platform-token",
        authPrefix: "Bearer",
      }),
    );
  });

  it("skips product when region is invalid", async () => {
    process.env.PHRASE_STRINGS_TOKEN = "token";
    process.env.PHRASE_STRINGS_REGION = "moon";
    process.env.PHRASE_ENABLED_PRODUCTS = "strings";

    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    const createClient = vi.fn(
      async (_options: ProductClientFactoryOptions): Promise<StringsClient> =>
        ({}) as StringsClient,
    );

    const modules: ProductModule<"strings">[] = [
      {
        key: "strings",
        client: {
          defaultBaseUrlsByRegion: {
            eu: "https://eu.example.com",
            us: "https://us.example.com",
          },
          createClient,
        },
        register: vi.fn(),
      },
    ];

    const runtimes = await loadProductRuntimes(modules);

    expect(runtimes).toEqual([]);
    expect(createClient).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining("Unsupported PHRASE_STRINGS_REGION 'moon'. Expected one of: eu, us"),
    );
  });
});
