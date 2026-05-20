import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateConnectorTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_create_connector",
    {
      description:
        'Create a new connector in Phrase TMS. For OAuth-based connectors (CONTENTFUL2, HUBSPOT, GITHUB, etc.) use tms_initiate_connector_oauth then tms_poll_connector_auth_code first to obtain the code and redirectUri. Minimum fields for CONTENTFUL2: name, type, code, redirectUri, contentful2DataCenter ("EU"|"US"). (POST /api2/v1/connectors)',
      annotations: { title: "[TMS] Create Connector", destructiveHint: true },
      inputSchema: {
        connector: z
          .object({
            name: z.string().min(1),
            type: z.string().min(1),
          })
          .passthrough()
          .describe(
            'Connector payload. Required: name, type (e.g. "CONTENTFUL2"). ' +
              'Required for CONTENTFUL2: code (from tms_poll_connector_auth_code), redirectUri (from tms_initiate_connector_oauth), contentful2DataCenter ("EU"|"US"). ' +
              "Optional CONTENTFUL2 fields: defaultRemoteFolder, contentful2SpaceId, contentful2EnvironmentId, contentful2IncludeReferences, contentful2Tags, contentful2FollowAliases, contentful2IncludeAssets.",
          ),
      },
    },
    async ({ connector }) => {
      const created = await runtime.client.postJson("/v1/connectors", connector);
      return asTextContent(created);
    },
  );
}
