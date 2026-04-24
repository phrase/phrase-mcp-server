import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerSearchTransMemoryTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_search_trans_memory",
    {
      description:
        "Search for segments in a Phrase TMS translation memory. (POST /api2/v1/transMemories/{tmUid}/search)",
      annotations: { title: "[TMS] Search Translation Memory", readOnlyHint: true },
      inputSchema: z.object({
        tm_uid: z.string().min(1).describe("The UID of the translation memory."),
        query: z.string().min(1).describe("The term/segment to search for."),
        lang: z.string().optional().describe("Language code."),
      }),
    },
    async ({ tm_uid, query, lang }) => {
      const response = await runtime.client.postJson(
        `/v1/transMemories/${encodeURIComponent(tm_uid)}/search`,
        { query, lang },
      );
      return asTextContent(response);
    },
  );
}
