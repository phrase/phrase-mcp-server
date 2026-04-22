import { z } from "zod";
import { type Runtime } from "#products/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export function registerGetTermbaseTool(server: Server, runtime: Runtime) {
  server.registerTool(
    "tms_get_termbase",
    {
      description: "Get details for a specific Phrase TMS termbase.",
      annotations: { title: "[TMS] Get Termbase", readOnlyHint: true },
      inputSchema: z.object({
        termbase_uid: z.string().describe("The UID of the termbase."),
      }),
    },
    async (params) => {
      const client = runtime.createClient(params);
      const response = await client.request(
        "GET",
        `/web/api2/v1/termBases/${encodeURIComponent(params.termbase_uid)}`,
      );
      return response.data;
    },
  );
}
