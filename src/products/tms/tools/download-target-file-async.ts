import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HttpError } from "#lib/http.js";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

function shouldFallback(error: unknown): boolean {
  return error instanceof HttpError && (error.status === 400 || error.status === 404);
}

export function registerDownloadTargetFileAsyncTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_download_target_file_async",
    {
      description:
        "Trigger asynchronous target file generation for a TMS job (PUT /api2/v2 or /api2/v3 projects/{projectUid}/jobs/{jobUid}/targetFile). Returns async request details. Note: TMS has limits on concurrent async operations. If limits are reached, the API will return 429/503 and automatic retry will occur. Check tms_get_async_limits beforehand if needed. Use tms_get_async_request to poll for completion, then tms_download_target_file_by_async_request to retrieve the file.",
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID."),
        job_uid: z.string().min(1).describe("TMS job UID."),
        payload: z
          .record(z.unknown())
          .optional()
          .describe("Optional request body for target file export options."),
      },
    },
    async ({ project_uid, job_uid, payload }) => {
      const client = runtime.client;
      const pathV3 = `/v3/projects/${encodeURIComponent(project_uid)}/jobs/${encodeURIComponent(job_uid)}/targetFile`;
      const pathV2 = `/v2/projects/${encodeURIComponent(project_uid)}/jobs/${encodeURIComponent(job_uid)}/targetFile`;

      try {
        const response = await client.putJson(pathV3, payload ?? {});
        return asTextContent(response);
      } catch (error) {
        if (!shouldFallback(error)) {
          throw error;
        }
      }

      const response = await client.putJson(pathV2, payload ?? {});
      return asTextContent(response);
    },
  );
}
