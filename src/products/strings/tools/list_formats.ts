import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";

export function registerListFormatsTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_list_formats",
    {
      description: "List all localization file formats supported in Phrase Strings.",
      inputSchema: {},
    },
    async () => {
      const formats = await runtime.client.formatsApi.formatsList();
      return asTextContent(formats);
    },
  );
}
