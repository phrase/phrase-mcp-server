import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";
import { paginationControlsSchema } from "#products/tms/tools/query";

export function registerListTermbasesTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_list_termbases",
    {
      description: "List termbases in Phrase TMS. (GET /api2/v1/termBases)",
      annotations: { title: "[TMS] List Termbases", readOnlyHint: true },
      inputSchema: {
        ...paginationControlsSchema,
      },
    },
    async ({ paginate, page_size, max_pages, max_items }) => {
      const client = runtime.client;
      if (!paginate) {
        const termbases = await client.get("/v1/termBases");
        return asTextContent(termbases);
      }

      const termbases = await client.paginateGet("/v1/termBases", {
        pageSize: page_size,
        maxPages: max_pages,
        maxItems: max_items,
      });
      return asTextContent(termbases);
    },
  );
}
