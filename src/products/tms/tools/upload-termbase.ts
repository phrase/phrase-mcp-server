import { z } from "zod";
import type { Runtime } from "#products/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

export function registerUploadTermbaseTool(server: Server, runtime: Runtime) {
  server.registerTool(
    "tms_upload_termbase",
    {
      description: "Upload/Import terms into a Phrase TMS termbase.",
      annotations: { title: "[TMS] Upload Termbase", destructiveHint: true },
      inputSchema: z.object({
        termbase_uid: z.string().describe("The UID of the termbase."),
        file_path: z.string().describe("Path to the TBX, XLSX, or CSV file."),
      }),
    },
    async (params) => {
      const client = runtime.createClient(params);
      const fileContent = await readFile(params.file_path);
      const fileName = basename(params.file_path);

      const response = await client.request(
        "POST",
        `/web/api2/v1/termBases/${encodeURIComponent(params.termbase_uid)}/upload`,
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
