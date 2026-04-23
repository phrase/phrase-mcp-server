import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerExportTransMemoryTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_export_trans_memory",
    {
      description:
        "Export a Phrase TMS translation memory. (GET /api2/v1/transMemories/{tmUid}/export)",
      annotations: { title: "[TMS] Export Translation Memory", readOnlyHint: true },
      inputSchema: z.object({
        tm_uid: z.string().min(1).describe("The UID of the translation memory."),
        output_path: z.string().min(1).describe("Path to save the exported file."),
      }),
    },
    async ({ tm_uid, output_path }) => {
      const file = await runtime.client.getBinary(
        `/v1/transMemories/${encodeURIComponent(tm_uid)}/export`,
      );

      const absoluteOutputPath = resolve(output_path);
      await mkdir(dirname(absoluteOutputPath), { recursive: true });
      await writeFile(absoluteOutputPath, Buffer.from(file.bytesBase64, "base64"));

      return asTextContent({
        file_name: file.contentDisposition
          ? file.contentDisposition.split("filename=").pop()
          : "tm-export.tmx",
        saved_to: absoluteOutputPath,
        size_bytes: file.sizeBytes,
      });
    },
  );
}
