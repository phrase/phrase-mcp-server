import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetAsyncRequestTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_async_request",
    {
      description:
        'Poll the status of an async operation. Call this after tms_download_target_file_async until the returned status = "COMPLETED". Then proceed to tms_download_target_file_by_async_request. Expected status values: RUNNING, COMPLETED, FAILED. (GET /api2/v1/async/{asyncRequestId})',
      inputSchema: {
        async_request_id: z
          .string()
          .min(1)
          .describe(
            "The id field from the asyncRequest object returned by tms_download_target_file_async or another TMS async operation.",
          ),
      },
    },
    async ({ async_request_id }) => {
      const request = await runtime.client.get(`/v1/async/${encodeURIComponent(async_request_id)}`);
      return asTextContent(request);
    },
  );
}
