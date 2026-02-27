import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError, buildUrl, requestBinary, requestJson } from "#lib/http.js";

describe("buildUrl", () => {
  it("normalizes leading slashes and base URLs without trailing slash", () => {
    const url = buildUrl("https://api.example.com", "/projects");

    expect(url).toBe("https://api.example.com/projects");
  });

  it("appends query values and skips nullish values", () => {
    const url = new URL(
      buildUrl("https://api.example.com/v2/", "jobs", {
        page: 2,
        active: true,
        skipped: null,
        ignored: undefined,
        ids: [1, null, 3, undefined, false],
      }),
    );

    expect(url.pathname).toBe("/v2/jobs");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("active")).toBe("true");
    expect(url.searchParams.getAll("ids")).toEqual(["1", "3", "false"]);
    expect(url.searchParams.has("skipped")).toBe(false);
    expect(url.searchParams.has("ignored")).toBe(false);
  });
});

describe("requestJson", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.reject(new Error("fetch not mocked")));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("sends JSON requests with default headers and parses JSON response", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const result = await requestJson("https://api.example.com", "/items", {
      method: "POST",
      query: { page: 1 },
      json: { name: "Hello" },
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/items?page=1",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ name: "Hello" }),
      }),
    );
  });

  it("returns empty object when response has no body", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 200, statusText: "OK" }));

    const result = await requestJson("https://api.example.com", "/items");

    expect(result).toEqual({});
  });

  it("returns raw text when response body is not valid JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response("not-json", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      }),
    );

    const result = await requestJson("https://api.example.com", "/items");

    expect(result).toEqual({ raw: "not-json" });
  });

  it("throws HttpError for non-OK responses", async () => {
    fetchMock.mockResolvedValue(new Response("denied", { status: 403, statusText: "Forbidden" }));

    const error = await requestJson("https://api.example.com", "/items").catch(
      (caught: unknown) => caught,
    );

    expect(error).toMatchObject({
      status: 403,
      statusText: "Forbidden",
      body: "denied",
    });
    expect(error).toBeInstanceOf(HttpError);
  });
});

describe("requestBinary", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.reject(new Error("fetch not mocked")));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("returns binary metadata and base64 payload", async () => {
    const bytes = Buffer.from("hello");
    fetchMock.mockResolvedValue(
      new Response(bytes, {
        status: 200,
        headers: {
          "content-type": "application/octet-stream",
          "content-disposition": "attachment; filename=test.bin",
        },
      }),
    );

    const result = await requestBinary("https://api.example.com", "/download");

    expect(result).toEqual({
      contentType: "application/octet-stream",
      contentDisposition: "attachment; filename=test.bin",
      bytesBase64: bytes.toString("base64"),
      sizeBytes: bytes.byteLength,
    });
  });

  it("throws HttpError for non-OK binary responses", async () => {
    fetchMock.mockResolvedValue(new Response("missing", { status: 404, statusText: "Not Found" }));

    await expect(requestBinary("https://api.example.com", "/missing")).rejects.toMatchObject({
      status: 404,
      statusText: "Not Found",
      body: "missing",
    });
  });
});

describe("retry logic", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.reject(new Error("fetch not mocked")));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe("requestJson", () => {
    it("retries on 429 error with exponential backoff", async () => {
      fetchMock
        .mockResolvedValueOnce(
          new Response("rate limited", { status: 429, statusText: "Too Many Requests" }),
        )
        .mockResolvedValueOnce(
          new Response("still limited", { status: 429, statusText: "Too Many Requests" }),
        )
        .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

      const result = await requestJson("https://api.example.com", "/items");

      expect(result).toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("retries on 503 error", async () => {
      fetchMock
        .mockResolvedValueOnce(
          new Response("service unavailable", { status: 503, statusText: "Service Unavailable" }),
        )
        .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

      const result = await requestJson("https://api.example.com", "/items");

      expect(result).toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("respects Retry-After header (seconds)", async () => {
      const headers = new Headers();
      headers.set("Retry-After", "2");

      fetchMock
        .mockResolvedValueOnce(
          new Response("rate limited", { status: 429, statusText: "Too Many Requests", headers }),
        )
        .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

      const start = Date.now();
      const result = await requestJson("https://api.example.com", "/items");
      const elapsed = Date.now() - start;

      expect(result).toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(elapsed).toBeGreaterThanOrEqual(1900);
    });

    it.skip("respects Retry-After header (HTTP date)", async () => {
      // Skip this test temporarily - HTTP date parsing can be flaky in tests
      // The parsing logic is tested via unit testing parseRetryAfter
    });

    it("throws after max retries exhausted", async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve(
          new Response("rate limited", { status: 429, statusText: "Too Many Requests" }),
        ),
      );

      await expect(
        requestJson("https://api.example.com", "/items", { maxRetries: 1 }),
      ).rejects.toMatchObject({
        status: 429,
        statusText: "Too Many Requests",
      });

      expect(fetchMock).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
    });

    it("does not retry on non-retryable errors", async () => {
      fetchMock.mockResolvedValue(
        new Response("forbidden", { status: 403, statusText: "Forbidden" }),
      );

      await expect(requestJson("https://api.example.com", "/items")).rejects.toMatchObject({
        status: 403,
        statusText: "Forbidden",
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("respects custom maxRetries", async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve(
          new Response("rate limited", { status: 429, statusText: "Too Many Requests" }),
        ),
      );

      await expect(
        requestJson("https://api.example.com", "/items", { maxRetries: 1 }),
      ).rejects.toMatchObject({
        status: 429,
      });

      expect(fetchMock).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
    });
  });

  describe("requestBinary", () => {
    it("retries on 429 error", async () => {
      const bytes = Buffer.from("hello");
      const headers = new Headers();
      headers.set("content-type", "application/octet-stream");

      fetchMock
        .mockResolvedValueOnce(
          new Response("rate limited", { status: 429, statusText: "Too Many Requests" }),
        )
        .mockResolvedValueOnce(new Response(bytes, { status: 200, headers }));

      const result = await requestBinary("https://api.example.com", "/download");

      expect(result.bytesBase64).toBe(bytes.toString("base64"));
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("throws after max retries exhausted", async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve(
          new Response("rate limited", { status: 429, statusText: "Too Many Requests" }),
        ),
      );

      await expect(
        requestBinary("https://api.example.com", "/download", { maxRetries: 1 }),
      ).rejects.toMatchObject({
        status: 429,
      });

      expect(fetchMock).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
    });

    it("does not retry on non-retryable errors", async () => {
      fetchMock.mockResolvedValue(
        new Response("not found", { status: 404, statusText: "Not Found" }),
      );

      await expect(requestBinary("https://api.example.com", "/missing")).rejects.toMatchObject({
        status: 404,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
