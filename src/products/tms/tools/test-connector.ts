import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerTestConnectorTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_test_connector",
    {
      description:
        "Test a connector connection. Provide connector_id to test an existing saved connector by UID, or connector_payload to test a connector configuration before saving it. Use this after tms_create_connector to confirm the connection is working. (POST /api2/v1/connectors/testConnection)",
      annotations: { title: "[TMS] Test Connector", readOnlyHint: true },
      inputSchema: {
        connector_id: z
          .string()
          .optional()
          .describe(
            "UID of an existing connector to test by ID. When provided, connector_payload is ignored.",
          ),
        connector_payload: z
          .record(z.unknown())
          .optional()
          .describe(
            "Full connector payload to test before saving. Same shape as the connector field in tms_create_connector.",
          ),
      },
    },
    async ({ connector_id, connector_payload }) => {
      if (!connector_id && !connector_payload) {
        return asTextContent({
          error:
            "Provide either connector_id (to test an existing connector) or connector_payload (to test before saving).",
        });
      }

      const result = connector_id
        ? await runtime.client.postJson(`/v1/connectors/testConnection/${connector_id}`, {})
        : await runtime.client.postJson("/v1/connectors/testConnection", connector_payload);

      return asTextContent(result);
    },
  );
}
