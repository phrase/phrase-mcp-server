import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import {
  classifyGoogleDriveError,
  formatBinaryResult,
  normalizeGoogleDriveRequest,
  requireSupportedConnector,
} from "#products/connectors/tools/common";
import type { ProductRuntime } from "#products/types";

export function registerDownloadRawTool(server: McpServer, runtime: ProductRuntime<"connectors">) {
  server.registerTool(
    "connectors_download_raw",
    {
      description:
        "Download raw Google Drive content through the Connectors API. request must mirror the Bifrost Google Drive download-raw-file request body and use request.connectorUuid.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        connector: z.string().min(1),
        request: z.object({}).passthrough(),
        output_path: z.string().min(1).optional(),
      },
    },
    async ({ connector, request, output_path }) => {
      requireSupportedConnector(connector);
      const normalizedRequest = normalizeGoogleDriveRequest(request, {
        requirePath: true,
      });

      try {
        const file = await runtime.client.postBinary(
          "/google-drive/v1/sync/download-raw-file",
          normalizedRequest,
          { "X-ResponseType": "OBJECT" },
        );

        return asTextContent(await formatBinaryResult(file, output_path));
      } catch (error) {
        throw classifyGoogleDriveError(error, {
          operation: "download",
          connectorUuid:
            typeof normalizedRequest.connectorUuid === "string"
              ? normalizedRequest.connectorUuid
              : undefined,
        });
      }
    },
  );
}
