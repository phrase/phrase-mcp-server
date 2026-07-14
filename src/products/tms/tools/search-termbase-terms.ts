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
        sourceLang: z.string().optional().describe("Source language code (e.g., en, de)."),
        targetLangs: z
          .array(z.string())
          .optional()
          .describe('Target language codes (e.g., ["de", "fr"]).'),
      }),
    },
    async ({ termbase_uid, query, sourceLang, targetLangs }) => {
      const response = await runtime.client.postJson(
        `/v1/termBases/${encodeURIComponent(termbase_uid)}/search`,
        {
          query,
          sourceLang,
          targetLangs,
        },
      );
      return asTextContent(response);
    },
  );
}
