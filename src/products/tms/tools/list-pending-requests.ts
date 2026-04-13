import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";
import { paginationControlsSchema, querySchema } from "#products/tms/tools/query";

export function registerListPendingRequestsTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_list_pending_requests",
    {
      description:
        "List all currently in-progress (RUNNING) async requests across your TMS account. Use for monitoring bulk background operations. To check a specific request by ID, use tms_get_async_request instead. (GET /api2/v1/async)",
      annotations: { title: "[TMS] List Pending Async Requests", readOnlyHint: true },
      inputSchema: {
        query: querySchema,
        ...paginationControlsSchema,
      },
    },
    async ({ query, paginate, page_size, max_pages, max_items }) => {
      const client = runtime.client;
      if (!paginate) {
        const pending = await client.get("/v1/async", query);
        return asTextContent(pending);
      }

      const pending = await client.paginateGet("/v1/async", {
        query,
        pageSize: page_size,
        maxPages: max_pages,
        maxItems: max_items,
      });
      return asTextContent(pending);
    },
  );
}
