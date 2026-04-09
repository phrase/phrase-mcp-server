import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import {
  classifyGoogleDriveError,
  normalizeGoogleDriveRequest,
  requireSupportedConnector,
} from "#products/connectors/tools/common";
import type { ProductRuntime } from "#products/types";

export function registerListContentTool(server: McpServer, runtime: ProductRuntime<"connectors">) {
  server.registerTool(
    "connectors_list_content",
    {
      description:
        "List Google Drive content through the Connectors API. Pass request.connectorUuid plus request.configuration (usually {}). If request.path is omitted, the MCP wrapper lists the Google Drive navigation root with { pathType: 'ROOT' }.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        connector: z.string().min(1),
        request: z
          .object({})
          .passthrough()
          .describe(
            "Google Drive list-files request body. request.connectorUuid is required. request.configuration is required and is usually {}. Omitting request.path defaults the list target to { pathType: 'ROOT' }.",
          ),
      },
    },
    async ({ connector, request }) => {
      requireSupportedConnector(connector);
      const normalizedRequest = normalizeGoogleDriveRequest(request, {
        defaultRootPath: true,
      });

      try {
        const response = await runtime.client.postJson(
          "/google-drive/v1/sync/list-files",
          normalizedRequest,
        );
        return asTextContent(response);
      } catch (error) {
        throw classifyGoogleDriveError(error, {
          operation: "list",
          connectorUuid:
            typeof normalizedRequest.connectorUuid === "string"
              ? normalizedRequest.connectorUuid
              : undefined,
        });
      }
    },
  );
}
