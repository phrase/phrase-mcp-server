export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryValue = QueryPrimitive | QueryPrimitive[];

export interface JsonRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  query?: Record<string, QueryValue>;
  json?: unknown;
  body?: BodyInit;
}

export interface BinaryRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  query?: Record<string, QueryValue>;
  body?: BodyInit;
}

export interface BinaryResponse {
  contentType: string | null;
  contentDisposition: string | null;
  bytesBase64: string;
  sizeBytes: number;
}

export class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: string;

  constructor(status: number, statusText: string, body: string) {
    const compactBody = body.replace(/\s+/g, " ").trim();
    const snippet = compactBody ? `: ${compactBody.slice(0, 500)}` : "";
    super(`HTTP ${status} ${statusText}${snippet}`);
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

function isPresent(value: QueryPrimitive): value is string | number | boolean {
  return value !== null && value !== undefined;
}
function appendQueryValue(
  searchParams: URLSearchParams,
  key: string,
  value: QueryValue,
): void {
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
  const url = new URL(
    normalizedPath,
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );

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

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new HttpError(response.status, response.statusText, raw);
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

  const response = await fetch(url, {
    method,
    headers,
    body: options.body,
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new HttpError(response.status, response.statusText, raw);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    contentType: response.headers.get("content-type"),
    contentDisposition: response.headers.get("content-disposition"),
    bytesBase64: buffer.toString("base64"),
    sizeBytes: buffer.byteLength,
  };
}
