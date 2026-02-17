import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "../../../lib/mcp.js";
import { ProductRuntime } from "../../types.js";
import { StringsClient } from "../client.js";

export function registerListFormatsTool(server: McpServer, runtime: ProductRuntime) {
  server.registerTool(
    "strings_list_formats",
    {
      description: "List all localization file formats supported in Phrase Strings.",
      inputSchema: {},
    },
    async () => {
      const formats = await (runtime.client as StringsClient).formatsApi.formatsList();
      return asTextContent(formats);
    },
  );
}
