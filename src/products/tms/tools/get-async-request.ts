import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

export function registerGetAsyncRequestTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_async_request",
    {
      description:
        "Get a Phrase TMS asynchronous request by ID (GET /api2/v1/async/{asyncRequestId}). Read-only operation.",
      inputSchema: {
        async_request_id: z
          .string()
          .min(1)
          .describe("Asynchronous request ID returned by TMS async operations."),
      },
    },
    async ({ async_request_id }) => {
      const request = await runtime.client.get(`/v1/async/${encodeURIComponent(async_request_id)}`);
      return asTextContent(request);
    },
  );
}
