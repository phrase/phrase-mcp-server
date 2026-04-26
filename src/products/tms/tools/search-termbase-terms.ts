import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerSearchTermbaseTermsTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_search_termbase_terms",
    {
      description:
        "Search for terms within a Phrase TMS termbase. (POST /api2/v1/termBases/{uid}/search)",
      annotations: { title: "[TMS] Search Termbase Terms", readOnlyHint: true },
      inputSchema: z.object({
        termbase_uid: z.string().min(1).describe("The UID of the termbase."),
        query: z.string().min(1).describe("The term to search for."),
        lang: z.string().optional().describe("Language code (e.g., en, de)."),
      }),
    },
    async ({ termbase_uid, query, lang }) => {
      const response = await runtime.client.postJson(
        `/v1/termBases/${encodeURIComponent(termbase_uid)}/search`,
        {
          query,
          lang,
        },
      );
      return asTextContent(response);
    },
  );
}
