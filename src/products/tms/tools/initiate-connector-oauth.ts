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
      annotations: { title: "[TMS] Initiate Connector OAuth", readOnlyHint: true },
      inputSchema: {
        connector_type: z
          .string()
          .describe('Connector type identifier, e.g. "CONTENTFUL2", "HUBSPOT", "GITHUB".'),
        data_center: z
          .enum(["EU", "US"])
          .optional()
          .describe('Contentful data centre. "EU" → be.eu.contentful.com, "US" → be.contentful.com. Ask the user if unsure.'),
      },
    },
    async ({ connector_type, data_center }) => {
      const client = runtime.client;

      // 1. Create a session uid used as the OAuth state parameter (API2 endpoint, accepts bearer token)
      const authData = (await client.postJson("/v1/connectors/connectorAuthData", {})) as {
        state: string;
      };
      const uid = authData.state;

      // 2. Get the OAuth URL template; only pass dataCenter for EU (omitting it gives be.contentful.com for US)
      const query = data_center === "EU" ? { dataCenter: "EU" } : undefined;
      const authPage = (await client.get(`/v1/connectorAuthPage/${connector_type}`, query)) as {
        url: string;
      };

      // 3. Derive the redirect URI from the TMS base URL
      // e.g. https://cloud.memsource.com/web/api2 → https://cloud.memsource.com/web/connector/receiveConnectorAuthCode
      const webRoot = client.baseUrl.replace(/\/api2\/?$/, "");
      const redirectUri = `${webRoot}/connector/receiveConnectorAuthCode`;

      // 4. Substitute {state} and {redirectUri} placeholders in the URL template
      const oauthUrl = authPage.url
        .replace(/\{state\}/g, uid)
        .replace(/\{redirectUri\}/g, encodeURIComponent(redirectUri));

      return asTextContent({
        oauth_url: oauthUrl,
        uid,
        redirect_uri: redirectUri,
        instructions:
          "Open oauth_url in a browser and complete the Contentful authorisation flow. Once redirected back to Phrase, call tms_poll_connector_auth_code with the uid to retrieve the authorisation code needed for tms_create_connector.",
      });
    },
  );
}
