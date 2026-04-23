import { z } from "zod";
import type { Runtime } from "#products/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

export function registerExportTransMemoryTool(server: Server, runtime: Runtime) {
  server.registerTool(
    "tms_export_trans_memory",
    {
      description: "Export a Phrase TMS translation memory.",
      annotations: { title: "[TMS] Export Translation Memory", readOnlyHint: true },
      inputSchema: z.object({
        tm_uid: z.string().describe("The UID of the translation memory."),
        output_path: z.string().describe("Path to save the exported file."),
      }),
    },
    async (params) => {
      const client = runtime.createClient(params);
      const response = await client.request(
        "GET",
        `/v1/transMemories/${encodeURIComponent(params.tm_uid)}/export`,
      );
      const outputPath = resolve(params.output_path);
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, response.data);
      return { saved_to: outputPath };
    },
  );
}
