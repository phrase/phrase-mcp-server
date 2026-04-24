import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetTermbaseTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_get_termbase",
    {
      description: "Get details for a specific Phrase TMS termbase. (GET /api2/v1/termBases/{uid})",
      annotations: { title: "[TMS] Get Termbase", readOnlyHint: true },
      inputSchema: z.object({
        termbase_uid: z.string().min(1).describe("The UID of the termbase."),
      }),
    },
    async ({ termbase_uid }) => {
      const termbase = await runtime.client.get(
        `/v1/termBases/${encodeURIComponent(termbase_uid)}`,
      );
      return asTextContent(termbase);
    },
  );
}
