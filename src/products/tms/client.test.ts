import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GLOBAL_USER_AGENT } from "#lib/runtime-info";
import { TmsClient } from "#products/tms/client";
import type { ProductClientFactoryOptions } from "#products/types";

const BASE_URL = "https://api.example.com";
const DEFAULT_OPTIONS: ProductClientFactoryOptions = {
  key: "tms" as const,
  region: "eu" as const,
  baseUrl: BASE_URL,
  authHeader: "Authorization",
  authToken: "phrase-api-token",
  authPrefix: "Bearer",
};

function createTokenResponse(): Pick<Response, "ok" | "json" | "text"> {
  const body = { access_token: "exchange-token-123", expires_in: 600 };
  return {
    ok: true,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

describe("TmsClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function getLastFetchCall() {
    const lastCall = fetchMock.mock.lastCall;
    expect(lastCall).toBeDefined();
    return lastCall ?? [];
  }

  function getLastFetchOptions() {
    const lastCall = getLastFetchCall();
    const options = lastCall[1];
    expect(options).toBeDefined();
    return options;
  }

  function mockTokenThenApi(apiResponse: unknown) {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/idm/oauth/token")) {
        return Promise.resolve(createTokenResponse());
      }
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            typeof apiResponse === "string" ? apiResponse : JSON.stringify(apiResponse),
          ),
      });
    });
  }

  function mockTokenThenApiBinary(contentType: string, body: Buffer) {
    const bodyCopy = new Uint8Array(body.length);
    bodyCopy.set(body);
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/idm/oauth/token")) {
        return Promise.resolve(createTokenResponse());
      }
      return Promise.resolve({
        ok: true,
        arrayBuffer: () =>
          Promise.resolve(
            bodyCopy.buffer.slice(bodyCopy.byteOffset, bodyCopy.byteOffset + bodyCopy.byteLength),
          ),
        headers: {
          get: (name: string) =>
            name === "content-type" ? contentType : name === "content-disposition" ? null : null,
        },
      });
    });
  }

  describe("constructor", () => {
    it("creates client with valid options without throwing", () => {
      fetchMock.mockResolvedValue(createTokenResponse());
      const client = new TmsClient(DEFAULT_OPTIONS);
      expect(client).toBeDefined();
    });
  });

  describe("get", () => {
    it("returns response body as object for GET /path", async () => {
      const payload = { id: 1, name: "Project A" };
      mockTokenThenApi(payload);

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.get("/projects/1");

      expect(result).toEqual(payload);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const apiCallUrl = getLastFetchCall()[0];
      expect(apiCallUrl).toContain(BASE_URL);
      expect(apiCallUrl).toContain("projects/1");
    });

    it("includes query parameters in the request", async () => {
      mockTokenThenApi({ data: [] });

      const client = new TmsClient(DEFAULT_OPTIONS);
      await client.get("/locales", { pageNumber: 1, pageSize: 10 });

      const apiCallUrl = getLastFetchCall()[0];
      expect(apiCallUrl).toMatch(/pageNumber=1/);
      expect(apiCallUrl).toMatch(/pageSize=10/);
    });

    it("sends Authorization header with Bearer token", async () => {
      mockTokenThenApi({});

      const client = new TmsClient(DEFAULT_OPTIONS);
      await client.get("/me");

      const apiCallOptions = getLastFetchOptions();
      expect(apiCallOptions?.headers?.Authorization).toBe("Bearer exchange-token-123");
    });

    it("uses global user agent for API requests", async () => {
      mockTokenThenApi({});

      const client = new TmsClient(DEFAULT_OPTIONS);
      await client.get("/me");

      const apiCallOptions = getLastFetchOptions();
      expect(apiCallOptions?.headers?.["User-Agent"]).toBe(GLOBAL_USER_AGENT);
    });
  });

  describe("postJson", () => {
    it("sends POST with JSON body and returns response", async () => {
      const sent = { name: "New project" };
      const response = { id: 42, name: "New project" };
      mockTokenThenApi(response);

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.postJson("/projects", sent);

      expect(result).toEqual(response);
      const apiCall = getLastFetchCall();
      expect(apiCall[1]?.method).toBe("POST");
      expect(apiCall[1]?.headers?.["Content-Type"]).toContain("application/json");
      expect(JSON.parse(apiCall[1]?.body as string)).toEqual(sent);
    });
  });

  describe("putJson", () => {
    it("sends PUT with JSON body and returns response", async () => {
      const payload = { name: "Updated" };
      mockTokenThenApi(payload);

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.putJson("/projects/1", payload);

      expect(result).toEqual(payload);
      expect(getLastFetchOptions()?.method).toBe("PUT");
    });
  });

  describe("binary write methods", () => {
    it("postBinary sends POST with raw body and headers", async () => {
      mockTokenThenApi({ ok: true });
      const client = new TmsClient(DEFAULT_OPTIONS);
      const body = Buffer.from("payload-a");

      const result = await client.postBinary(
        "/projects/1/jobs",
        body,
        {
          "Content-Type": "application/octet-stream",
          "X-Test": "alpha",
        },
        { page: 1 },
      );

      expect(result).toEqual({ ok: true });
      const apiCallUrl = String(fetchMock.mock.lastCall?.[0]);
      const apiCallOptions = fetchMock.mock.lastCall?.[1];
      expect(apiCallUrl).toContain("page=1");
      expect(apiCallOptions?.method).toBe("POST");
      expect(apiCallOptions?.body).toBe(body);
      expect(apiCallOptions?.headers?.["X-Test"]).toBe("alpha");
    });

    it("putBinary sends PUT with raw body and headers", async () => {
      mockTokenThenApi({ ok: true });
      const client = new TmsClient(DEFAULT_OPTIONS);
      const body = Buffer.from("payload-b");

      const result = await client.putBinary(
        "/projects/1/jobs/2",
        body,
        {
          "Content-Type": "application/octet-stream",
          "X-Test": "beta",
        },
        { attempt: 2 },
      );

      expect(result).toEqual({ ok: true });
      const apiCallUrl = String(fetchMock.mock.lastCall?.[0]);
      const apiCallOptions = fetchMock.mock.lastCall?.[1];
      expect(apiCallUrl).toContain("attempt=2");
      expect(apiCallOptions?.method).toBe("PUT");
      expect(apiCallOptions?.body).toBe(body);
      expect(apiCallOptions?.headers?.["X-Test"]).toBe("beta");
    });
  });

  describe("patchJson", () => {
    it("sends PATCH with JSON body and returns response", async () => {
      const payload = { name: "Patched" };
      mockTokenThenApi(payload);

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.patchJson("/projects/1", payload);

      expect(result).toEqual(payload);
      expect(fetchMock.mock.lastCall?.[1]?.method).toBe("PATCH");
    });
  });

  describe("getBinary", () => {
    it("returns BinaryResponse with contentType and bytesBase64", async () => {
      const bytes = Buffer.from("binary content");
      mockTokenThenApiBinary("application/octet-stream", bytes);

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.getBinary("/download/file");

      expect(result.contentType).toBe("application/octet-stream");
      expect(result.bytesBase64).toBe(bytes.toString("base64"));
      expect(result.sizeBytes).toBe(bytes.length);
    });
  });

  describe("paginateGet", () => {
    it("returns items, pages_fetched, items_returned, truncated for a single page", async () => {
      const page = {
        content: [{ id: 1 }, { id: 2 }],
        last: true,
        pageNumber: 0,
      };
      mockTokenThenApi(page);

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.paginateGet("/projects");

      expect(result.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.pages_fetched).toBe(1);
      expect(result.items_returned).toBe(2);
      expect(result.truncated).toBe(false);
    });

    it("merges multiple pages while hasNext returns true", async () => {
      const page1 = {
        content: [{ id: 1 }],
        last: false,
        pageNumber: 0,
        totalPages: 2,
      };
      const page2 = {
        content: [{ id: 2 }],
        last: true,
        pageNumber: 1,
        totalPages: 2,
      };
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify(page1)),
          }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify(page2)),
          }),
        );

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.paginateGet("/projects", {
        pageSize: 1,
        maxPages: 5,
      });

      expect(result.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.pages_fetched).toBe(2);
      expect(result.items_returned).toBe(2);
    });

    it("respects maxItems and sets truncated", async () => {
      const page = {
        content: Array.from({ length: 10 }, (_, i) => ({ a: i + 1 })),
        last: false,
        pageNumber: 0,
        totalPages: 10,
      };
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementation(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify(page)),
          }),
        );

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.paginateGet("/projects", {
        pageSize: 10,
        maxItems: 5,
        maxPages: 5,
      });

      expect(result.items_returned).toBe(5);
      expect(result.truncated).toBe(true);
    });

    it("uses custom extractItems and hasNext when provided", async () => {
      const raw = { items: [{ x: 1 }, { x: 2 }], done: true };
      mockTokenThenApi(raw);

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.paginateGet("/custom", {
        extractItems: (r) => (r as { items: unknown[] }).items,
        hasNext: (r) => !(r as { done: boolean }).done,
      });

      expect(result.items).toEqual([{ x: 1 }, { x: 2 }]);
      expect(result.pages_fetched).toBe(1);
    });

    it("retries with endpoint max page size when first request returns 400", async () => {
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            status: 400,
            statusText: "Bad Request",
            text: () => Promise.resolve("Maximum value is: 2"),
          }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(JSON.stringify({ content: [{ id: 1 }, { id: 2 }], last: true })),
          }),
        );

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.paginateGet("/projects");

      expect(result.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.pages_fetched).toBe(1);
      const firstApiCallUrl = String(fetchMock.mock.calls[1]?.[0]);
      const secondApiCallUrl = String(fetchMock.mock.calls[2]?.[0]);
      expect(firstApiCallUrl).toContain("pageSize=50");
      expect(secondApiCallUrl).toContain("pageSize=2");
    });

    it("rethrows non-400 request failures", async () => {
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            text: () => Promise.resolve("server error"),
          }),
        );

      const client = new TmsClient(DEFAULT_OPTIONS);
      await expect(client.paginateGet("/projects")).rejects.toThrow(
        "HTTP 500 Internal Server Error",
      );
    });

    it("rethrows 400 errors when max value cannot be parsed", async () => {
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            status: 400,
            statusText: "Bad Request",
            text: () => Promise.resolve("pageSize too large"),
          }),
        );

      const client = new TmsClient(DEFAULT_OPTIONS);
      await expect(client.paginateGet("/projects")).rejects.toThrow("HTTP 400 Bad Request");
    });

    it("supports array responses via default item extraction", async () => {
      mockTokenThenApi([{ id: 1 }, { id: 2 }]);

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.paginateGet("/projects");

      expect(result.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.pages_fetched).toBe(1);
      expect(result.truncated).toBe(false);
    });

    it("uses numeric page fields to continue when totalPages indicates next page", async () => {
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(JSON.stringify({ content: [{ id: 1 }], number: 0, totalPages: 2 })),
          }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(JSON.stringify({ content: [{ id: 2 }], number: 1, totalPages: 2 })),
          }),
        );

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.paginateGet("/projects", { pageSize: 1 });

      expect(result.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.pages_fetched).toBe(2);
      expect(result.truncated).toBe(false);
    });

    it("continues once when batch size equals pageSize and stops on following empty page", async () => {
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ content: [{ id: 1 }] })),
          }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ content: [] })),
          }),
        );

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.paginateGet("/projects", { pageSize: 1, maxPages: 3 });

      expect(result.items).toEqual([{ id: 1 }]);
      expect(result.pages_fetched).toBe(2);
      expect(result.truncated).toBe(false);
    });

    it("sets truncated when maxPages is reached before the stream ends", async () => {
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  content: [{ id: 1 }],
                  last: false,
                  totalPages: 10,
                }),
              ),
          }),
        );

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.paginateGet("/projects", {
        pageSize: 1,
        maxPages: 1,
      });

      expect(result.items).toEqual([{ id: 1 }]);
      expect(result.pages_fetched).toBe(1);
      expect(result.truncated).toBe(true);
    });
  });

  describe("rate limit handling", () => {
    it("retries on 429 errors in get()", async () => {
      const headers = new Headers();
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            status: 429,
            statusText: "Too Many Requests",
            text: () => Promise.resolve("rate limited"),
            headers,
          }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ id: 1 })),
          }),
        );

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.get("/projects/1");

      expect(result).toEqual({ id: 1 });
      expect(fetchMock).toHaveBeenCalledTimes(3); // 1 token + 1 failed + 1 success
    });

    it("retries on 503 errors in postJson()", async () => {
      const headers = new Headers();
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            status: 503,
            statusText: "Service Unavailable",
            text: () => Promise.resolve("concurrent limit"),
            headers,
          }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ id: 42 })),
          }),
        );

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.postJson("/projects", { name: "Test" });

      expect(result).toEqual({ id: 42 });
      expect(fetchMock).toHaveBeenCalledTimes(3); // 1 token + 1 failed + 1 success
    });

    it("respects Retry-After header on 429 errors", async () => {
      const headers = new Headers();
      headers.set("Retry-After", "1");

      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            status: 429,
            statusText: "Too Many Requests",
            text: () => Promise.resolve("rate limited"),
            headers,
          }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ ok: true })),
          }),
        );

      const client = new TmsClient(DEFAULT_OPTIONS);
      const start = Date.now();
      const result = await client.get("/projects");
      const elapsed = Date.now() - start;

      expect(result).toEqual({ ok: true });
      expect(elapsed).toBeGreaterThanOrEqual(1000);
    });

    it("retries on 429 errors in getBinary()", async () => {
      const bytes = Buffer.from("test");
      const headers = new Headers();
      const successHeaders = new Headers({ "content-type": "application/octet-stream" });

      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            status: 429,
            statusText: "Too Many Requests",
            text: () => Promise.resolve("rate limited"),
            headers,
          }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            arrayBuffer: async () =>
              bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
            headers: successHeaders,
          }),
        );

      const client = new TmsClient(DEFAULT_OPTIONS);
      const result = await client.getBinary("/download");

      expect(result.bytesBase64).toBe(bytes.toString("base64"));
      expect(fetchMock).toHaveBeenCalledTimes(3); // 1 token + 1 failed + 1 success
    });

    it("throws after max retries exhausted", { timeout: 10000 }, async () => {
      const headers = new Headers();
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementation(() =>
          Promise.resolve({
            ok: false,
            status: 429,
            statusText: "Too Many Requests",
            text: () => Promise.resolve("rate limited"),
            headers,
          }),
        );

      const client = new TmsClient(DEFAULT_OPTIONS);
      // Use maxRetries override in the low-level request to avoid long waits in tests
      // The TMS client is configured with maxRetries: 3 in the request method
      await expect(client.get("/projects")).rejects.toThrow("HTTP 429 Too Many Requests");
      expect(fetchMock).toHaveBeenCalledTimes(5); // 1 token + 1 initial + 3 retries
    });
  });
});
