import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HttpError } from "../../../lib/http.js";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { TmsClient } from "../client.js";

function shouldFallback(error: unknown): boolean {
  return error instanceof HttpError && (error.status === 400 || error.status === 404);
}

export function registerDownloadTargetFileAsyncTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "tms_download_target_file_async",
    {
      description:
        "Trigger asynchronous target file generation for a TMS job (PUT /api2/v2 or /api2/v3 projects/{projectUid}/jobs/{jobUid}/targetFile). Returns async request details.",
      inputSchema: {
        project_uid: z
          .string()
          .min(1)
          .describe("TMS project UID."),
        job_uid: z
          .string()
          .min(1)
          .describe("TMS job UID."),
        payload: z
          .record(z.unknown())
          .optional()
          .describe("Optional request body for target file export options."),
      },
    },
    async ({ project_uid, job_uid, payload }) => {
      const client = runtime.client as TmsClient;
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
