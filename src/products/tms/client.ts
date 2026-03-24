import {
  type BinaryResponse,
  HttpError,
  type QueryValue,
  requestBinary,
  requestJson,
} from "#lib/http";
import { UnifiedAccessTokenProvider } from "#lib/auth";
import { GLOBAL_USER_AGENT } from "#lib/runtime-info";
import type { ProductClientFactoryOptions } from "#products/types";

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_MAX_PAGES = 25;
const DEFAULT_MAX_ITEMS = 3000;

interface PaginateContext {
  page: number;
  pageSize: number;
  lastBatchSize: number;
}

interface PaginateOptions {
  query?: Record<string, QueryValue>;
  pageParam?: string;
  sizeParam?: string;
  startPage?: number;
  pageSize?: number;
  maxPages?: number;
  maxItems?: number;
  extractItems?: (response: unknown) => unknown[];
  hasNext?: (response: unknown, context: PaginateContext) => boolean;
}

interface PaginatedResult {
  items: unknown[];
  pages_fetched: number;
  items_returned: number;
  truncated: boolean;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function parseMaxValueFromErrorBody(body: string): number | null {
  const match = body.match(/Maximum value is:\s*(\d+)/i);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function defaultExtractItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  const object = asObject(response);
  if (!object) {
    return [];
  }

  if (Array.isArray(object.content)) {
    return object.content;
  }

  if (Array.isArray(object.items)) {
    return object.items;
  }

  return [];
}

function defaultHasNext(response: unknown, context: PaginateContext): boolean {
  const object = asObject(response);
  if (!object) {
    return false;
  }

  const last = asBoolean(object.last);
  if (last !== null) {
    return !last;
  }

  const totalPages = asNumber(object.totalPages);
  if (totalPages !== null) {
    const pageFromResponse =
      asNumber(object.pageNumber) ??
      asNumber(object.number) ??
      asNumber(object.page) ??
      context.page;
    return pageFromResponse + 1 < totalPages;
  }

  if (context.lastBatchSize === 0) {
    return false;
  }

  return context.lastBatchSize >= context.pageSize;
}

export class TmsClient {
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

    this.tokenProvider = new UnifiedAccessTokenProvider(options.authToken, options.region, options.idmBaseUrl);
  }

  private async request(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    options: {
      query?: Record<string, QueryValue>;
      json?: unknown;
      body?: BodyInit;
      headers?: Record<string, string>;
    } = {},
  ): Promise<unknown> {
    const token = await this.tokenProvider.getAccessToken();
    const authValue = this.authPrefix ? `${this.authPrefix} ${token}` : token;

    return requestJson(this.baseUrl, path, {
      method,
      query: options.query,
      json: options.json,
      body: options.body,
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

  async patchJson(
    path: string,
    json: unknown,
    query?: Record<string, QueryValue>,
  ): Promise<unknown> {
    return this.request("PATCH", path, { query, json });
  }

  async postBinary(
    path: string,
    body: BodyInit,
    headers: Record<string, string>,
    query?: Record<string, QueryValue>,
  ): Promise<unknown> {
    return this.request("POST", path, { query, body, headers });
  }

  async putBinary(
    path: string,
    body: BodyInit,
    headers: Record<string, string>,
    query?: Record<string, QueryValue>,
  ): Promise<unknown> {
    return this.request("PUT", path, { query, body, headers });
  }

  async getBinary(path: string, query?: Record<string, QueryValue>): Promise<BinaryResponse> {
    const token = await this.tokenProvider.getAccessToken();
    const authValue = this.authPrefix ? `${this.authPrefix} ${token}` : token;

    return requestBinary(this.baseUrl, path, {
      method: "GET",
      query,
      headers: {
        [this.authHeader]: authValue,
        "User-Agent": this.userAgent,
      },
      maxRetries: 3,
    });
  }

  async paginateGet(path: string, options: PaginateOptions = {}): Promise<PaginatedResult> {
    const pageParam = options.pageParam ?? "pageNumber";
    const sizeParam = options.sizeParam ?? "pageSize";
    let pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
    const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
    const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
    const extractItems = options.extractItems ?? defaultExtractItems;
    const hasNext = options.hasNext ?? defaultHasNext;

    let page = options.startPage ?? 0;
    let pagesFetched = 0;
    let truncated = false;
    const items: unknown[] = [];

    while (pagesFetched < maxPages && items.length < maxItems) {
      let response: unknown;
      try {
        response = await this.get(path, {
          ...(options.query ?? {}),
          [pageParam]: page,
          [sizeParam]: pageSize,
        });
      } catch (error) {
        if (!(error instanceof HttpError) || error.status !== 400) {
          throw error;
        }

        const endpointMax = parseMaxValueFromErrorBody(error.body);
        if (!endpointMax || endpointMax >= pageSize) {
          throw error;
        }

        pageSize = endpointMax;
        response = await this.get(path, {
          ...(options.query ?? {}),
          [pageParam]: page,
          [sizeParam]: pageSize,
        });
      }

      const batch = extractItems(response);
      for (const item of batch) {
        if (items.length >= maxItems) {
          truncated = true;
          break;
        }
        items.push(item);
      }

      pagesFetched += 1;
      if (items.length >= maxItems) {
        truncated = true;
        break;
      }

      const next = hasNext(response, {
        page,
        pageSize,
        lastBatchSize: batch.length,
      });
      if (!next) {
        break;
      }

      page += 1;
      if (pagesFetched >= maxPages) {
        truncated = true;
      }
    }

    return {
      items,
      pages_fetched: pagesFetched,
      items_returned: items.length,
      truncated,
    };
  }
}
