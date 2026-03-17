import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetAsyncLimitsTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_async_limits",
    {
      description:
        "Get current Phrase TMS asynchronous request limits and usage status (GET /api2/v1/async/status). Returns information about concurrent async operation capacity. Use this to check available capacity before triggering expensive async operations like tms_download_target_file_async. Read-only operation.",
      inputSchema: {},
    },
    async () => {
      const limits = await runtime.client.get("/v1/async/status");
      return asTextContent(limits);
    },
  );
}
