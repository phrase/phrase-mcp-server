import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HttpError } from "#lib/http";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

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
        "Trigger asynchronous generation of the translated (target) file for a TMS job. Returns an asyncRequest object with an id field. The file is NOT immediately available. Next: call tms_get_async_request with the returned id and poll until status = COMPLETED, then call tms_download_target_file_by_async_request to retrieve the file. (PUT /api2/v3/projects/{projectUid}/jobs/{jobUid}/targetFile)",
      annotations: { destructiveHint: true },
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID."),
        job_uid: z.string().min(1).describe("TMS job UID."),
        payload: z
          .object({})
          .passthrough()
          .optional()
          .describe(
            "Optional TargetFileRequest body with export options accepted by the TMS API. Omit or pass {} to use default export behavior.",
          ),
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
