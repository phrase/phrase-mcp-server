import { z } from "zod";
import type { Runtime } from "#products/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export function registerListTermbasesTool(server: Server, runtime: Runtime) {
  server.registerTool(
    "tms_list_termbases",
    {
      description: "List termbases in Phrase TMS.",
      annotations: { title: "[TMS] List Termbases", readOnlyHint: true },
      inputSchema: z.object({
        pageNumber: z.number().optional().describe("Page number, starting at 1."),
        pageSize: z.number().optional().describe("Number of results per page, max 50."),
      }),
    },
    async (params) => {
      const client = runtime.createClient(params);
      const response = await client.request("GET", "/v1/termBases", {
        query: {
          pageNumber: params.pageNumber ?? 1,
          pageSize: params.pageSize ?? 50,
        },
      });
      return response.data;
    },
  );
}
