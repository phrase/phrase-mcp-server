import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import {
  classifyGoogleDriveError,
  ensureStreamUploadRequest,
  isGoogleDriveToolErrorCode,
  normalizeGoogleDriveRequest,
  normalizeGoogleDriveUploadPath,
  requireSupportedConnector,
} from "#products/connectors/tools/common";
import type { ProductRuntime } from "#products/types";

function parseUploadStreamRegistration(value: unknown): {
  uploadUrl: string;
  streamToken: string;
  expiresAt: string | null;
  maxBytes: number | null;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Google Drive stream upload registration returned an unexpected response.");
  }

  const registration = value as Record<string, unknown>;
  const uploadUrl = registration.uploadUrl;
  const streamToken = registration.streamToken;
  const expiresAt = registration.expiresAt;
  const maxBytes = registration.maxBytes;

  if (typeof uploadUrl !== "string" || uploadUrl.trim().length === 0) {
    throw new Error("Google Drive stream upload registration did not include uploadUrl.");
  }
  if (typeof streamToken !== "string" || streamToken.trim().length === 0) {
    throw new Error("Google Drive stream upload registration did not include streamToken.");
  }

  return {
    uploadUrl,
    streamToken,
    expiresAt: typeof expiresAt === "string" ? expiresAt : null,
    maxBytes: typeof maxBytes === "number" && Number.isFinite(maxBytes) ? maxBytes : null,
  };
}

async function uploadWithFreshStream(
  runtime: ProductRuntime<"connectors">,
  request: Record<string, unknown>,
  fileBytes: Buffer,
  size: number,
): Promise<ReturnType<typeof parseUploadStreamRegistration>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const registrationResponse = await runtime.client.postJson(
        "/google-drive/v1/sync/upload-raw-file",
        request,
        { "X-Upload-Mode": "STREAM" },
      );
      const registration = parseUploadStreamRegistration(registrationResponse);

      try {
        await runtime.client.putStream(
          registration.uploadUrl,
          registration.streamToken,
          fileBytes,
          {
            contentType: "application/octet-stream",
            contentLength: size,
          },
        );
        return registration;
      } catch (error) {
        throw classifyGoogleDriveError(error, {
          operation: "upload_stream",
          connectorUuid:
            typeof request.connectorUuid === "string" ? request.connectorUuid : undefined,
        });
      }
    } catch (error) {
      const classified = classifyGoogleDriveError(error, {
        operation: "upload_registration",
        connectorUuid:
          typeof request.connectorUuid === "string" ? request.connectorUuid : undefined,
      });

      if (attempt === 0 && isGoogleDriveToolErrorCode(classified, "UPLOAD_STREAM_EXPIRED")) {
        lastError = classified;
        continue;
      }

      throw classified;
    }
  }

  throw lastError ?? new Error("Google Drive upload failed unexpectedly.");
}

export function registerUploadRawTool(server: McpServer, runtime: ProductRuntime<"connectors">) {
  server.registerTool(
    "connectors_upload_raw",
    {
      description:
        "Upload a local file to Google Drive through the Connectors API. Pass request.connectorUuid, request.configuration (usually {}), and request.path. Native Google Drive uploads want a FILE target path that includes the destination filename; as a convenience, this MCP wrapper also accepts a FOLDER path and rewrites it to a FILE target using request.name or the basename of file_path.",
      annotations: { destructiveHint: true },
      inputSchema: {
        connector: z.string().min(1),
        request: z
          .object({})
          .passthrough()
          .describe(
            "Google Drive upload-raw-file request body. request.connectorUuid and request.configuration are required. request.path should be a FILE target with the destination filename, or a FOLDER target that the wrapper can rewrite into a FILE target using request.name or file_path.",
          ),
        file_path: z
          .string()
          .min(1)
          .describe(
            "Local source file to upload. The wrapper reads this file, derives request.name from its basename when omitted, then performs the upstream stream registration and upload internally.",
          ),
      },
    },
    async ({ connector, request, file_path }) => {
      requireSupportedConnector(connector);
      const normalizedRequest = ensureStreamUploadRequest(
        normalizeGoogleDriveRequest(request, {
          requirePath: true,
        }),
      );

      const fileBytes = await readFile(file_path);
      const fileName = basename(file_path) || "upload";
      const size = fileBytes.byteLength;

      if (normalizedRequest.name === undefined) {
        normalizedRequest.name = fileName;
      }
      normalizedRequest.size = size;
      if (
        typeof normalizedRequest.name !== "string" ||
        normalizedRequest.name.trim().length === 0
      ) {
        throw new Error("request.name must be a non-empty string for stream uploads.");
      }
      if (typeof normalizedRequest.size !== "number" || normalizedRequest.size < 0) {
        throw new Error("request.size must be a non-negative number for stream uploads.");
      }

      normalizeGoogleDriveUploadPath(normalizedRequest);
      const registration = await uploadWithFreshStream(runtime, normalizedRequest, fileBytes, size);

      return asTextContent({
        success: true,
        operation: "upload_raw",
        transport: "STREAM",
        upload_mode: "STREAM",
        mcp_execution: "single_tool_call",
        file_name: normalizedRequest.name,
        size_bytes: size,
        expires_at: registration.expiresAt,
        max_bytes: registration.maxBytes,
      });
    },
  );
}
