import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerInitiateConnectorOAuthTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_initiate_connector_oauth",
    {
      description:
        'Initiate the OAuth authorisation flow for a connector that requires browser-based authentication (e.g. CONTENTFUL2, HUBSPOT, GITHUB). Returns an OAuth URL the user must open in a browser, plus a session uid required by tms_poll_connector_auth_code. For CONTENTFUL2, ask the user their data centre: "EU" redirects to be.eu.contentful.com, "US" redirects to be.contentful.com. (POST /api2/v1/connectors/connectorAuthData + GET /api2/v1/connectorAuthPage/{type})',
      annotations: { title: "[TMS] Initiate Connector OAuth", destructiveHint: true },
      inputSchema: {
        connector_type: z
          .string()
          .min(1)
          .describe('Connector type identifier, e.g. "CONTENTFUL2", "HUBSPOT", "GITHUB".'),
        data_center: z
          .enum(["EU", "US"])
          .optional()
          .describe(
            'Contentful data centre. "EU" → be.eu.contentful.com, "US" → be.contentful.com. Ask the user if unsure.',
          ),
      },
    },
    async ({ connector_type, data_center }) => {
      const client = runtime.client;

      const authData = (await client.postJson("/v1/connectors/connectorAuthData", {})) as {
        state: string;
      };
      if (!authData.state) throw new Error("connectorAuthData response missing state");
      const uid = authData.state;

      // Only pass dataCenter for EU; omitting it gives be.contentful.com (US) for CONTENTFUL2
      const query = data_center === "EU" ? { dataCenter: "EU" } : undefined;
      const authPage = (await client.get(`/v1/connectorAuthPage/${connector_type}`, query)) as {
        url: string;
      };
      if (!authPage.url) throw new Error("connectorAuthPage response missing url");

      const redirectUri = client.connectorOAuthRedirectUri;
      const oauthUrl = authPage.url
        .replace(/\{state\}/g, uid)
        .replace(/\{redirectUri\}/g, encodeURIComponent(redirectUri));

      return asTextContent({
        oauth_url: oauthUrl,
        uid,
        redirect_uri: redirectUri,
        instructions:
          "Open oauth_url in a browser and complete the OAuth authorisation flow. Once redirected back to Phrase, call tms_poll_connector_auth_code with the uid to retrieve the authorisation code needed for tms_create_connector.",
      });
    },
  );
}
