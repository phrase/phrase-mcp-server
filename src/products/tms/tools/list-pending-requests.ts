import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { TmsClient } from "../client.js";
import { paginationControlsSchema, querySchema } from "./query.js";

export function registerListPendingRequestsTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "tms_list_pending_requests",
    {
      description:
        "List pending Phrase TMS asynchronous requests (GET /api2/v1/async). Read-only operation with optional auto-pagination.",
      inputSchema: {
        query: querySchema,
        ...paginationControlsSchema,
      },
    },
    async ({ query, paginate, page_size, max_pages, max_items }) => {
      const client = runtime.client as TmsClient;
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
