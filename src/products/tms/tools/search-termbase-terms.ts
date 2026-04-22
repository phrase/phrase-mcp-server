import { z } from "zod";
import type { Runtime } from "#products/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export function registerSearchTermbaseTermsTool(server: Server, runtime: Runtime) {
  server.registerTool(
    "tms_search_termbase_terms",
    {
      description: "Search for terms within a Phrase TMS termbase.",
      annotations: { title: "[TMS] Search Termbase Terms", readOnlyHint: true },
      inputSchema: z.object({
        termbase_uid: z.string().describe("The UID of the termbase."),
        query: z.string().describe("The term to search for."),
        lang: z.string().optional().describe("Language code (e.g., en, de)."),
      }),
    },
    async (params) => {
      const client = runtime.createClient(params);
      const response = await client.request(
        "POST",
        `/web/api2/v1/termBases/${encodeURIComponent(params.termbase_uid)}/search`,
        {
          body: {
            query: params.query,
            lang: params.lang,
          },
        },
      );
      return response.data;
    },
  );
}
