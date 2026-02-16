import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { TmsClient } from "../client.js";

export function registerGetAsyncLimitsTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "tms_get_async_limits",
    {
      description:
        "Get current Phrase TMS asynchronous request limits and usage status (GET /api2/v1/async/status). Read-only operation.",
      inputSchema: {},
    },
    async () => {
      const limits = await (runtime.client as TmsClient).get("/v1/async/status");
      return asTextContent(limits);
    },
  );
}
