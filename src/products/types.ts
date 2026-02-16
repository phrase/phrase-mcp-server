import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const ALL_PRODUCTS = ["strings", "tms", "orchestrator", "analytics"] as const;

export type ProductKey = (typeof ALL_PRODUCTS)[number];

export interface ProductClientFactoryOptions {
  key: ProductKey;
  baseUrl: string;
  authHeader: string;
  authToken: string;
  authPrefix: string;
}

export interface ProductClientConfig {
  defaultBaseUrl?: string;
  defaultAuthPrefix?: string;
  baseUrlEnvAliases?: string[];
  tokenEnvAliases?: string[];
  createClient?: (options: ProductClientFactoryOptions) => unknown | Promise<unknown>;
}

export interface ProductRuntime {
  key: ProductKey;
  client: unknown;
}

export interface ProductModule {
  key: ProductKey;
  client?: ProductClientConfig;
  register: (server: McpServer, runtime: ProductRuntime) => void;
}
