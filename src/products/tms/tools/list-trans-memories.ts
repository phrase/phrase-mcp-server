import { z } from "zod";
import { type Runtime } from "#products/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export function registerListTransMemoriesTool(server: Server, runtime: Runtime) {
  server.registerTool(
    "tms_list_trans_memories",
    {
      description: "List translation memories in Phrase TMS.",
      annotations: { title: "[TMS] List Translation Memories", readOnlyHint: true },
      inputSchema: z.object({
        pageNumber: z.number().optional().describe("Page number, starting at 1."),
        pageSize: z.number().optional().describe("Number of results per page, max 50."),
      }),
    },
    async (params) => {
      const client = runtime.createClient(params);
      const response = await client.request("GET", "/web/api2/v1/transMemories", {
        query: {
          pageNumber: params.pageNumber ?? 1,
          pageSize: params.pageSize ?? 50,
        },
      });
      return response.data;
    },
  );
}
