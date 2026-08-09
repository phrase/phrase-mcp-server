import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListEnabledConnectorTypesTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_list_enabled_connector_types",
    {
      description:
        "List connector types that are enabled for this Phrase TMS organisation. Use this before creating a connector to verify the desired type (e.g. CONTENTFUL2) is available. (GET /api2/v3/connectors/enabled)",
      annotations: { title: "[TMS] List Enabled Connector Types", readOnlyHint: true },
      inputSchema: {},
    },
    async () => {
      const result = await runtime.client.get("/v3/connectors/enabled");
      return asTextContent(result);
    },
  );
}
