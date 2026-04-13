import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListFormatsTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_list_formats",
    {
      description: "List all localization file formats supported in Phrase Strings.",
      annotations: { title: "[Strings] List File Formats", readOnlyHint: true },
      inputSchema: {},
    },
    async () => {
      const formats = await runtime.client.formatsApi.formatsList();
      return asTextContent(formats);
    },
  );
}
