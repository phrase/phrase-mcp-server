import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StringsClient } from "#products/strings/client.js";
import type { TmsClient } from "#products/tms/client.js";

export const ALL_PRODUCTS = ["strings", "tms"] as const;
export const ALL_REGIONS = ["eu", "us"] as const;

export type ProductKey = (typeof ALL_PRODUCTS)[number];
export type Region = (typeof ALL_REGIONS)[number];

export function isRegion(value: string): value is Region {
  return ALL_REGIONS.some((region) => region === value);
}

export interface ProductClientMap {
  strings: StringsClient;
  tms: TmsClient;
}

export type ProductRuntime<K extends ProductKey = ProductKey> = {
  key: K;
  client: ProductClientMap[K];
};

export type ProductClientFactoryOptions<K extends ProductKey = ProductKey> = {
  key: K;
  region: Region;
  baseUrl: string;
  authHeader: string;
  authToken: string;
  authPrefix: string;
};

export interface ProductClientConfig<K extends ProductKey = ProductKey> {
  defaultBaseUrl?: string;
  defaultBaseUrlsByRegion?: Partial<Record<Region, string>>;
  defaultAuthPrefix?: string;
  baseUrlEnvAliases?: string[];
  tokenEnvAliases?: string[];
  createClient?: (
    options: ProductClientFactoryOptions,
  ) => ProductClientMap[K] | Promise<ProductClientMap[K]>;
}

export interface ProductModule<K extends ProductKey = ProductKey> {
  key: K;
  client?: ProductClientConfig<K>;
  register: (server: McpServer, runtime: ProductRuntime<K>) => void;
}

export type AnyProductModule = {
  [K in ProductKey]: ProductModule<K>;
}[ProductKey];

export type AnyProductRuntime = {
  [K in ProductKey]: ProductRuntime<K>;
}[ProductKey];
