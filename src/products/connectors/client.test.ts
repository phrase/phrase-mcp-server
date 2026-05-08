import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as httpModule from "#lib/http";
import { HttpError } from "#lib/http";
import { GLOBAL_USER_AGENT } from "#lib/runtime-info";
import { ConnectorsClient } from "#products/connectors/client";
import type { ProductClientFactoryOptions } from "#products/types";

const BASE_URL = "https://eu.phrase.com/connectors";
const DEFAULT_OPTIONS: ProductClientFactoryOptions<"connectors"> = {
  key: "connectors",
  region: "eu",
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

describe("ConnectorsClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let requestBinaryStreamedSpy: ReturnType<typeof vi.spyOn>;
  let requestBinarySpy: ReturnType<typeof vi.spyOn>;
  let requestWithNodeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    requestBinaryStreamedSpy = vi.spyOn(httpModule, "requestBinaryStreamed");
    requestBinarySpy = vi.spyOn(httpModule, "requestBinary");
    requestWithNodeSpy = vi.spyOn(httpModule, "requestWithNode");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("postBinary requests the raw file stream with Accept application/octet-stream", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/idm/oauth/token")) {
        return Promise.resolve(createTokenResponse());
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });
    requestBinaryStreamedSpy.mockResolvedValue({
      contentType: "application/octet-stream",
      contentDisposition: 'attachment; filename="demo.txt"',
      bytesBase64: Buffer.from("demo").toString("base64"),
      sizeBytes: 4,
    });

    const client = new ConnectorsClient(DEFAULT_OPTIONS);
    const result = await client.postBinary("/google-drive/v1/sync/download-raw-file", {
      connectorUuid: "connector-uuid",
      configuration: {},
      path: {
        pathType: "FILE",
        fileId: "file-1",
        drive: { driveType: "MY_DRIVE" },
        parentChain: [],
      },
    });

    expect(result.contentType).toBe("application/octet-stream");
    expect(requestBinaryStreamedSpy).toHaveBeenCalledWith(
      BASE_URL,
      "/google-drive/v1/sync/download-raw-file",
      expect.objectContaining({
        method: "POST",
        allowNonOkBinary: true,
        headers: expect.objectContaining({
          Accept: "application/octet-stream",
          Authorization: "Bearer exchange-token-123",
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(requestBinarySpy).not.toHaveBeenCalled();
  });

  it("postBinary falls back to fetch transport when the streamed download aborts", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/idm/oauth/token")) {
        return Promise.resolve(createTokenResponse());
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });
    requestBinaryStreamedSpy.mockRejectedValue(new Error("aborted"));
    requestBinarySpy.mockResolvedValue({
      contentType: "application/octet-stream",
      contentDisposition: 'attachment; filename="demo.txt"',
      bytesBase64: Buffer.from("demo").toString("base64"),
      sizeBytes: 4,
    });

    const client = new ConnectorsClient(DEFAULT_OPTIONS);
    const result = await client.postBinary("/google-drive/v1/sync/download-raw-file", {
      connectorUuid: "connector-uuid",
      configuration: {},
      path: {
        pathType: "FILE",
        fileId: "file-1",
        drive: { driveType: "MY_DRIVE" },
        parentChain: [],
      },
    });

    expect(result.sizeBytes).toBe(4);
    expect(requestBinarySpy).toHaveBeenCalledWith(
      BASE_URL,
      "/google-drive/v1/sync/download-raw-file",
      expect.objectContaining({
        method: "POST",
        allowNonOkBinary: true,
      }),
    );
  });

  it("postBinary does not fall back for non-abort HTTP failures", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/idm/oauth/token")) {
        return Promise.resolve(createTokenResponse());
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });
    requestBinaryStreamedSpy.mockRejectedValue(
      new HttpError(403, "Forbidden", "denied", new Headers()),
    );

    const client = new ConnectorsClient(DEFAULT_OPTIONS);
    await expect(
      client.postBinary("/google-drive/v1/sync/download-raw-file", {
        connectorUuid: "connector-uuid",
        configuration: {},
        path: {
          pathType: "FILE",
          fileId: "file-1",
          drive: { driveType: "MY_DRIVE" },
          parentChain: [],
        },
      }),
    ).rejects.toThrow("HTTP 403 Forbidden");

    expect(requestBinarySpy).not.toHaveBeenCalled();
  });

  it("postBinary does not fall back for upstream 5xx responses", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/idm/oauth/token")) {
        return Promise.resolve(createTokenResponse());
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });
    requestBinaryStreamedSpy.mockRejectedValue(
      new HttpError(500, "Internal Server Error", "upstream failed", new Headers()),
    );

    const client = new ConnectorsClient(DEFAULT_OPTIONS);
    await expect(
      client.postBinary("/google-drive/v1/sync/download-raw-file", {
        connectorUuid: "connector-uuid",
        configuration: {},
        path: {
          pathType: "FILE",
          fileId: "file-1",
          drive: { driveType: "MY_DRIVE" },
          parentChain: [],
        },
      }),
    ).rejects.toThrow("HTTP 500 Internal Server Error");

    expect(requestBinarySpy).not.toHaveBeenCalled();
  });

  it("get resolves connector listing against the connectors base URL", async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/idm/oauth/token")) {
        return Promise.resolve(createTokenResponse());
      }

      expect(url).toBe("https://eu.phrase.com/connectors/connectors/v1");
      expect(init).toMatchObject({
        method: "GET",
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: "Bearer exchange-token-123",
        }),
      });

      return Promise.resolve(
        new Response(JSON.stringify({ connectors: [] }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );
    });

    const client = new ConnectorsClient(DEFAULT_OPTIONS);
    await expect(client.get("/connectors/v1")).resolves.toEqual({ connectors: [] });
  });

  it("putStream resolves relative upload URLs against the connectors base URL", async () => {
    fetchMock.mockResolvedValue(createTokenResponse());
    requestWithNodeSpy.mockResolvedValue({
      status: 204,
      statusText: "No Content",
      headers: new Headers(),
      body: Buffer.alloc(0),
    });

    const client = new ConnectorsClient(DEFAULT_OPTIONS);
    await client.putStream(
      "http://127.0.0.1:1234/connectors/google-drive/v1/sync/upload-raw-file/stream/stream-1",
      "stream-token-1",
      Buffer.from("hello world"),
      {
        contentType: "application/octet-stream",
        contentLength: 11,
      },
    );

    expect(requestWithNodeSpy).toHaveBeenCalledWith(
      "http://127.0.0.1:1234/connectors/google-drive/v1/sync/upload-raw-file/stream/stream-1",
      {
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer exchange-token-123",
          "Content-Length": "11",
          "Content-Type": "application/octet-stream",
          "User-Agent": GLOBAL_USER_AGENT,
          "X-Stream-Token": "stream-token-1",
        }),
        body: Buffer.from("hello world"),
      },
    );
  });

  it("putStream prefixes /connectors when the stream URL is relative to the gateway root", async () => {
    fetchMock.mockResolvedValue(createTokenResponse());
    requestWithNodeSpy.mockResolvedValue({
      status: 204,
      statusText: "No Content",
      headers: new Headers(),
      body: Buffer.alloc(0),
    });

    const client = new ConnectorsClient({
      ...DEFAULT_OPTIONS,
      baseUrl: "http://127.0.0.1:1234/connectors",
    });

    await client.putStream(
      "/google-drive/v1/sync/upload-raw-file/stream/stream-1",
      "stream-token-1",
      Buffer.from("hello world"),
      {
        contentType: "application/octet-stream",
        contentLength: 11,
      },
    );

    expect(requestWithNodeSpy).toHaveBeenCalledWith(
      "http://127.0.0.1:1234/connectors/google-drive/v1/sync/upload-raw-file/stream/stream-1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer exchange-token-123",
        }),
      }),
    );
  });
});
