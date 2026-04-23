import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetTransMemoryTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_trans_memory",
    {
      description:
        "Get details for a specific Phrase TMS translation memory. (GET /api2/v1/transMemories/{tmUid})",
      annotations: { title: "[TMS] Get Translation Memory", readOnlyHint: true },
      inputSchema: z.object({
        tm_uid: z.string().min(1).describe("The UID of the translation memory."),
      }),
    },
    async ({ tm_uid }) => {
      const tm = await runtime.client.get(`/v1/transMemories/${encodeURIComponent(tm_uid)}`);

      return asTextContent(tm);
    },
  );
}
