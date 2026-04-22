import { z } from "zod";
import { type Runtime } from "#products/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export function registerSearchTransMemoryTool(server: Server, runtime: Runtime) {
  server.registerTool(
    "tms_search_trans_memory",
    {
      description: "Search for segments in a Phrase TMS translation memory.",
      annotations: { title: "[TMS] Search Translation Memory", readOnlyHint: true },
      inputSchema: z.object({
        tm_uid: z.string().describe("The UID of the translation memory."),
        query: z.string().describe("The term/segment to search for."),
        lang: z.string().optional().describe("Language code."),
      }),
    },
    async (params) => {
      const client = runtime.createClient(params);
      const response = await client.request(
        "POST",
        `/web/api2/v1/transMemories/${encodeURIComponent(params.tm_uid)}/search`,
        { body: { query: params.query, lang: params.lang } },
      );
      return response.data;
    },
  );
}
