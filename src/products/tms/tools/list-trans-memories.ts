import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";
import { paginationControlsSchema } from "#products/tms/tools/query";

export function registerListTransMemoriesTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_list_trans_memories",
    {
      description: "List translation memories in Phrase TMS. (GET /api2/v1/transMemories)",
      annotations: { title: "[TMS] List Translation Memories", readOnlyHint: true },
      inputSchema: {
        ...paginationControlsSchema,
      },
    },
    async ({ paginate, page_size, max_pages, max_items }) => {
      const client = runtime.client;
      if (!paginate) {
        const transMemories = await client.get("/v1/transMemories");
        return asTextContent(transMemories);
      }

      const transMemories = await client.paginateGet("/v1/transMemories", {
        pageSize: page_size,
        maxPages: max_pages,
        maxItems: max_items,
      });
      return asTextContent(transMemories);
    },
  );
}
