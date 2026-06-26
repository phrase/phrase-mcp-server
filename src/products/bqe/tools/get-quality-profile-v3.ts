import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetQualityProfileV3Tool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_get_quality_profile_v3",
    {
      description:
        "Fetch the quality profile (rules) for a Content Group from Phrase Quality Evaluator V3. Returns all rules configured in the Content Group, optionally filtered by locale. (GET /v3/qualityProfiles/{contentGroupId})",
      annotations: { title: "[BQE] Get Quality Profile", readOnlyHint: true },
      inputSchema: {
        contentGroupId: z
          .string()
          .min(1)
          .describe("ID of the Content Group to retrieve the quality profile for."),
        locale: z
          .string()
          .optional()
          .describe(
            "Filter rules to those applicable to a specific locale code (e.g. de_de). Omit to return all rules.",
          ),
      },
    },
    async ({ contentGroupId, locale }) => {
      const result = await runtime.client.get(
        `/v3/qualityProfiles/${encodeURIComponent(contentGroupId)}`,
        locale !== undefined ? { locale } : undefined,
      );
      return asTextContent(result);
    },
  );
}
