import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetLocaleDownloadTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_get_locale_download",
    {
      description: "Show status of an async locale download in a Phrase Strings project.",
      inputSchema: {
        project_id: z.string().min(1),
        locale_id: z.string().min(1),
        id: z.string().min(1),
      },
    },
    async ({ project_id, locale_id, id }) => {
      const localeDownload = await runtime.client.localeDownloadsApi.localeDownloadShow({
        projectId: project_id,
        localeId: locale_id,
        id,
      });
      return asTextContent(localeDownload);
    },
  );
}
