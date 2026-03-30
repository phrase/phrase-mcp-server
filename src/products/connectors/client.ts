import { ConnectorsAccessTokenProvider } from "#lib/auth";
import {
  HttpError,
  type BinaryResponse,
  requestBinary,
  requestBinaryStreamed,
  requestJson,
  requestWithNode,
} from "#lib/http";
import { GLOBAL_USER_AGENT } from "#lib/runtime-info";
import type { ProductClientFactoryOptions } from "#products/types";

export interface UploadStreamRegistration {
  uploadUrl?: string;
  streamToken?: string;
  expiresAt?: string;
  maxBytes?: number;
}

function isAbortLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("aborted") ||
    message.includes("socket hang up") ||
    message.includes("terminated") ||
    message.includes("econnreset")
  );
}

function resolveUploadUrl(uploadUrl: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(uploadUrl)) {
    return uploadUrl;
  }

  const parsedBaseUrl = new URL(baseUrl);
  if (uploadUrl.startsWith("/connectors/")) {
    return new URL(uploadUrl, parsedBaseUrl.origin).toString();
  }

  if (uploadUrl.startsWith("/")) {
    return new URL(`/connectors${uploadUrl}`, parsedBaseUrl.origin).toString();
  }

  return new URL(uploadUrl, baseUrl).toString();
}

export class ConnectorsClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly authPrefix: string;
  private readonly userAgent: string;
  private readonly tokenProvider: ConnectorsAccessTokenProvider;

  constructor(options: ProductClientFactoryOptions<"connectors">) {
    this.baseUrl = options.baseUrl;
    this.authHeader = options.authHeader;
    this.authPrefix = options.authPrefix;
    this.userAgent = GLOBAL_USER_AGENT;
    this.tokenProvider = new ConnectorsAccessTokenProvider(options.authToken, options.baseUrl);
  }

  private async authHeaders(
    extraHeaders: Record<string, string> = {},
  ): Promise<Record<string, string>> {
    const token = await this.tokenProvider.getAccessToken();
    const authValue = this.authPrefix ? `${this.authPrefix} ${token}` : token;

    return {
      [this.authHeader]: authValue,
      "User-Agent": this.userAgent,
      ...extraHeaders,
    };
  }

  async get(path: string, headers: Record<string, string> = {}): Promise<unknown> {
    return requestJson(this.baseUrl, path, {
      method: "GET",
      headers: await this.authHeaders(headers),
      maxRetries: 3,
    });
  }

  async postJson(
    path: string,
    json: unknown,
    headers: Record<string, string> = {},
  ): Promise<unknown> {
    return requestJson(this.baseUrl, path, {
      method: "POST",
      json,
      headers: await this.authHeaders(headers),
      maxRetries: 3,
    });
  }

  async postBinary(
    path: string,
    json: unknown,
    headers: Record<string, string> = {},
  ): Promise<BinaryResponse> {
    const requestHeaders = await this.authHeaders({
      Accept: "application/octet-stream",
      "Content-Type": "application/json",
      ...headers,
    });
    const requestBody = JSON.stringify(json);

    try {
      return await requestBinaryStreamed(this.baseUrl, path, {
        method: "POST",
        body: requestBody,
        headers: requestHeaders,
        allowNonOkBinary: true,
        maxRetries: 3,
      });
    } catch (error) {
      if (!isAbortLikeError(error)) {
        throw error;
      }

      return requestBinary(this.baseUrl, path, {
        method: "POST",
        body: requestBody,
        headers: requestHeaders,
        allowNonOkBinary: true,
        maxRetries: 3,
      });
    }
  }

  async putStream(
    uploadUrl: string,
    streamToken: string,
    body: BodyInit,
    options: {
      contentType?: string;
      contentLength?: number;
    } = {},
  ): Promise<void> {
    const resolvedUploadUrl = resolveUploadUrl(uploadUrl, this.baseUrl);
    const headers = await this.authHeaders({
      "X-Stream-Token": streamToken,
    });

    if (options.contentType) {
      headers["Content-Type"] = options.contentType;
    }
    if (typeof options.contentLength === "number" && Number.isFinite(options.contentLength)) {
      headers["Content-Length"] = String(options.contentLength);
    }

    const response = await requestWithNode(resolvedUploadUrl, {
      method: "PUT",
      headers,
      body,
    });

    if (!String(response.status).startsWith("2")) {
      throw new HttpError(
        response.status,
        response.statusText,
        response.body.toString("utf8"),
        response.headers,
      );
    }
  }
}
