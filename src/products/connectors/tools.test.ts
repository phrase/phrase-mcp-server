import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError, type BinaryResponse } from "#lib/http";
import { connectorsModule } from "#products/connectors";
import type { ProductRuntime } from "#products/types";

type RegisteredTool = {
  handler: (input: Record<string, unknown>) => Promise<{ content: Array<{ text: string }> }>;
};

type MockConnectorsClient = {
  get: ReturnType<typeof vi.fn>;
  postJson: ReturnType<typeof vi.fn>;
  postBinary: ReturnType<typeof vi.fn>;
  putStream: ReturnType<typeof vi.fn>;
};

const EXPECTED_TOOL_NAMES = [
  "connectors_list_connectors",
  "connectors_list_content",
  "connectors_download_raw",
  "connectors_upload_raw",
];

function createHttpError(status: number, statusText: string, body: string): HttpError {
  return new HttpError(status, statusText, body, new Headers());
}

function createRecordingServer(registrations: Map<string, RegisteredTool>): McpServer {
  return {
    registerTool: (...args: unknown[]) => {
      const [name, _options, handler] = args as [string, unknown, RegisteredTool["handler"]];
      registrations.set(name, { handler });
    },
  } as unknown as McpServer;
}

function createClientMock(): MockConnectorsClient {
  return {
    get: vi.fn().mockResolvedValue({
      connectors: [
        {
          type: "GOOGLE_DRIVE2",
          connectorUuid: "google-drive-uuid",
          name: "Drive",
        },
        {
          type: "TRIDION",
          connectorUuid: "tridion-uuid",
          name: "Tridion",
        },
      ],
    }),
    postJson: vi.fn().mockImplementation((path: string) => {
      if (path === "/google-drive/v1/sync/upload-raw-file") {
        return Promise.resolve({
          uploadUrl:
            "https://eu.phrase.com/connectors/google-drive/v1/sync/upload-raw-file/stream/stream-1",
          streamToken: "stream-token-1",
          expiresAt: "2026-01-16T12:00:00Z",
          maxBytes: 10857600,
        });
      }

      if (path === "/google-drive/v1/sync/list-files") {
        return Promise.resolve({ ok: true });
      }

      return Promise.resolve({ ok: true });
    }),
    postBinary: vi.fn().mockResolvedValue({
      contentType: "application/octet-stream",
      contentDisposition: 'attachment; filename="demo.txt"',
      bytesBase64: Buffer.from("hello world").toString("base64"),
      sizeBytes: 11,
    } satisfies BinaryResponse),
    putStream: vi.fn().mockResolvedValue(undefined),
  };
}

function registerTools(client: MockConnectorsClient): Map<string, RegisteredTool> {
  const registrations = new Map<string, RegisteredTool>();
  const runtime: ProductRuntime<"connectors"> = {
    key: "connectors",
    client: client as unknown as ProductRuntime<"connectors">["client"],
  };
  connectorsModule.register(createRecordingServer(registrations), runtime);
  return registrations;
}

async function invokeTool(
  registrations: Map<string, RegisteredTool>,
  toolName: string,
  input: Record<string, unknown>,
) {
  const registration = registrations.get(toolName);
  expect(registration).toBeDefined();
  const response = await registration?.handler(input);
  return JSON.parse(response?.content[0]?.text ?? "null");
}

describe("connectorsModule tools", () => {
  let client: MockConnectorsClient;
  let registrations: Map<string, RegisteredTool>;
  let tempDir = "";
  let uploadFilePath = "";
  let emptyUploadFilePath = "";

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "connectors-tools-test-"));
    uploadFilePath = join(tempDir, "upload-source.txt");
    emptyUploadFilePath = join(tempDir, "empty-upload.txt");
    await writeFile(uploadFilePath, "hello world", "utf8");
    await writeFile(emptyUploadFilePath, "");
  });

  afterAll(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    client = createClientMock();
    registrations = registerTools(client);
  });

  it("registers every expected connectors tool", () => {
    expect(new Set(registrations.keys())).toEqual(new Set(EXPECTED_TOOL_NAMES));
  });

  it("lists connectors and annotates local v1 support", async () => {
    const result = await invokeTool(registrations, "connectors_list_connectors", {});

    expect(client.get).toHaveBeenCalledWith("/connectors/v1");
    expect(result.connectors).toEqual([
      expect.objectContaining({
        type: "GOOGLE_DRIVE2",
        supported_in_mcp_v1: true,
        health: { status: "READY" },
      }),
      expect.objectContaining({ type: "TRIDION", supported_in_mcp_v1: false }),
    ]);
    expect(client.postJson).toHaveBeenCalledWith("/google-drive/v1/sync/list-files", {
      connectorUuid: "google-drive-uuid",
      configuration: {},
      path: {
        pathType: "FOLDER",
        folderId: "root",
        drive: { driveType: "MY_DRIVE" },
        parentChain: [],
      },
      locale: "en",
    });
  });

  it("marks connector auth as expired during discovery when My Drive probing fails", async () => {
    client.postJson.mockRejectedValueOnce(
      createHttpError(400, "Bad Request", '{"error":"invalid_grant"}'),
    );

    const result = await invokeTool(registrations, "connectors_list_connectors", {});

    expect(result.connectors[0]).toEqual(
      expect.objectContaining({
        connectorUuid: "google-drive-uuid",
        health: expect.objectContaining({
          status: "AUTH_EXPIRED",
          message: expect.stringContaining("AUTH_EXPIRED"),
        }),
      }),
    );
  });

  it("defaults Google Drive list requests to the root path", async () => {
    await invokeTool(registrations, "connectors_list_content", {
      connector: "google-drive",
      request: {
        connectorUuid: "google-drive-uuid",
        configuration: {},
      },
    });

    expect(client.postJson).toHaveBeenCalledWith("/google-drive/v1/sync/list-files", {
      connectorUuid: "google-drive-uuid",
      configuration: {},
      path: { pathType: "ROOT" },
      locale: "en",
    });
  });

  it("forwards an explicit Google Drive path unchanged", async () => {
    const request = {
      connectorUuid: "google-drive-uuid",
      configuration: {},
      path: {
        pathType: "FOLDER",
        folderId: "root",
        drive: { driveType: "MY_DRIVE" },
        parentChain: [],
      },
    };

    await invokeTool(registrations, "connectors_list_content", {
      connector: "google-drive",
      request,
    });

    expect(client.postJson).toHaveBeenCalledWith("/google-drive/v1/sync/list-files", {
      ...request,
      locale: "en",
    });
  });

  it("downloads raw content inline and optionally writes it to disk", async () => {
    const outputPath = join(tempDir, "downloads", "demo.txt");
    const result = await invokeTool(registrations, "connectors_download_raw", {
      connector: "google-drive",
      request: {
        connectorUuid: "google-drive-uuid",
        configuration: {},
        path: {
          pathType: "FILE",
          fileId: "file-1",
          drive: { driveType: "MY_DRIVE" },
          parentChain: [],
        },
      },
      output_path: outputPath,
    });

    expect(client.postBinary).toHaveBeenCalledWith(
      "/google-drive/v1/sync/download-raw-file",
      expect.objectContaining({
        connectorUuid: "google-drive-uuid",
        locale: "en",
      }),
      { "X-ResponseType": "OBJECT" },
    );
    expect(result.file_name).toBe("demo.txt");
    expect(result.saved_to).toBe(resolve(outputPath));
    await expect(readFile(outputPath, "utf8")).resolves.toBe("hello world");
  });

  it("decodes MIME-encoded filenames from content-disposition", async () => {
    client.postBinary.mockResolvedValueOnce({
      contentType: "application/octet-stream",
      contentDisposition: 'attachment; filename="=?UTF-8?Q?Jira_(7).csv?="',
      bytesBase64: Buffer.from("hello world").toString("base64"),
      sizeBytes: 11,
    } satisfies BinaryResponse);

    const result = await invokeTool(registrations, "connectors_download_raw", {
      connector: "google-drive",
      request: {
        connectorUuid: "google-drive-uuid",
        configuration: {},
        path: {
          pathType: "FILE",
          fileId: "file-1",
          drive: { driveType: "MY_DRIVE" },
          parentChain: [],
        },
      },
    });

    expect(result.file_name).toBe("Jira (7).csv");
  });

  it("uploads local files using Google Drive stream mode", async () => {
    const result = await invokeTool(registrations, "connectors_upload_raw", {
      connector: "google-drive",
      request: {
        connectorUuid: "google-drive-uuid",
        configuration: {},
        path: {
          pathType: "FOLDER",
          folderId: "root",
          drive: { driveType: "MY_DRIVE" },
          parentChain: [],
        },
      },
      file_path: uploadFilePath,
    });

    expect(client.postJson).toHaveBeenCalledWith(
      "/google-drive/v1/sync/upload-raw-file",
      expect.objectContaining({
        connectorUuid: "google-drive-uuid",
        name: "upload-source.txt",
        size: 11,
        locale: "en",
        path: {
          pathType: "FILE",
          drive: { driveType: "MY_DRIVE" },
          parentChain: [{ id: "root", name: "My Drive" }],
          name: "upload-source.txt",
        },
      }),
      { "X-Upload-Mode": "STREAM" },
    );
    expect(client.putStream).toHaveBeenCalledWith(
      "https://eu.phrase.com/connectors/google-drive/v1/sync/upload-raw-file/stream/stream-1",
      "stream-token-1",
      expect.any(Buffer),
      {
        contentType: "application/octet-stream",
        contentLength: 11,
      },
    );
    expect(result).toEqual({
      success: true,
      operation: "upload_raw",
      transport: "STREAM",
      upload_mode: "STREAM",
      mcp_execution: "single_tool_call",
      file_name: "upload-source.txt",
      size_bytes: 11,
      expires_at: "2026-01-16T12:00:00Z",
      max_bytes: 10857600,
    });
  });

  it("refreshes the upload stream once when the first stream URL expires", async () => {
    client.postJson
      .mockResolvedValueOnce({
        uploadUrl:
          "https://eu.phrase.com/connectors/google-drive/v1/sync/upload-raw-file/stream/stream-1",
        streamToken: "stream-token-1",
        expiresAt: "2026-01-16T12:00:00Z",
        maxBytes: 10857600,
      })
      .mockResolvedValueOnce({
        uploadUrl:
          "https://eu.phrase.com/connectors/google-drive/v1/sync/upload-raw-file/stream/stream-2",
        streamToken: "stream-token-2",
        expiresAt: "2026-01-16T12:01:00Z",
        maxBytes: 10857600,
      });
    client.putStream
      .mockRejectedValueOnce(createHttpError(410, "Gone", "stream expired"))
      .mockResolvedValueOnce(undefined);

    const result = await invokeTool(registrations, "connectors_upload_raw", {
      connector: "google-drive",
      request: {
        connectorUuid: "google-drive-uuid",
        configuration: {},
        path: {
          pathType: "FOLDER",
          folderId: "root",
          drive: { driveType: "MY_DRIVE" },
          parentChain: [],
        },
      },
      file_path: uploadFilePath,
    });

    expect(client.postJson).toHaveBeenCalledTimes(2);
    expect(client.putStream).toHaveBeenNthCalledWith(
      2,
      "https://eu.phrase.com/connectors/google-drive/v1/sync/upload-raw-file/stream/stream-2",
      "stream-token-2",
      expect.any(Buffer),
      {
        contentType: "application/octet-stream",
        contentLength: 11,
      },
    );
    expect(result.expires_at).toBe("2026-01-16T12:01:00Z");
  });

  it("overwrites a stale request.size with the actual file size", async () => {
    await invokeTool(registrations, "connectors_upload_raw", {
      connector: "google-drive",
      request: {
        connectorUuid: "google-drive-uuid",
        configuration: {},
        path: {
          pathType: "FOLDER",
          folderId: "root",
          drive: { driveType: "MY_DRIVE" },
          parentChain: [],
        },
        size: 999,
      },
      file_path: uploadFilePath,
    });

    expect(client.postJson).toHaveBeenCalledWith(
      "/google-drive/v1/sync/upload-raw-file",
      expect.objectContaining({
        size: 11,
      }),
      { "X-Upload-Mode": "STREAM" },
    );
  });

  it("allows zero-byte uploads", async () => {
    const result = await invokeTool(registrations, "connectors_upload_raw", {
      connector: "google-drive",
      request: {
        connectorUuid: "google-drive-uuid",
        configuration: {},
        path: {
          pathType: "FOLDER",
          folderId: "root",
          drive: { driveType: "MY_DRIVE" },
          parentChain: [],
        },
      },
      file_path: emptyUploadFilePath,
    });

    expect(client.postJson).toHaveBeenCalledWith(
      "/google-drive/v1/sync/upload-raw-file",
      expect.objectContaining({
        name: "empty-upload.txt",
        size: 0,
      }),
      { "X-Upload-Mode": "STREAM" },
    );
    expect(client.putStream).toHaveBeenCalledWith(
      "https://eu.phrase.com/connectors/google-drive/v1/sync/upload-raw-file/stream/stream-1",
      "stream-token-1",
      expect.any(Buffer),
      {
        contentType: "application/octet-stream",
        contentLength: 0,
      },
    );
    expect(result.size_bytes).toBe(0);
  });

  it("rejects unsupported connectors", async () => {
    await expect(
      invokeTool(registrations, "connectors_list_content", {
        connector: "tridion",
        request: {
          connectorUuid: "connector-uuid",
          configuration: {},
        },
      }),
    ).rejects.toThrow("Only 'google-drive' is supported in v1");
  });

  it("rejects inline credentials in v1", async () => {
    await expect(
      invokeTool(registrations, "connectors_list_content", {
        connector: "google-drive",
        request: {
          connectorUuid: "google-drive-uuid",
          googleDrive2Credentials: { accessToken: "token" },
          configuration: {},
        },
      }),
    ).rejects.toThrow("Inline googleDrive2Credentials are not supported in v1");
  });

  it("rejects file storage inputs in v1", async () => {
    await expect(
      invokeTool(registrations, "connectors_upload_raw", {
        connector: "google-drive",
        request: {
          connectorUuid: "google-drive-uuid",
          configuration: {},
          storageId: "stored-uid-1",
          path: {
            pathType: "FOLDER",
            folderId: "root",
            drive: { driveType: "MY_DRIVE" },
            parentChain: [],
          },
        },
        file_path: uploadFilePath,
      }),
    ).rejects.toThrow("File storage is not supported in v1");
  });

  it("explains that configuration should be {} when omitted", async () => {
    await expect(
      invokeTool(registrations, "connectors_list_content", {
        connector: "google-drive",
        request: {
          connectorUuid: "google-drive-uuid",
        },
      }),
    ).rejects.toThrow("Use {} when the Google Drive connector does not need extra configuration");
  });

  it("rejects upload path types that cannot resolve to a file target", async () => {
    await expect(
      invokeTool(registrations, "connectors_upload_raw", {
        connector: "google-drive",
        request: {
          connectorUuid: "google-drive-uuid",
          configuration: {},
          path: {
            pathType: "ROOT",
          },
        },
        file_path: uploadFilePath,
      }),
    ).rejects.toThrow("PATH_INVALID");
  });

  it("rejects folder uploads without folderId and includes path examples", async () => {
    await expect(
      invokeTool(registrations, "connectors_upload_raw", {
        connector: "google-drive",
        request: {
          connectorUuid: "google-drive-uuid",
          configuration: {},
          path: {
            pathType: "FOLDER",
            drive: { driveType: "MY_DRIVE" },
            parentChain: [],
          },
        },
        file_path: uploadFilePath,
      }),
    ).rejects.toThrow('Example FILE path: {"pathType":"FILE"');
  });

  it("classifies nested invalid_grant failures during listing", async () => {
    client.postJson.mockRejectedValueOnce(
      createHttpError(400, "Bad Request", '{"error":"invalid_grant"}'),
    );

    await expect(
      invokeTool(registrations, "connectors_list_content", {
        connector: "google-drive",
        request: {
          connectorUuid: "google-drive-uuid",
          configuration: {},
          path: {
            pathType: "FOLDER",
            folderId: "root",
            drive: { driveType: "MY_DRIVE" },
            parentChain: [],
          },
        },
      }),
    ).rejects.toThrow("AUTH_EXPIRED");
  });

  it("classifies aborted downloads with a stable error code", async () => {
    client.postBinary.mockRejectedValueOnce(new Error("aborted"));

    await expect(
      invokeTool(registrations, "connectors_download_raw", {
        connector: "google-drive",
        request: {
          connectorUuid: "google-drive-uuid",
          configuration: {},
          path: {
            pathType: "FILE",
            fileId: "file-1",
            drive: { driveType: "MY_DRIVE" },
            parentChain: [],
          },
        },
      }),
    ).rejects.toThrow("DOWNLOAD_STREAM_ABORTED");
  });
});
