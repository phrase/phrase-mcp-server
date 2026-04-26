import { z } from "zod";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

const SAFE_FILENAME_PATTERN = /^[A-Za-z0-9._ -]+$/;

function sanitizeFilename(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("file_name cannot be empty.");
  }

  if (trimmed.includes("\r") || trimmed.includes("\n")) {
    throw new Error("file_name cannot contain CR/LF characters.");
  }

  if (!SAFE_FILENAME_PATTERN.test(trimmed)) {
    throw new Error(
      "file_name contains unsupported characters. Allowed: letters, numbers, space, dot, underscore, hyphen.",
    );
  }

  return trimmed;
}

export function registerImportTransMemoryTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_import_trans_memory",
    {
      description:
        "Import terms into a Phrase TMS translation memory. (POST /api2/v1/transMemories/{tmUid}/import)",
      annotations: { title: "[TMS] Import Translation Memory", destructiveHint: true },
      inputSchema: z.object({
        tm_uid: z.string().min(1).describe("The UID of the translation memory."),
        file_path: z.string().min(1).describe("Path to the TMX, XLSX, or CSV file."),
        file_name: z.string().optional().describe("Optional filename override."),
      }),
    },
    async ({ tm_uid, file_path, file_name }) => {
      const fileContent = await readFile(file_path);
      const fileName = sanitizeFilename(file_name ?? basename(file_path));

      const response = await runtime.client.postBinary(
        `/v1/transMemories/${encodeURIComponent(tm_uid)}/import`,
        fileContent,
        {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `filename="${fileName}"`,
        },
      );
      return asTextContent(response);
    },
  );
}
