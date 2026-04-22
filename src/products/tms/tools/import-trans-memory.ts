import { z } from "zod";
import { type Runtime } from "#products/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

export function registerImportTransMemoryTool(server: Server, runtime: Runtime) {
  server.registerTool(
    "tms_import_trans_memory",
    {
      description: "Import terms into a Phrase TMS translation memory.",
      annotations: { title: "[TMS] Import Translation Memory", destructiveHint: true },
      inputSchema: z.object({
        tm_uid: z.string().describe("The UID of the translation memory."),
        file_path: z.string().describe("Path to the TMX, XLSX, or CSV file."),
      }),
    },
    async (params) => {
      const client = runtime.createClient(params);
      const fileContent = await readFile(params.file_path);
      const fileName = basename(params.file_path);

      const response = await client.request(
        "POST",
        `/web/api2/v1/transMemories/${encodeURIComponent(params.tm_uid)}/import`,
        {
          body: fileContent,
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `filename="${fileName}"`,
          },
        },
      );
      return response.data;
    },
  );
}
