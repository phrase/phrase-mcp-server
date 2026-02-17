import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { TmsClient } from "../client.js";
import { paginationControlsSchema, querySchema } from "./query.js";

export function registerListProjectTemplatesTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "tms_list_project_templates",
    {
      description:
        "List Phrase TMS project templates (GET /api2/v1/projectTemplates). Read-only operation with optional auto-pagination.",
      inputSchema: {
        query: querySchema,
        ...paginationControlsSchema,
      },
    },
    async ({ query, paginate, page_size, max_pages, max_items }) => {
      const client = runtime.client as TmsClient;
      if (!paginate) {
        const templates = await client.get("/v1/projectTemplates", query);
        return asTextContent(templates);
      }

      const templates = await client.paginateGet("/v1/projectTemplates", {
        query,
        pageSize: page_size,
        maxPages: max_pages,
        maxItems: max_items,
      });
      return asTextContent(templates);
    },
  );
}
