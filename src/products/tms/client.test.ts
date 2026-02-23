import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TmsClient } from "#products/tms/client.js";
import type { ProductClientFactoryOptions } from "#products/types.js";

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
    delete process.env.PHRASE_TMS_USER_AGENT;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function mockTokenThenApi(apiResponse: unknown) {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/idm/oauth/token")) {
        return Promise.resolve(createTokenResponse());
      }
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            typeof apiResponse === "string"
              ? apiResponse
              : JSON.stringify(apiResponse),
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
            bodyCopy.buffer.slice(
              bodyCopy.byteOffset,
              bodyCopy.byteOffset + bodyCopy.byteLength,
            ),
          ),
        headers: {
          get: (name: string) =>
            name === "content-type"
              ? contentType
              : name === "content-disposition"
                ? null
                : null,
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
      const apiCallUrl = fetchMock.mock.lastCall![0];
      expect(apiCallUrl).toContain(BASE_URL);
      expect(apiCallUrl).toContain("projects/1");
    });

    it("includes query parameters in the request", async () => {
      mockTokenThenApi({ data: [] });

      const client = new TmsClient(DEFAULT_OPTIONS);
      await client.get("/locales", { pageNumber: 1, pageSize: 10 });

      const apiCallUrl = fetchMock.mock.lastCall![0];
      expect(apiCallUrl).toMatch(/pageNumber=1/);
      expect(apiCallUrl).toMatch(/pageSize=10/);
    });

    it("sends Authorization header with Bearer token", async () => {
      mockTokenThenApi({});

      const client = new TmsClient(DEFAULT_OPTIONS);
      await client.get("/me");

      const apiCallOptions = fetchMock.mock.lastCall![1];
      expect(apiCallOptions?.headers?.Authorization).toBe(
        "Bearer exchange-token-123",
      );
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
      const apiCall = fetchMock.mock.lastCall!;
      expect(apiCall[1]?.method).toBe("POST");
      expect(apiCall[1]?.headers?.["Content-Type"]).toContain(
        "application/json",
      );
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
      expect(fetchMock.mock.lastCall![1]?.method).toBe("PUT");
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
  });
});
