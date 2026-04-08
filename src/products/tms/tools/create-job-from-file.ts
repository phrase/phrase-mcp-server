import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import { APP_VERSION, PHRASE_TMS_CLIENT_TYPE } from "#lib/runtime-info";
import type { ProductRuntime } from "#products/types";
const SAFE_FILENAME_PATTERN = /^[A-Za-z0-9._ -]+$/;
const targetLangsSchema = z.array(z.string().min(1)).min(1);
const memsourceSchema = z
  .object({
    targetLangs: targetLangsSchema.optional(),
  })
  .passthrough();

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

export function registerCreateJobFromFileTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_create_job_from_file",
    {
      description:
        "Upload a source file from the MCP server filesystem to create translation jobs in a Phrase TMS project. One job is created per target language. Common supported formats: XLIFF, PO, DOCX, XLSX, HTML, JSON, SRT, and most standard content formats. (POST /api2/v1/projects/{projectUid}/jobs)",
      annotations: { destructiveHint: true },
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID."),
        file_path: z
          .string()
          .min(1)
          .describe(
            "Absolute or relative filesystem path to the source file on the MCP server host.",
          ),
        file_name: z
          .string()
          .min(1)
          .optional()
          .describe("Optional uploaded filename override (Content-Disposition filename)."),
        target_langs: targetLangsSchema
          .optional()
          .describe(
            'Target locale codes for the created job (recommended explicit input, for example ["es_es"]).',
          ),
        memsource: z
          .union([memsourceSchema, z.record(z.unknown())])
          .optional()
          .describe(
            "Optional Memsource header JSON. Must include targetLangs unless target_langs is provided top-level.",
          ),
      },
    },
    async ({ project_uid, file_path, file_name, target_langs, memsource }) => {
      const data = await readFile(file_path);
      const resolvedFilename = sanitizeFilename(file_name ?? basename(file_path));
      const mergedMemsource = {
        ...memsource,
        targetLangs: target_langs ?? memsource?.targetLangs,
        sourceData: {
          clientType: PHRASE_TMS_CLIENT_TYPE,
          clientVersion: APP_VERSION,
        },
      };

      if (!Array.isArray(mergedMemsource.targetLangs) || mergedMemsource.targetLangs.length === 0) {
        throw new Error(
          "Missing required target languages. Set target_langs or memsource.targetLangs.",
        );
      }

      const created = await runtime.client.postBinary(
        `/v1/projects/${encodeURIComponent(project_uid)}/jobs`,
        data,
        {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `filename="${resolvedFilename}"`,
          Memsource: JSON.stringify(mergedMemsource),
        },
      );

      return asTextContent(created);
    },
  );
}
