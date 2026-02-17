import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HttpError } from "#lib/http.js";
import type { BinaryResponse } from "#lib/http.js";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

function shouldFallback(error: unknown): boolean {
  return error instanceof HttpError && (error.status === 400 || error.status === 404);
}

function tryDecodeFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null;
  }

  const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const encoded = match?.[1] ?? match?.[2];
  if (!encoded) {
    return null;
  }

  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

export function registerDownloadTargetFileByAsyncRequestTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_download_target_file_by_async_request",
    {
      description:
        "Download generated target file by async request ID (GET /api2/v2 or /api2/v3 projects/{projectUid}/jobs/{jobUid}/downloadTargetFile/{asyncRequestId}). Returns base64 content and metadata.",
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID."),
        job_uid: z.string().min(1).describe("TMS job UID."),
        async_request_id: z
          .string()
          .min(1)
          .describe("Async request ID returned by tms_download_target_file_async."),
        output_path: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Optional filesystem path to save the decoded file. If set, bytes_base64 is still returned.",
          ),
      },
    },
    async ({ project_uid, job_uid, async_request_id, output_path }) => {
      const client = runtime.client;
      const pathV3 = `/v3/projects/${encodeURIComponent(project_uid)}/jobs/${encodeURIComponent(job_uid)}/downloadTargetFile/${encodeURIComponent(async_request_id)}`;
      const pathV2 = `/v2/projects/${encodeURIComponent(project_uid)}/jobs/${encodeURIComponent(job_uid)}/downloadTargetFile/${encodeURIComponent(async_request_id)}`;

      let file: BinaryResponse;
      try {
        file = await client.getBinary(pathV3);
      } catch (error) {
        if (!shouldFallback(error)) {
          throw error;
        }
        file = await client.getBinary(pathV2);
      }

      let saved_to: string | null = null;
      if (output_path) {
        const absoluteOutputPath = resolve(output_path);
        await mkdir(dirname(absoluteOutputPath), { recursive: true });
        await writeFile(absoluteOutputPath, Buffer.from(file.bytesBase64, "base64"));
        saved_to = absoluteOutputPath;
      }

      return asTextContent({
        content_type: file.contentType,
        content_disposition: file.contentDisposition,
        file_name: tryDecodeFilename(file.contentDisposition),
        size_bytes: file.sizeBytes,
        bytes_base64: file.bytesBase64,
        saved_to,
      });
    },
  );
}
