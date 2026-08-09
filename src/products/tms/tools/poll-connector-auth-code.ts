import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerPollConnectorAuthCodeTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_poll_connector_auth_code",
    {
      description:
        "Retrieve the OAuth authorisation code after the user has completed the browser authentication flow started by tms_initiate_connector_oauth. Call this once the user confirms they have authorised the connector in their browser. Returns the code and redirect_uri needed for tms_create_connector. (GET /api2/v1/connectors/connectorAuthCode/{uid})",
      annotations: { title: "[TMS] Poll Connector Auth Code", readOnlyHint: true },
      inputSchema: {
        uid: z.string().min(1).describe("Session uid returned by tms_initiate_connector_oauth."),
      },
    },
    async ({ uid }) => {
      const client = runtime.client;
      const result = (await client.get(`/v1/connectors/connectorAuthCode/${uid}`)) as {
        code?: string;
        cancelled?: boolean;
      };

      if (result.cancelled) {
        return asTextContent({
          status: "cancelled",
          message: "The OAuth flow was cancelled. Start again with tms_initiate_connector_oauth.",
        });
      }

      if (!result.code) {
        return asTextContent({
          status: "pending",
          message:
            "No authorisation code yet. Ask the user to complete the OAuth flow in their browser, then call this tool again with the same uid.",
        });
      }

      const redirectUri = client.connectorOAuthRedirectUri;

      return asTextContent({
        status: "success",
        code: result.code,
        redirect_uri: redirectUri,
        next_step:
          "Use both code and redirect_uri above in the tms_create_connector payload. The redirectUri field in the connector payload must exactly match the redirect_uri value here.",
      });
    },
  );
}
