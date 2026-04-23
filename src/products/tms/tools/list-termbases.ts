import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListTermbasesTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_list_termbases",
    {
      description: "List termbases in Phrase TMS. (GET /api2/v1/termBases)",
      annotations: { title: "[TMS] List Termbases", readOnlyHint: true },
      inputSchema: z.object({
        pageNumber: z.number().optional().describe("Page number, starting at 1."),
        pageSize: z.number().optional().describe("Number of results per page, max 50."),
      }),
    },
    async ({ pageNumber, pageSize }) => {
      const termbases = await runtime.client.get("/v1/termBases", {
        pageNumber: pageNumber ?? 1,
        pageSize: pageSize ?? 50,
      });
      return asTextContent(termbases);
    },
  );
}
