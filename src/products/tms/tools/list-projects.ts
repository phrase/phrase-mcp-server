import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { TmsClient } from "../client.js";
import { paginationControlsSchema, querySchema } from "./query.js";

export function registerListProjectsTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "tms_list_projects",
    {
      description:
        "List Phrase TMS projects (GET /api2/v1/projects). Read-only operation. Supports raw TMS query filters and optional auto-pagination.",
      inputSchema: {
        query: querySchema,
        ...paginationControlsSchema,
      },
    },
    async ({ query, paginate, page_size, max_pages, max_items }) => {
      const client = runtime.client as TmsClient;
      if (!paginate) {
        const projects = await client.get("/v1/projects", query);
        return asTextContent(projects);
      }

      const projects = await client.paginateGet("/v1/projects", {
        query,
        pageSize: page_size,
        maxPages: max_pages,
        maxItems: max_items,
      });
      return asTextContent(projects);
    },
  );
}
