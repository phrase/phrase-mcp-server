import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetAsyncLimitsTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_async_limits",
    {
      description:
        "Check the async request quota: how many concurrent async operations are allowed and how many are currently in use. Call this before triggering a large number of async exports to avoid hitting rate limits. (GET /api2/v1/async/status)",
      annotations: { title: "[TMS] Get Async Limits", readOnlyHint: true },
      inputSchema: {},
    },
    async () => {
      const limits = await runtime.client.get("/v1/async/status");
      return asTextContent(limits);
    },
  );
}
