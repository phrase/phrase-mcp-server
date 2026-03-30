import { request as httpRequest, type IncomingHttpHeaders } from "node:http";
import { request as httpsRequest } from "node:https";

export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryValue = QueryPrimitive | QueryPrimitive[];

const DEFAULT_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 32000;
const DEFAULT_MAX_RETRIES = 3;

export interface JsonRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  query?: Record<string, QueryValue>;
  json?: unknown;
  body?: BodyInit;
  maxRetries?: number;
}

export interface BinaryRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  query?: Record<string, QueryValue>;
  body?: BodyInit;
  maxRetries?: number;
  allowNonOkBinary?: boolean;
}

export interface BinaryResponse {
  contentType: string | null;
  contentDisposition: string | null;
  bytesBase64: string;
  sizeBytes: number;
}

export type NodeRequestResponse = {
  status: number;
  statusText: string;
  headers: Headers;
  body: Buffer;
};

function hasBinaryPayload(response: Response): boolean {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const contentDisposition = response.headers.get("content-disposition");

  return contentType.includes("application/octet-stream") || contentDisposition !== null;
}

function hasBinaryHeaders(headers: Headers): boolean {
  const contentType = headers.get("content-type")?.toLowerCase() ?? "";
  const contentDisposition = headers.get("content-disposition");

  return contentType.includes("application/octet-stream") || contentDisposition !== null;
}

function headersFromIncoming(headers: IncomingHttpHeaders): Headers {
  const normalized = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        normalized.append(key, item);
      }
      continue;
    }

    if (value !== undefined) {
      normalized.set(key, value);
    }
  }

  return normalized;
}

function normalizeRequestBody(body: BodyInit | undefined): string | Buffer | undefined {
  if (body === undefined) {
    return undefined;
  }

  if (typeof body === "string" || Buffer.isBuffer(body)) {
    return body;
  }

  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (body instanceof ArrayBuffer) {
    return Buffer.from(body);
  }

  if (ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  }

  throw new Error("Unsupported binary request body type for streamed HTTP request.");
}

export async function requestWithNode(
  url: string,
  options: {
    method: string;
    headers: Record<string, string>;
    body?: BodyInit;
  },
): Promise<NodeRequestResponse> {
  const parsedUrl = new URL(url);
  const requestImpl = parsedUrl.protocol === "https:" ? httpsRequest : httpRequest;
  const requestBody = normalizeRequestBody(options.body);
  const headers = { ...options.headers };

  if (
    requestBody !== undefined &&
    !Object.keys(headers).some((key) => key.toLowerCase() === "content-length")
  ) {
    headers["Content-Length"] = String(
      typeof requestBody === "string" ? Buffer.byteLength(requestBody) : requestBody.byteLength,
    );
  }

  return new Promise((resolve, reject) => {
    const req = requestImpl(
      parsedUrl,
      {
        method: options.method,
        headers,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 0,
            statusText: response.statusMessage ?? "",
            headers: headersFromIncoming(response.headers),
            body: Buffer.concat(chunks),
          });
        });
        response.on("error", reject);
      },
    );

    req.on("error", reject);

    if (requestBody !== undefined) {
      req.write(requestBody);
    }

    req.end();
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) {
    return null;
  }

  const trimmed = header.trim();

  // Try parsing as number of seconds
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.floor(seconds * 1000);
  }

  // Try parsing as HTTP date
  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    const delayMs = date.getTime() - Date.now();
    return delayMs > 0 ? Math.floor(delayMs) : 0;
  }

  return null;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 503;
}

function calculateRetryDelay(attempt: number, retryAfterHeader: string | null): number {
  const retryAfter = parseRetryAfter(retryAfterHeader);
  if (retryAfter !== null) {
    return Math.min(retryAfter, MAX_RETRY_DELAY_MS);
  }

  const exponentialDelay = 2 ** attempt * DEFAULT_RETRY_DELAY_MS;
  return Math.min(exponentialDelay, MAX_RETRY_DELAY_MS);
}

export class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: string;
  readonly headers: Headers;

  constructor(status: number, statusText: string, body: string, headers: Headers) {
    const compactBody = body.replace(/\s+/g, " ").trim();
    const snippet = compactBody ? `: ${compactBody.slice(0, 500)}` : "";
    super(`HTTP ${status} ${statusText}${snippet}`);
    this.status = status;
    this.statusText = statusText;
    this.body = body;
    this.headers = headers;
  }
}

function isPresent(value: QueryPrimitive): value is string | number | boolean {
  return value !== null && value !== undefined;
}
function appendQueryValue(searchParams: URLSearchParams, key: string, value: QueryValue): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (isPresent(item)) {
        searchParams.append(key, String(item));
      }
    }
    return;
  }

  if (isPresent(value)) {
    searchParams.append(key, String(value));
  }
}

export function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, QueryValue>,
): string {
  const normalizedPath = path.replace(/^\/+/, "");
  const url = new URL(normalizedPath, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      appendQueryValue(url.searchParams, key, value);
    }
  }

  return url.toString();
}

export async function requestJson(
  baseUrl: string,
  path: string,
  options: JsonRequestOptions = {},
): Promise<unknown> {
  const method = options.method ?? "GET";
  const url = buildUrl(baseUrl, path, options.query);
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  let body: BodyInit | undefined;
  if (options.json !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    body = JSON.stringify(options.json);
  } else if (options.body !== undefined) {
    body = options.body;
  }

  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  let lastError: HttpError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    const raw = await response.text();
    if (!response.ok) {
      const error = new HttpError(response.status, response.statusText, raw, response.headers);

      if (!isRetryableStatus(error.status) || attempt >= maxRetries) {
        throw error;
      }

      lastError = error;
      const retryAfter = error.headers.get("Retry-After");
      const delayMs = calculateRetryDelay(attempt, retryAfter);
      await sleep(delayMs);
      continue;
    }

    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw);
    } catch {
      return { raw };
    }
  }

  throw lastError ?? new Error("Unexpected: requestJson retry loop completed without error");
}

export async function requestBinary(
  baseUrl: string,
  path: string,
  options: BinaryRequestOptions = {},
): Promise<BinaryResponse> {
  const method = options.method ?? "GET";
  const url = buildUrl(baseUrl, path, options.query);
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  let lastError: HttpError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method,
      headers,
      body: options.body,
    });

    const binaryPayload = hasBinaryPayload(response);

    if (!response.ok && !(options.allowNonOkBinary && binaryPayload)) {
      const raw = await response.text();
      const error = new HttpError(response.status, response.statusText, raw, response.headers);

      if (!isRetryableStatus(error.status) || attempt >= maxRetries) {
        throw error;
      }

      lastError = error;
      const retryAfter = error.headers.get("Retry-After");
      const delayMs = calculateRetryDelay(attempt, retryAfter);
      await sleep(delayMs);
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      contentType: response.headers.get("content-type"),
      contentDisposition: response.headers.get("content-disposition"),
      bytesBase64: buffer.toString("base64"),
      sizeBytes: buffer.byteLength,
    };
  }

  throw lastError ?? new Error("Unexpected: requestBinary retry loop completed without error");
}

export async function requestBinaryStreamed(
  baseUrl: string,
  path: string,
  options: BinaryRequestOptions = {},
): Promise<BinaryResponse> {
  const method = options.method ?? "GET";
  const url = buildUrl(baseUrl, path, options.query);
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  let lastError: HttpError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await requestWithNode(url, {
      method,
      headers,
      body: options.body,
    });

    const binaryPayload = hasBinaryHeaders(response.headers);

    if (!String(response.status).startsWith("2") && !(options.allowNonOkBinary && binaryPayload)) {
      const raw = response.body.toString("utf8");
      const error = new HttpError(response.status, response.statusText, raw, response.headers);

      if (!isRetryableStatus(error.status) || attempt >= maxRetries) {
        throw error;
      }

      lastError = error;
      const retryAfter = error.headers.get("Retry-After");
      const delayMs = calculateRetryDelay(attempt, retryAfter);
      await sleep(delayMs);
      continue;
    }

    return {
      contentType: response.headers.get("content-type"),
      contentDisposition: response.headers.get("content-disposition"),
      bytesBase64: response.body.toString("base64"),
      sizeBytes: response.body.byteLength,
    };
  }

  throw (
    lastError ?? new Error("Unexpected: requestBinaryStreamed retry loop completed without error")
  );
}
