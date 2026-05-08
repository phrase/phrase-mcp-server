import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { HttpError, type BinaryResponse } from "#lib/http";

const SUPPORTED_CONNECTOR = "google-drive";
const DEFAULT_LOCALE = "en";
const GOOGLE_DRIVE_UPLOAD_FILE_EXAMPLE =
  '{"pathType":"FILE","drive":{"driveType":"MY_DRIVE"},"parentChain":[{"id":"root","name":"My Drive"}],"name":"example.txt"}';
const GOOGLE_DRIVE_UPLOAD_FOLDER_EXAMPLE =
  '{"pathType":"FOLDER","folderId":"root","drive":{"driveType":"MY_DRIVE"},"parentChain":[]} with request.name "example.txt"';

export type GoogleDriveRequest = Record<string, unknown>;
type GoogleDrivePath = Record<string, unknown>;
export type GoogleDriveFailureCode =
  | "AUTH_EXPIRED"
  | "PATH_INVALID"
  | "UPLOAD_STREAM_EXPIRED"
  | "DOWNLOAD_STREAM_ABORTED"
  | "PERMISSION_DENIED";

export class GoogleDriveToolError extends Error {
  readonly code: GoogleDriveFailureCode;

  constructor(code: GoogleDriveFailureCode, message: string) {
    super(`${code}: ${message}`);
    this.code = code;
  }
}

function throwGoogleDriveToolError(code: GoogleDriveFailureCode, message: string): never {
  throw new GoogleDriveToolError(code, message);
}

function summarizeBodySnippet(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

function uploadPathExamples(): string {
  return `Example FILE path: ${GOOGLE_DRIVE_UPLOAD_FILE_EXAMPLE}. Example FOLDER path: ${GOOGLE_DRIVE_UPLOAD_FOLDER_EXAMPLE}.`;
}

export function isGoogleDriveToolErrorCode(error: unknown, code: GoogleDriveFailureCode): boolean {
  return error instanceof GoogleDriveToolError && error.code === code;
}

export function classifyGoogleDriveError(
  error: unknown,
  options: {
    operation: "auth_probe" | "list" | "download" | "upload_registration" | "upload_stream";
    connectorUuid?: string;
  },
): Error {
  if (error instanceof GoogleDriveToolError) {
    return error;
  }

  const connectorLabel = options.connectorUuid ? ` '${options.connectorUuid}'` : "";

  if (error instanceof HttpError) {
    const body = summarizeBodySnippet(error.body);
    const lowerBody = error.body.toLowerCase();

    if (lowerBody.includes("invalid_grant") || lowerBody.includes("invalid grant")) {
      return new GoogleDriveToolError(
        "AUTH_EXPIRED",
        `Google Drive connector${connectorLabel} authorization expired or was revoked. Reconnect it in Phrase, then retry.${body ? ` Upstream detail: ${body}` : ""}`,
      );
    }

    if (error.status === 401) {
      return new GoogleDriveToolError(
        "AUTH_EXPIRED",
        `Google Drive connector${connectorLabel} authorization is no longer valid. Reconnect it in Phrase, then retry.${body ? ` Upstream detail: ${body}` : ""}`,
      );
    }

    if (error.status === 403) {
      return new GoogleDriveToolError(
        "PERMISSION_DENIED",
        `Google Drive connector${connectorLabel} rejected this request due to missing access.${body ? ` Upstream detail: ${body}` : ""}`,
      );
    }

    if (
      error.status === 410 &&
      (options.operation === "upload_registration" || options.operation === "upload_stream")
    ) {
      return new GoogleDriveToolError(
        "UPLOAD_STREAM_EXPIRED",
        `The Google Drive upload stream expired before the file body was accepted. The server can retry with a fresh stream, but if this keeps happening check the destination path shape. ${uploadPathExamples()}${body ? ` Upstream detail: ${body}` : ""}`,
      );
    }

    if (error.status === 404) {
      return new GoogleDriveToolError(
        "PATH_INVALID",
        `The Google Drive path could not be resolved.${body ? ` Upstream detail: ${body}` : ""} ${uploadPathExamples()}`,
      );
    }

    if (options.operation === "download" && error.status >= 500) {
      return new GoogleDriveToolError(
        "DOWNLOAD_STREAM_ABORTED",
        `The Google Drive download stream failed before the file was fully read.${body ? ` Upstream detail: ${body}` : ""}`,
      );
    }
  }

  if (error instanceof Error) {
    const lowerMessage = error.message.toLowerCase();

    if (
      options.operation === "download" &&
      (lowerMessage.includes("aborted") ||
        lowerMessage.includes("socket hang up") ||
        lowerMessage.includes("terminated"))
    ) {
      return new GoogleDriveToolError(
        "DOWNLOAD_STREAM_ABORTED",
        "The Google Drive download stream aborted before the file was fully read. The wrapper will fall back to a different transport when possible.",
      );
    }

    if (
      options.operation === "upload_stream" &&
      (lowerMessage.includes("410") ||
        lowerMessage.includes("gone") ||
        lowerMessage.includes("expired"))
    ) {
      return new GoogleDriveToolError(
        "UPLOAD_STREAM_EXPIRED",
        `The Google Drive upload stream expired before the file body was accepted. ${uploadPathExamples()}`,
      );
    }
  }

  return error instanceof Error ? error : new Error(String(error));
}

function asObject(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(message);
  }

  return { ...(value as Record<string, unknown>) };
}

export function requireSupportedConnector(connector: string): void {
  if (connector !== SUPPORTED_CONNECTOR) {
    throw new Error(
      `Unsupported connector '${connector}'. Only '${SUPPORTED_CONNECTOR}' is supported in v1.`,
    );
  }
}

export function normalizeGoogleDriveRequest(
  request: unknown,
  options: {
    requirePath?: boolean;
    defaultRootPath?: boolean;
  } = {},
): GoogleDriveRequest {
  const normalized = asObject(request, "request must be an object.");

  if ("googleDrive2Credentials" in normalized && normalized.googleDrive2Credentials !== undefined) {
    throw new Error(
      "Inline googleDrive2Credentials are not supported in v1. Use request.connectorUuid.",
    );
  }

  if (
    typeof normalized.connectorUuid !== "string" ||
    normalized.connectorUuid.trim().length === 0
  ) {
    throw new Error("request.connectorUuid is required and must be a non-empty string.");
  }

  const configuration = normalized.configuration;
  if (!configuration || typeof configuration !== "object" || Array.isArray(configuration)) {
    throw new Error(
      "request.configuration is required and must be an object. Use {} when the Google Drive connector does not need extra configuration, including simple root listings.",
    );
  }

  if (options.defaultRootPath && normalized.path === undefined) {
    normalized.path = { pathType: "ROOT" };
  }

  if (options.requirePath) {
    const path = normalized.path;
    if (!path || typeof path !== "object" || Array.isArray(path)) {
      throw new Error("request.path is required and must be an object.");
    }
  }

  if (normalized.locale === undefined) {
    normalized.locale = DEFAULT_LOCALE;
  }

  return normalized;
}

export function ensureStreamUploadRequest(request: GoogleDriveRequest): GoogleDriveRequest {
  if ("storageId" in request && request.storageId !== undefined) {
    throw new Error(
      "File storage is not supported in v1. Remove request.storageId and upload directly from file_path.",
    );
  }

  return request;
}

export function normalizeGoogleDriveUploadPath(request: GoogleDriveRequest): GoogleDriveRequest {
  const path = request.path;
  if (!path || typeof path !== "object" || Array.isArray(path)) {
    throwGoogleDriveToolError(
      "PATH_INVALID",
      `request.path is required and must be an object. Google Drive uploads need a FILE target, or a FOLDER target that the MCP wrapper can rewrite into a FILE path using request.name. ${uploadPathExamples()}`,
    );
  }

  const originalPath = { ...(path as GoogleDrivePath) };
  if (originalPath.pathType === "FILE") {
    return request;
  }

  if (originalPath.pathType !== "FOLDER") {
    throwGoogleDriveToolError(
      "PATH_INVALID",
      `request.path.pathType '${String(originalPath.pathType)}' is not valid for uploads. Google Drive uploads require a FILE target, or a FOLDER target as a convenience so the wrapper can rewrite it into a FILE target with the upload filename. ${uploadPathExamples()}`,
    );
  }

  const drive = originalPath.drive;
  if (!drive || typeof drive !== "object" || Array.isArray(drive)) {
    throw new Error("request.path.drive is required and must be an object for uploads.");
  }

  const originalParentChain = Array.isArray(originalPath.parentChain)
    ? [...originalPath.parentChain]
    : [];
  const folderId =
    typeof originalPath.folderId === "string" && originalPath.folderId.trim().length > 0
      ? originalPath.folderId
      : null;
  const folderName =
    typeof originalPath.name === "string" && originalPath.name.trim().length > 0
      ? originalPath.name
      : null;
  const fileName =
    typeof request.name === "string" && request.name.trim().length > 0 ? request.name : undefined;

  if (!folderId) {
    throwGoogleDriveToolError(
      "PATH_INVALID",
      `FOLDER upload targets must include request.path.folderId so the wrapper can build a deterministic FILE path. ${uploadPathExamples()}`,
    );
  }

  const parentChain = [...originalParentChain];

  if (folderId) {
    const alreadyPresent = parentChain.some(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        "id" in entry &&
        (entry as Record<string, unknown>).id === folderId,
    );

    if (!alreadyPresent) {
      const parentRef: Record<string, unknown> = { id: folderId };
      if (folderName) {
        parentRef.name = folderName;
      } else if (
        folderId === "root" &&
        drive &&
        typeof drive === "object" &&
        !Array.isArray(drive) &&
        (drive as Record<string, unknown>).driveType === "MY_DRIVE"
      ) {
        parentRef.name = "My Drive";
      }
      parentChain.push(parentRef);
    }
  }

  request.path = {
    pathType: "FILE",
    drive,
    parentChain,
    ...(fileName ? { name: fileName } : {}),
  };

  return request;
}

export function tryDecodeFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null;
  }

  const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const encoded = match?.[1] ?? match?.[2];
  if (!encoded) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(encoded);
    const mimeEncodedWord = decoded.match(/^=\?([^?]+)\?([BQ])\?([^?]+)\?=$/i);
    if (!mimeEncodedWord) {
      return decoded;
    }

    const [, charset, encoding, payload] = mimeEncodedWord;
    if (!/^utf-8$/i.test(charset)) {
      return decoded;
    }

    if (encoding.toUpperCase() === "B") {
      return Buffer.from(payload, "base64").toString("utf8");
    }

    const qp = payload
      .replace(/_/g, " ")
      .replace(/=([0-9A-F]{2})/gi, (_match, hex: string) =>
        String.fromCharCode(Number.parseInt(hex, 16)),
      );
    return Buffer.from(qp, "binary").toString("utf8");
  } catch {
    return encoded;
  }
}

export async function formatBinaryResult(
  file: BinaryResponse,
  outputPath?: string,
): Promise<Record<string, unknown>> {
  let saved_to: string | null = null;
  if (outputPath) {
    const absoluteOutputPath = resolve(outputPath);
    await mkdir(dirname(absoluteOutputPath), { recursive: true });
    await writeFile(absoluteOutputPath, Buffer.from(file.bytesBase64, "base64"));
    saved_to = absoluteOutputPath;
  }

  return {
    content_type: file.contentType,
    content_disposition: file.contentDisposition,
    file_name: tryDecodeFilename(file.contentDisposition),
    size_bytes: file.sizeBytes,
    bytes_base64: file.bytesBase64,
    saved_to,
  };
}
