import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";
import { paginationControlsSchema, querySchema } from "#products/tms/tools/query";
import { projectStatusSchema } from "#products/tms/tools/constants";

export function registerListProjectsTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_list_projects",
    {
      description:
        "List all Phrase TMS projects you have access to. Use this to discover project UIDs before fetching job lists or project details. Returns an array of project objects, each containing uid, name, status, sourceLang, and targetLangs. (GET /api2/v1/projects)",
      inputSchema: {
        query: querySchema.describe(
          `Supported filters: name (partial match), status (${projectStatusSchema.options.join(" | ")}).`,
        ),
        ...paginationControlsSchema,
      },
    },
    async ({ query, paginate, page_size, max_pages, max_items }) => {
      const client = runtime.client;
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
