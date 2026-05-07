import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GLOBAL_USER_AGENT } from "#lib/runtime-info";
import { BqeClient } from "#products/bqe/client";
import type { ProductClientFactoryOptions } from "#products/types";

const BASE_URL = "https://eu.phrase.com/quality-evaluator";
const DEFAULT_OPTIONS: ProductClientFactoryOptions = {
  key: "bqe" as const,
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

describe("BqeClient", () => {
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

  describe("constructor", () => {
    it("creates client with valid options without throwing", () => {
      fetchMock.mockResolvedValue(createTokenResponse());
      const client = new BqeClient(DEFAULT_OPTIONS);
      expect(client).toBeDefined();
    });
  });

  describe("get", () => {
    it("returns response body as object for GET /path", async () => {
      const payload = { uid: "abc123", name: "AI Check 1" };
      mockTokenThenApi(payload);

      const client = new BqeClient(DEFAULT_OPTIONS);
      const result = await client.get("/v1/aiChecks/abc123");

      expect(result).toEqual(payload);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const apiCallUrl = getLastFetchCall()[0];
      expect(apiCallUrl).toContain(BASE_URL);
      expect(apiCallUrl).toContain("/v1/aiChecks/abc123");
    });

    it("includes query parameters in the request", async () => {
      mockTokenThenApi({ items: [] });

      const client = new BqeClient(DEFAULT_OPTIONS);
      await client.get("/v1/aiChecks", { sort: "name", order: "desc" });

      const apiCallUrl = getLastFetchCall()[0];
      expect(apiCallUrl).toMatch(/sort=name/);
      expect(apiCallUrl).toMatch(/order=desc/);
    });

    it("sends Authorization header with Bearer token", async () => {
      mockTokenThenApi({});

      const client = new BqeClient(DEFAULT_OPTIONS);
      await client.get("/v1/aiChecks");

      const apiCallOptions = getLastFetchOptions();
      expect(apiCallOptions?.headers?.Authorization).toBe("Bearer exchange-token-123");
    });

    it("uses global user agent for API requests", async () => {
      mockTokenThenApi({});

      const client = new BqeClient(DEFAULT_OPTIONS);
      await client.get("/v1/aiChecks");

      const apiCallOptions = getLastFetchOptions();
      expect(apiCallOptions?.headers?.["User-Agent"]).toBe(GLOBAL_USER_AGENT);
    });

    it("uses the configured region for the IDM token exchange URL", async () => {
      mockTokenThenApi({});

      const client = new BqeClient({ ...DEFAULT_OPTIONS, region: "us" });
      await client.get("/v1/aiChecks");

      const tokenCallUrl = String(fetchMock.mock.calls[0]?.[0]);
      expect(tokenCallUrl).toContain("https://us.phrase.com/idm/oauth/token");
    });
  });

  describe("postJson", () => {
    it("sends POST with JSON body and returns response", async () => {
      const sent = { name: "New AI Check", qualityRequirements: "must be polite" };
      const response = { uid: "ai-1", ...sent };
      mockTokenThenApi(response);

      const client = new BqeClient(DEFAULT_OPTIONS);
      const result = await client.postJson("/v1/aiChecks", sent);

      expect(result).toEqual(response);
      const apiCall = getLastFetchCall();
      expect(apiCall[1]?.method).toBe("POST");
      expect(apiCall[1]?.headers?.["Content-Type"]).toContain("application/json");
      expect(JSON.parse(apiCall[1]?.body as string)).toEqual(sent);
    });
  });

  describe("putJson", () => {
    it("sends PUT with JSON body and returns response", async () => {
      const payload = { name: "Updated", qualityRequirements: "be formal" };
      mockTokenThenApi(payload);

      const client = new BqeClient(DEFAULT_OPTIONS);
      const result = await client.putJson("/v1/aiChecks/ai-1", payload);

      expect(result).toEqual(payload);
      expect(getLastFetchOptions()?.method).toBe("PUT");
    });
  });

  describe("del", () => {
    it("sends DELETE and returns empty object on 204", async () => {
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(""),
          }),
        );

      const client = new BqeClient(DEFAULT_OPTIONS);
      const result = await client.del("/v1/aiChecks/ai-1");

      expect(result).toEqual({});
      expect(getLastFetchOptions()?.method).toBe("DELETE");
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
            text: () => Promise.resolve(JSON.stringify({ uid: "ai-1" })),
          }),
        );

      const client = new BqeClient(DEFAULT_OPTIONS);
      const result = await client.get("/v1/aiChecks/ai-1");

      expect(result).toEqual({ uid: "ai-1" });
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
            text: () => Promise.resolve("temporarily unavailable"),
            headers,
          }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ uid: "ai-2" })),
          }),
        );

      const client = new BqeClient(DEFAULT_OPTIONS);
      const result = await client.postJson("/v1/aiChecks", { name: "x", qualityRequirements: "y" });

      expect(result).toEqual({ uid: "ai-2" });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("rethrows non-retryable HTTP errors", async () => {
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createTokenResponse()))
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
            text: () => Promise.resolve("missing"),
          }),
        );

      const client = new BqeClient(DEFAULT_OPTIONS);
      await expect(client.get("/v1/aiChecks/missing")).rejects.toThrow("HTTP 404 Not Found");
    });
  });
});
