import { z } from "zod";
import type { Runtime } from "#products/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export function registerGetTransMemoryTool(server: Server, runtime: Runtime) {
  server.registerTool(
    "tms_get_trans_memory",
    {
      description: "Get details for a specific Phrase TMS translation memory.",
      annotations: { title: "[TMS] Get Translation Memory", readOnlyHint: true },
      inputSchema: z.object({
        tm_uid: z.string().describe("The UID of the translation memory."),
      }),
    },
    async (params) => {
      const client = runtime.createClient(params);
      const response = await client.request(
        "GET",
        `/web/api2/v1/transMemories/${encodeURIComponent(params.tm_uid)}`,
      );
      return response.data;
    },
  );
}
