import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import { classifyGoogleDriveError } from "#products/connectors/tools/common";
import type { ProductRuntime } from "#products/types";

async function probeGoogleDriveConnectorHealth(
  runtime: ProductRuntime<"connectors">,
  connectorUuid: string,
): Promise<Record<string, unknown>> {
  try {
    await runtime.client.postJson("/google-drive/v1/sync/list-files", {
      connectorUuid,
      configuration: {},
      path: {
        pathType: "FOLDER",
        folderId: "root",
        drive: { driveType: "MY_DRIVE" },
        parentChain: [],
      },
      locale: "en",
    });

    return {
      status: "READY",
    };
  } catch (error) {
    const classified = classifyGoogleDriveError(error, {
      operation: "auth_probe",
      connectorUuid,
    });

    return {
      status:
        "code" in classified && typeof classified.code === "string"
          ? classified.code
          : "UNKNOWN_ERROR",
      message: classified.message,
    };
  }
}

export function registerListConnectorsTool(
  server: McpServer,
  runtime: ProductRuntime<"connectors">,
) {
  server.registerTool(
    "connectors_list_connectors",
    {
      description:
        "List Connectors API connectors. In v1, Phrase MCP supports only the google-drive connector for content operations.",
      inputSchema: {},
    },
    async () => {
      const response = await runtime.client.get("/connectors/v1");
      const connectors =
        response &&
        typeof response === "object" &&
        Array.isArray((response as { connectors?: unknown[] }).connectors)
          ? (response as { connectors: Array<Record<string, unknown>> }).connectors
          : [];

      const normalizedConnectors = await Promise.all(
        connectors.map(async (connector) => {
          const supportedInMcpV1 = connector.type === "GOOGLE_DRIVE2";

          return {
            ...connector,
            supported_in_mcp_v1: supportedInMcpV1,
            ...(supportedInMcpV1 &&
            typeof connector.connectorUuid === "string" &&
            connector.connectorUuid.length > 0
              ? {
                  health: await probeGoogleDriveConnectorHealth(runtime, connector.connectorUuid),
                }
              : {}),
          };
        }),
      );

      return asTextContent({
        connectors: normalizedConnectors,
      });
    },
  );
}
