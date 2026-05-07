import { type QueryValue, requestJson } from "#lib/http";
import { UnifiedAccessTokenProvider } from "#lib/auth";
import { GLOBAL_USER_AGENT } from "#lib/runtime-info";
import type { ProductClientFactoryOptions } from "#products/types";

export class BqeClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly authPrefix: string;
  private readonly userAgent: string;
  private readonly tokenProvider: UnifiedAccessTokenProvider;

  constructor(options: ProductClientFactoryOptions) {
    this.baseUrl = options.baseUrl;
    this.authHeader = options.authHeader;
    this.authPrefix = options.authPrefix;
    this.userAgent = GLOBAL_USER_AGENT;

    this.tokenProvider = new UnifiedAccessTokenProvider(
      options.authToken,
      options.region,
      options.idmBaseUrl,
    );
  }

  private async request(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    options: {
      query?: Record<string, QueryValue>;
      json?: unknown;
      headers?: Record<string, string>;
    } = {},
  ): Promise<unknown> {
    const token = await this.tokenProvider.getAccessToken();
    const authValue = this.authPrefix ? `${this.authPrefix} ${token}` : token;

    return requestJson(this.baseUrl, path, {
      method,
      query: options.query,
      json: options.json,
      headers: {
        [this.authHeader]: authValue,
        "User-Agent": this.userAgent,
        ...options.headers,
      },
      maxRetries: 3,
    });
  }

  async get(path: string, query?: Record<string, QueryValue>): Promise<unknown> {
    return this.request("GET", path, { query });
  }

  async postJson(
    path: string,
    json: unknown,
    query?: Record<string, QueryValue>,
  ): Promise<unknown> {
    return this.request("POST", path, { query, json });
  }

  async putJson(path: string, json: unknown, query?: Record<string, QueryValue>): Promise<unknown> {
    return this.request("PUT", path, { query, json });
  }

  async del(path: string, query?: Record<string, QueryValue>): Promise<unknown> {
    return this.request("DELETE", path, { query });
  }
}
