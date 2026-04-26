import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
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

export function registerUploadTermbaseTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_upload_termbase",
    {
      description: "Upload/Import terms into a Phrase TMS termbase.",
      annotations: { title: "[TMS] Upload Termbase", destructiveHint: true },
      inputSchema: z.object({
        termbase_uid: z.string().min(1).describe("The UID of the termbase."),
        file_path: z.string().min(1).describe("Path to the TBX, XLSX, or CSV file."),
        file_name: z.string().optional().describe("Optional filename override."),
      }),
    },
    async ({ termbase_uid, file_path, file_name }) => {
      const fileContent = await readFile(file_path);
      const fileName = sanitizeFilename(file_name ?? basename(file_path));

      const response = await runtime.client.postBinary(
        `/v1/termBases/${encodeURIComponent(termbase_uid)}/upload`,
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
